#!/usr/bin/env python3
"""
# code-search.py — Python Bridge for Semble Hybrid Code Search
# ================================================================
# Part of: I-Wish / code-search skill (Story 1.1)
# 
# Provides programmatic Python access to Semble's hybrid search engine
# with automatic fallback to subprocess CLI and grep.
# 
# Usage:
#   python3 code-search.py --query "<query>" --path <path> [--top-k 5]
#   python3 code-search.py --find-related --file <file> --line <line> --path <path>
#   python3 code-search.py --multi-query --queries-file <json_file> --path <path>
# 
# Output: JSON to stdout matching the code-search output contract.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_TOP_K = 5
DEFAULT_CONTENT = "code"
SUPPORTED_EXTENSIONS = {
    ".py", ".ts", ".js", ".tsx", ".jsx", ".go", ".rs",
    ".java", ".rb", ".sh", ".md", ".yaml", ".yml", ".json",
    ".toml", ".cfg", ".ini", ".sql", ".html", ".css", ".scss",
}


# ── Engine Detection ──────────────────────────────────────────────────────────

def detect_engine() -> str:
    """Detect the best available search engine."""
    # Tier 1: Try importing semble directly
    try:
        import semble  # noqa: F401
        return "semble-python"
    except ImportError:
        pass

    # Tier 2: Check for semble CLI
    if shutil.which("semble"):
        return "semble-cli"

    # Tier 3: Check for uvx
    if shutil.which("uvx"):
        return "uvx"

    # Tier 4: Fallback to grep
    return "grep"


# ── Semble Python API (Tier 1 — Direct Import) ───────────────────────────────

def search_semble_python(query: str, path: str, top_k: int, content: str) -> dict:
    """Use semble's Python API directly for maximum performance."""
    from semble.index import SembleIndex
    from semble.types import ContentType
    from semble.utils import format_results

    content_types = (
        [ContentType.CODE, ContentType.DOCS, ContentType.CONFIG]
        if content == "all"
        else [ContentType(content)]
    )

    index = SembleIndex.from_path(path, content=content_types)
    results = index.search(query, top_k=top_k)

    if not results:
        return {"query": query, "engine": "semble-python", "results": []}

    formatted = format_results(query, results)
    formatted["engine"] = "semble-python"
    return formatted


def find_related_semble_python(file_path: str, line: int, path: str, top_k: int) -> dict:
    """Use semble's Python API for find-related."""
    from semble.index import SembleIndex
    from semble.types import ContentType
    from semble.utils import format_results, resolve_chunk

    index = SembleIndex.from_path(path, content=[ContentType.CODE])
    chunk = resolve_chunk(index.chunks, file_path, line)

    if chunk is None:
        return {
            "query": f"find-related {file_path}:{line}",
            "engine": "semble-python",
            "error": f"No chunk found at {file_path}:{line}",
            "results": [],
        }

    results = index.find_related(chunk, top_k=top_k)
    if not results:
        return {
            "query": f"find-related {file_path}:{line}",
            "engine": "semble-python",
            "results": [],
        }

    formatted = format_results(f"Chunks related to {file_path}:{line}", results)
    formatted["engine"] = "semble-python"
    return formatted


# ── CLI Subprocess (Tier 2/3 — semble CLI or uvx) ────────────────────────────

def search_cli(query: str, path: str, top_k: int, content: str, engine: str) -> dict:
    """Run semble search via CLI subprocess."""
    if engine == "semble-cli":
        cmd = ["semble", "search", query, path, "--top-k", str(top_k), "--content", content]
    else:  # uvx
        cmd = ["uvx", "--from", "semble", "semble", "search", query, path, "--top-k", str(top_k), "--content", content]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=os.getcwd(),
        )
        if result.returncode == 0:
            output = json.loads(result.stdout)
            output["engine"] = engine
            return output
        else:
            print(f"[code-search] CLI error: {result.stderr}", file=sys.stderr)
            return {"query": query, "engine": engine, "error": result.stderr, "results": []}
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
        print(f"[code-search] CLI failed: {e}", file=sys.stderr)
        return {"query": query, "engine": engine, "error": str(e), "results": []}


def find_related_cli(file_path: str, line: int, path: str, top_k: int, engine: str) -> dict:
    """Run semble find-related via CLI subprocess."""
    if engine == "semble-cli":
        cmd = ["semble", "find-related", file_path, str(line), path, "--top-k", str(top_k)]
    else:
        cmd = ["uvx", "--from", "semble", "semble", "find-related", file_path, str(line), path, "--top-k", str(top_k)]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            output = json.loads(result.stdout)
            output["engine"] = engine
            return output
        else:
            return {"query": f"find-related {file_path}:{line}", "engine": engine, "error": result.stderr, "results": []}
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
        return {"query": f"find-related {file_path}:{line}", "engine": engine, "error": str(e), "results": []}


# ── Grep Fallback (Tier 4 — Lexical Only) ────────────────────────────────────

def search_grep(query: str, path: str, top_k: int) -> dict:
    """Basic grep-based search when semble is unavailable."""
    print(
        "[code-search] ⚠️  WARNING: Semantic search unavailable. "
        "Using lexical grep fallback.",
        file=sys.stderr,
    )

    results = []
    search_path = Path(path).resolve()

    # Split query into searchable terms
    terms = [t for t in re.split(r'\s+', query) if len(t) > 2]
    if not terms:
        terms = [query]

    # Use the most specific term for primary search
    primary_term = max(terms, key=len)

    try:
        cmd = [
            "grep", "-rnI",
            "--include=*.py", "--include=*.ts", "--include=*.js",
            "--include=*.tsx", "--include=*.jsx", "--include=*.go",
            "--include=*.rs", "--include=*.java", "--include=*.rb",
            "--include=*.sh", "--include=*.md",
            "--", primary_term, str(search_path),
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30
        )

        score = 0.5
        for line in result.stdout.strip().split("\n"):
            if not line or len(results) >= top_k:
                break

            parts = line.split(":", 2)
            if len(parts) < 3:
                continue

            file_path, line_num, content = parts[0], parts[1], parts[2]

            try:
                start_line = int(line_num)
            except ValueError:
                continue

            # Count how many query terms match in the content
            matches = sum(1 for t in terms if t.lower() in content.lower())
            adjusted_score = min(score + (matches * 0.1), 1.0)

            results.append({
                "file_path": str(Path(file_path).relative_to(search_path))
                if file_path.startswith(str(search_path))
                else file_path,
                "start_line": start_line,
                "end_line": start_line + 10,
                "content": content.strip()[:500],
                "score": round(adjusted_score, 3),
            })
            score = max(score - 0.05, 0.1)

    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"[code-search] grep failed: {e}", file=sys.stderr)

    return {
        "query": query,
        "engine": "grep",
        "warning": "Semantic search unavailable. Results are lexical-only.",
        "results": results,
    }


def find_related_grep(file_path: str, line: int, path: str, top_k: int) -> dict:
    """Grep-based find-related fallback."""
    target = Path(file_path)
    if not target.is_file():
        return {
            "query": f"find-related {file_path}:{line}",
            "engine": "grep",
            "error": f"File not found: {file_path}",
            "results": [],
        }

    # Read lines around the target to extract context for search
    try:
        lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
        start = max(0, line - 3)
        end = min(len(lines), line + 3)
        context_lines = lines[start:end]

        # Extract identifiers (words that look like function/class/variable names)
        identifiers = set()
        for ctx_line in context_lines:
            # Match camelCase, snake_case, PascalCase identifiers
            matches = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b', ctx_line)
            identifiers.update(matches)

        # Remove common keywords
        keywords = {
            "import", "from", "return", "const", "let", "var", "function",
            "class", "def", "self", "this", "async", "await", "export",
            "default", "None", "True", "False", "null", "undefined",
            "string", "number", "boolean", "void", "any", "type", "interface",
        }
        identifiers -= keywords

        if identifiers:
            query = " ".join(list(identifiers)[:5])
            return search_grep(query, path, top_k)

    except Exception as e:
        print(f"[code-search] Context extraction failed: {e}", file=sys.stderr)

    return {
        "query": f"find-related {file_path}:{line}",
        "engine": "grep",
        "results": [],
    }


# ── Multi-Query Support (for Story 2.1 — Cross-Story Scanner) ────────────────

def multi_query(queries: list[dict], path: str, top_k: int, engine: str) -> list[dict]:
    """Execute multiple queries and return aggregated results.

    Each query dict should have: {"id": "story-id", "query": "search text"}
    Returns: list of result dicts with story_id attached.
    """
    all_results = []
    for q in queries:
        story_id = q.get("id", "unknown")
        query_text = q.get("query", "")

        if engine == "semble-python":
            result = search_semble_python(query_text, path, top_k, DEFAULT_CONTENT)
        elif engine in ("semble-cli", "uvx"):
            result = search_cli(query_text, path, top_k, DEFAULT_CONTENT, engine)
        else:
            result = search_grep(query_text, path, top_k)

        result["story_id"] = story_id
        all_results.append(result)

    return all_results


# ── Unified Dispatcher ───────────────────────────────────────────────────────

def dispatch_search(query: str, path: str, top_k: int, content: str) -> dict:
    """Route search to the best available engine."""
    engine = detect_engine()

    if engine == "semble-python":
        try:
            return search_semble_python(query, path, top_k, content)
        except Exception as e:
            print(f"[code-search] Python API failed: {e}, falling back to CLI", file=sys.stderr)
            engine = "semble-cli" if shutil.which("semble") else "grep"

    if engine in ("semble-cli", "uvx"):
        result = search_cli(query, path, top_k, content, engine)
        if not result.get("error"):
            return result
        # Fall through to grep if CLI failed
        print("[code-search] CLI failed, falling back to grep", file=sys.stderr)

    return search_grep(query, path, top_k)


def dispatch_find_related(file_path: str, line: int, path: str, top_k: int) -> dict:
    """Route find-related to the best available engine."""
    engine = detect_engine()

    if engine == "semble-python":
        try:
            return find_related_semble_python(file_path, line, path, top_k)
        except Exception as e:
            print(f"[code-search] Python API failed: {e}, falling back", file=sys.stderr)
            engine = "semble-cli" if shutil.which("semble") else "grep"

    if engine in ("semble-cli", "uvx"):
        result = find_related_cli(file_path, line, path, top_k, engine)
        if not result.get("error"):
            return result

    return find_related_grep(file_path, line, path, top_k)


# ── CLI Entry Point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Semble Hybrid Code Search — Python Bridge",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("--query", "-q", help="Search query (natural language or code)")
    parser.add_argument("--path", "-p", default=".", help="Directory to search (default: .)")
    parser.add_argument("--top-k", "-k", type=int, default=DEFAULT_TOP_K, help="Number of results")
    parser.add_argument("--content", default=DEFAULT_CONTENT, choices=["code", "docs", "config", "all"])

    # find-related mode
    parser.add_argument("--find-related", action="store_true", help="Find code related to a location")
    parser.add_argument("--file", help="File path for find-related")
    parser.add_argument("--line", type=int, help="Line number for find-related")

    # multi-query mode (for cross-story scanner)
    parser.add_argument("--multi-query", action="store_true", help="Multi-query mode")
    parser.add_argument("--queries-file", help="JSON file with queries [{id, query}]")

    # Engine override (for testing)
    parser.add_argument("--engine", choices=["auto", "semble-python", "semble-cli", "uvx", "grep"], default="auto")

    args = parser.parse_args()

    # Validate args
    if args.find_related:
        if not args.file or args.line is None:
            parser.error("--find-related requires --file and --line")
        result = dispatch_find_related(args.file, args.line, args.path, args.top_k)
    elif args.multi_query:
        if not args.queries_file:
            parser.error("--multi-query requires --queries-file")
        with open(args.queries_file) as f:
            queries = json.load(f)
        engine = args.engine if args.engine != "auto" else detect_engine()
        result = multi_query(queries, args.path, args.top_k, engine)
    elif args.query:
        result = dispatch_search(args.query, args.path, args.top_k, args.content)
    else:
        parser.error("One of --query, --find-related, or --multi-query is required")
        return

    # Output JSON
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
