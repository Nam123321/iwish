#!/usr/bin/env python3
"""
merge-audit.py — Semantic Merge Audit Hook (Core Logic)
========================================================
# Part of: I-Wish / code-search skill (Story 2.2)

Pre-merge verification that uses Semble to detect stale symbol references
across active branches before merging parallel agent work.

Flow:
  1. Parse `git diff` of a branch to extract modified symbols
  2. Use Semble `find-related` / `dispatch_search` to find all call-sites
  3. Cross-reference with other active branches to detect stale references
  4. Output an audit report with SAFE/UNSAFE merge verdict

Usage:
  python3 merge-audit.py --branch story-1.1 --target main --project /path/to/project

Output: JSON audit report to stdout.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

# ── Import code-search.py from the same directory ──────────────────────────

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

# Rename-import since the module file has a hyphen (can't import directly)
import importlib.util

_spec = importlib.util.spec_from_file_location("code_search", SCRIPTS_DIR / "code-search.py")
_semble_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_semble_mod)

dispatch_search = _semble_mod.dispatch_search
dispatch_find_related = _semble_mod.dispatch_find_related


# ── Data Models ──────────────────────────────────────────────────────────────

@dataclass
class ModifiedSymbol:
    """A symbol (function, class, variable, method) extracted from a git diff."""
    name: str
    type: str          # 'function' | 'class' | 'variable' | 'method'
    file_path: str
    action: str        # 'modified' | 'renamed' | 'deleted' | 'added'
    line_number: int = 0


@dataclass
class CallSite:
    """A location where a modified symbol is referenced."""
    symbol: str
    referenced_in: str
    line: int
    content: str = ""
    score: float = 0.0


@dataclass
class StaleReference:
    """A stale reference found in another branch."""
    symbol: str
    branch: str
    file_path: str
    reason: str        # e.g. "Branch modifies file that calls deleted symbol"


@dataclass
class AuditReport:
    """Full audit report for a merge."""
    branch: str
    target: str
    modified_symbols: list[dict] = field(default_factory=list)
    call_sites: list[dict] = field(default_factory=list)
    stale_references: list[dict] = field(default_factory=list)
    verdict: str = "SAFE"
    summary: str = ""
    engine: str = "unknown"
    errors: list[str] = field(default_factory=list)


# ── Symbol Extraction Patterns ───────────────────────────────────────────────

# Python patterns
PY_FUNCTION = re.compile(r'^\s*(?:async\s+)?def\s+([a-zA-Z_]\w*)\s*\(')
PY_CLASS = re.compile(r'^\s*class\s+([a-zA-Z_]\w*)\s*[:\(]')
PY_VARIABLE = re.compile(r'^([a-zA-Z_]\w*)\s*(?::\s*\w+\s*)?=\s*(?!.*(?:def|class)\s)')
PY_METHOD = re.compile(r'^\s{4,}(?:async\s+)?def\s+([a-zA-Z_]\w*)\s*\(')

# TypeScript / JavaScript patterns
TS_FUNCTION = re.compile(r'^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$]\w*)\s*[\(<]')
TS_ARROW = re.compile(r'^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>')
TS_CLASS = re.compile(r'^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Z]\w*)')
TS_CONST = re.compile(r'^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*(?::\s*[^=]+)?\s*=')
TS_EXPORT = re.compile(r'^\s*export\s+(?:default\s+)?(?:const|let|var|function|class|type|interface)\s+([a-zA-Z_$]\w*)')

# Go patterns
GO_FUNC = re.compile(r'^\s*func\s+(?:\([^)]+\)\s+)?([A-Za-z_]\w*)\s*\(')
GO_TYPE = re.compile(r'^\s*type\s+([A-Z]\w*)\s+(?:struct|interface)\s*\{')

# Common noise to filter out
NOISE_NAMES = frozenset({
    '__init__', '__str__', '__repr__', '__eq__', '__hash__', '__len__',
    '__enter__', '__exit__', '__iter__', '__next__', '__call__',
    'main', 'test', 'setup', 'teardown', 'setUp', 'tearDown',
    'toString', 'equals', 'hashCode',
})


def _detect_lang(file_path: str) -> str:
    """Detect language from file extension."""
    ext = Path(file_path).suffix.lower()
    if ext in ('.py',):
        return 'python'
    if ext in ('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'):
        return 'typescript'
    if ext in ('.go',):
        return 'go'
    return 'unknown'


def extract_modified_symbols(diff_text: str) -> list[ModifiedSymbol]:
    """Extract function/class/variable names from git diff output.

    Parses unified diff format, looking for added/removed/modified lines
    that contain symbol definitions.

    Returns: list of ModifiedSymbol with name, type, file_path, action.
    """
    symbols: list[ModifiedSymbol] = []
    seen: set[tuple[str, str, str]] = set()  # (name, type, file_path) dedup
    current_file: str = ""
    current_line: int = 0
    rename_map: dict[str, str] = {}   # old_name -> new_name for renames

    for raw_line in diff_text.splitlines():
        # Track current file from diff header
        if raw_line.startswith('diff --git'):
            # Extract b/ path  (e.g., diff --git a/foo.py b/foo.py)
            match = re.search(r'b/(.+)$', raw_line)
            if match:
                current_file = match.group(1)
            continue

        # Track deleted file
        if raw_line.startswith('deleted file mode'):
            # Whole file deleted — symbols extracted from - lines below
            continue

        # Track rename
        if raw_line.startswith('rename from '):
            rename_map['_pending_from'] = raw_line.split(' ', 2)[2]
            continue
        if raw_line.startswith('rename to '):
            rename_map['_pending_to'] = raw_line.split(' ', 2)[2]
            continue

        # Track hunk header for approximate line numbers
        hunk_match = re.match(r'^@@ -\d+(?:,\d+)? \+(\d+)', raw_line)
        if hunk_match:
            current_line = int(hunk_match.group(1))
            continue

        # Only process added (+) or removed (-) lines for symbol extraction
        if not raw_line.startswith(('+', '-')) or raw_line.startswith(('+++', '---')):
            # Context lines: still advance line counter
            if not raw_line.startswith(('diff ', '@@ ', 'index ', 'new ', 'old ')):
                current_line += 1
            continue

        is_added = raw_line.startswith('+')
        is_removed = raw_line.startswith('-')
        line_content = raw_line[1:]  # strip the +/- prefix

        # Determine action
        action = 'added' if is_added else 'deleted'

        lang = _detect_lang(current_file)
        extracted = _extract_symbols_from_line(line_content, lang)

        for sym_name, sym_type in extracted:
            if sym_name in NOISE_NAMES:
                continue

            dedup_key = (sym_name, sym_type, current_file)
            if dedup_key in seen:
                # If we've seen this as 'deleted' and now 'added', it's 'modified'
                for s in symbols:
                    if s.name == sym_name and s.type == sym_type and s.file_path == current_file:
                        if s.action == 'deleted' and action == 'added':
                            s.action = 'modified'
                        elif s.action == 'added' and action == 'deleted':
                            s.action = 'modified'
                continue

            seen.add(dedup_key)
            symbols.append(ModifiedSymbol(
                name=sym_name,
                type=sym_type,
                file_path=current_file,
                action=action,
                line_number=current_line,
            ))

        # Advance line counter for added lines
        if is_added:
            current_line += 1

    # Post-process: detect renames (same type deleted in one place, added in another)
    _detect_renames(symbols)

    return symbols


def _extract_symbols_from_line(line: str, lang: str) -> list[tuple[str, str]]:
    """Extract (name, type) pairs from a single code line."""
    results: list[tuple[str, str]] = []

    if lang == 'python':
        m = PY_METHOD.match(line)
        if m:
            results.append((m.group(1), 'method'))
            return results  # method takes priority over function

        m = PY_FUNCTION.match(line)
        if m:
            results.append((m.group(1), 'function'))
            return results

        m = PY_CLASS.match(line)
        if m:
            results.append((m.group(1), 'class'))
            return results

        m = PY_VARIABLE.match(line)
        if m:
            name = m.group(1)
            # Filter out common non-symbol names
            if not name.startswith('_') and name.upper() != name:
                results.append((name, 'variable'))
            elif name.isupper() and len(name) > 1:
                # CONSTANT = value → still a variable
                results.append((name, 'variable'))
            return results

    elif lang == 'typescript':
        # Check arrow functions before const (arrow is more specific)
        m = TS_ARROW.match(line)
        if m:
            results.append((m.group(1), 'function'))
            return results

        m = TS_FUNCTION.match(line)
        if m:
            results.append((m.group(1), 'function'))
            return results

        m = TS_CLASS.match(line)
        if m:
            results.append((m.group(1), 'class'))
            return results

        m = TS_EXPORT.match(line)
        if m:
            results.append((m.group(1), 'variable'))
            return results

        m = TS_CONST.match(line)
        if m:
            results.append((m.group(1), 'variable'))
            return results

    elif lang == 'go':
        m = GO_FUNC.match(line)
        if m:
            results.append((m.group(1), 'function'))
            return results

        m = GO_TYPE.match(line)
        if m:
            results.append((m.group(1), 'class'))
            return results

    return results


def _detect_renames(symbols: list[ModifiedSymbol]) -> None:
    """Post-process symbols to detect renames (deleted + added of same type)."""
    deleted = [s for s in symbols if s.action == 'deleted']
    added = [s for s in symbols if s.action == 'added']

    for d in deleted:
        for a in added:
            if (d.type == a.type and d.file_path == a.file_path
                    and d.name != a.name):
                # Same type, same file, different name → likely a rename
                d.action = 'renamed'
                a.action = 'renamed'


# ── Git Operations ───────────────────────────────────────────────────────────

def get_git_diff(branch: str, target: str, project: str) -> str:
    """Get the unified diff between branch and target."""
    try:
        result = subprocess.run(
            ['git', 'diff', f'{target}...{branch}', '--unified=3'],
            capture_output=True, text=True, timeout=30,
            cwd=project,
        )
        if result.returncode != 0:
            print(f"[merge-audit] git diff error: {result.stderr}", file=sys.stderr)
            return ""
        return result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"[merge-audit] git diff failed: {e}", file=sys.stderr)
        return ""


def get_active_branches(project: str) -> list[str]:
    """List active story/feature branches."""
    try:
        result = subprocess.run(
            ['git', 'branch', '--list', 'story-*', 'feature-*', '--format=%(refname:short)'],
            capture_output=True, text=True, timeout=15,
            cwd=project,
        )
        if result.returncode != 0:
            # Fallback: list all branches
            result = subprocess.run(
                ['git', 'branch', '--format=%(refname:short)'],
                capture_output=True, text=True, timeout=15,
                cwd=project,
            )
        branches = [b.strip() for b in result.stdout.strip().splitlines() if b.strip()]
        return branches
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"[merge-audit] branch list failed: {e}", file=sys.stderr)
        return []


def get_branch_modified_files(branch: str, target: str, project: str) -> set[str]:
    """Get the set of files modified in a branch relative to target."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--name-only', f'{target}...{branch}'],
            capture_output=True, text=True, timeout=15,
            cwd=project,
        )
        if result.returncode != 0:
            return set()
        return {f.strip() for f in result.stdout.strip().splitlines() if f.strip()}
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return set()


# ── Call-site Discovery ──────────────────────────────────────────────────────

def find_call_sites(
    symbols: list[ModifiedSymbol],
    project: str,
    top_k: int = 10,
) -> list[CallSite]:
    """Use Semble to find all call-sites for each modified/deleted symbol.

    Searches for references to each symbol in the codebase, filtering out
    the symbol's own definition file to focus on callers.
    """
    call_sites: list[CallSite] = []
    seen: set[tuple[str, str, int]] = set()  # (symbol, file, line) dedup

    for sym in symbols:
        # Skip added-only symbols (no existing call-sites to worry about)
        if sym.action == 'added':
            continue

        # Search for the symbol name in the project
        try:
            result = dispatch_search(
                query=sym.name,
                path=project,
                top_k=top_k,
                content="code",
            )
        except Exception as e:
            print(f"[merge-audit] Semble search failed for '{sym.name}': {e}", file=sys.stderr)
            continue

        for r in result.get("results", []):
            ref_file = r.get("file_path", "")
            ref_line = r.get("start_line", 0)
            content = r.get("content", "")
            score = r.get("score", 0.0)

            # Skip the definition file itself (we want callers, not the definition)
            if ref_file == sym.file_path:
                continue

            # Verify the symbol name actually appears in the content
            if sym.name not in content:
                continue

            dedup_key = (sym.name, ref_file, ref_line)
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            call_sites.append(CallSite(
                symbol=sym.name,
                referenced_in=ref_file,
                line=ref_line,
                content=content[:200],
                score=score,
            ))

    return call_sites


# ── Cross-branch Stale Reference Check ───────────────────────────────────────

def check_stale_references(
    symbols: list[ModifiedSymbol],
    call_sites: list[CallSite],
    source_branch: str,
    target: str,
    project: str,
) -> list[StaleReference]:
    """Check if any active branch modifies a file that references a changed symbol.

    A stale reference occurs when:
      - Branch A modifies/deletes/renames symbol X
      - Branch B (active) modifies a file that calls symbol X
      - Branch B doesn't know about the change → merge will break
    """
    stale_refs: list[StaleReference] = []
    active_branches = get_active_branches(project)

    # Filter out the source branch and target
    other_branches = [
        b for b in active_branches
        if b != source_branch and b != target and not b.startswith('*')
    ]

    if not other_branches:
        return stale_refs

    # Build a map: file → set of symbols referenced in that file
    file_to_symbols: dict[str, set[str]] = {}
    for cs in call_sites:
        file_to_symbols.setdefault(cs.referenced_in, set()).add(cs.symbol)

    # Symbols that are dangerous (modified, deleted, or renamed)
    dangerous_symbols = {
        s.name: s for s in symbols
        if s.action in ('deleted', 'renamed', 'modified')
    }

    if not dangerous_symbols:
        return stale_refs

    # For each other branch, check if it modifies any file that references a dangerous symbol
    for branch in other_branches:
        try:
            branch_files = get_branch_modified_files(branch, target, project)
        except Exception:
            continue

        for bfile in branch_files:
            if bfile in file_to_symbols:
                overlapping_symbols = file_to_symbols[bfile] & set(dangerous_symbols.keys())
                for sym_name in overlapping_symbols:
                    sym = dangerous_symbols[sym_name]
                    reason = (
                        f"Branch '{branch}' modifies '{bfile}' which calls "
                        f"'{sym_name}' ({sym.action} in '{source_branch}')"
                    )
                    stale_refs.append(StaleReference(
                        symbol=sym_name,
                        branch=branch,
                        file_path=bfile,
                        reason=reason,
                    ))

    return stale_refs


# ── Main Audit Flow ──────────────────────────────────────────────────────────

def run_audit(branch: str, target: str, project: str) -> AuditReport:
    """Execute the full merge audit pipeline.

    Steps:
      1. Get git diff between branch and target
      2. Extract modified symbols from the diff
      3. Find call-sites for each symbol via Semble
      4. Cross-reference with other active branches
      5. Produce verdict
    """
    report = AuditReport(branch=branch, target=target)

    # Step 1: Get the diff
    diff_text = get_git_diff(branch, target, project)
    if not diff_text:
        report.summary = "No diff found between branches (empty diff or git error)"
        report.verdict = "SAFE"
        return report

    # Step 2: Extract symbols
    try:
        symbols = extract_modified_symbols(diff_text)
    except Exception as e:
        report.errors.append(f"Symbol extraction failed: {e}")
        report.summary = "Audit incomplete: symbol extraction failed"
        report.verdict = "UNKNOWN"
        return report

    report.modified_symbols = [asdict(s) for s in symbols]

    if not symbols:
        report.summary = "No modified symbols detected in diff"
        report.verdict = "SAFE"
        return report

    # Step 3: Find call-sites
    try:
        call_sites = find_call_sites(symbols, project)
        report.call_sites = [asdict(cs) for cs in call_sites]
    except Exception as e:
        report.errors.append(f"Call-site discovery failed: {e}")
        report.summary = "Audit incomplete: call-site search failed"
        report.verdict = "UNKNOWN"
        return report

    # Step 4: Cross-branch stale reference check
    try:
        stale_refs = check_stale_references(
            symbols, call_sites, branch, target, project
        )
        report.stale_references = [asdict(sr) for sr in stale_refs]
    except Exception as e:
        report.errors.append(f"Stale reference check failed: {e}")
        report.summary = "Audit incomplete: cross-branch check failed"
        report.verdict = "UNKNOWN"
        return report

    # Step 5: Produce verdict
    active_count = len(get_active_branches(project))
    sym_count = len(symbols)
    cs_count = len(call_sites)
    stale_count = len(stale_refs)

    if stale_count > 0:
        report.verdict = "UNSAFE"
        affected_branches = list({sr.branch for sr in stale_refs})
        report.summary = (
            f"⚠️  {stale_count} stale reference(s) detected across "
            f"{len(affected_branches)} branch(es): {', '.join(affected_branches)}. "
            f"Reviewed {sym_count} modified symbol(s), found {cs_count} call-site(s) "
            f"across {active_count} active branch(es)."
        )
    else:
        report.verdict = "SAFE"
        report.summary = (
            f"No stale references detected. "
            f"Reviewed {sym_count} modified symbol(s), found {cs_count} call-site(s) "
            f"across {active_count} active branch(es)."
        )

    return report


# ── CLI Entry Point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Semantic Merge Audit Hook — Detects stale symbol references across branches",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 merge-audit.py --branch story-1.1 --target main --project /path/to/project
  python3 merge-audit.py --branch feature-auth --target develop --project .
        """,
    )

    parser.add_argument(
        '--branch', '-b', required=True,
        help='Branch being merged (source)',
    )
    parser.add_argument(
        '--target', '-t', default='main',
        help='Target branch to merge into (default: main)',
    )
    parser.add_argument(
        '--project', '-p', default='.',
        help='Project root directory (default: .)',
    )
    parser.add_argument(
        '--format', choices=['json', 'summary'], default='json',
        help='Output format (default: json)',
    )

    args = parser.parse_args()

    # Resolve project path
    project = str(Path(args.project).resolve())

    # Run audit
    report = run_audit(args.branch, args.target, project)

    # Output
    if args.format == 'summary':
        # Human-readable summary to stderr, verdict to stdout
        print(f"Branch:   {report.branch}", file=sys.stderr)
        print(f"Target:   {report.target}", file=sys.stderr)
        print(f"Symbols:  {len(report.modified_symbols)}", file=sys.stderr)
        print(f"CallSites:{len(report.call_sites)}", file=sys.stderr)
        print(f"Stale:    {len(report.stale_references)}", file=sys.stderr)
        print(f"Summary:  {report.summary}", file=sys.stderr)
        print(report.verdict)
    else:
        print(json.dumps(asdict(report), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
