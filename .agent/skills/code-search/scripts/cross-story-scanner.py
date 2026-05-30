#!/usr/bin/env python3
"""
cross-story-scanner.py — Cross-Story Dependency Scanner
========================================================
# Part of: I-Wish / code-search skill (Story 2.1)

Analyzes overlapping search results across parallel active stories to detect
potential code conflicts BEFORE they happen. Called by orch-agent before
dispatching parallel dev-agents.

Flow:
  1. Parse sprint status YAML → identify active stories (IN-DEV, READY-FOR-DEV)
  2. Load each story file → extract key concepts (Goal + AC sections)
  3. Query Semble for each story's concepts → collect file paths + line ranges
  4. Cross-compare target file paths → find overlaps
  5. Emit conflict report with severity levels (HIGH/MEDIUM/LOW)

Usage:
  python3 cross-story-scanner.py --sprint-yaml <path> --project <root> [--top-k 5]

Output: JSON conflict report to stdout.
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ── Add scripts dir to sys.path so we can import code-search ────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

# Import from the code-search module (Story 1.1)
# The module name has a hyphen, so we use importlib
import importlib

_semble_search_mod = importlib.import_module("code-search")
dispatch_search = _semble_search_mod.dispatch_search
multi_query = _semble_search_mod.multi_query
detect_engine = _semble_search_mod.detect_engine
DEFAULT_TOP_K = _semble_search_mod.DEFAULT_TOP_K


# ── Constants ─────────────────────────────────────────────────────────────────

ACTIVE_STATUSES = {"IN-DEV", "READY-FOR-DEV"}

# Common English stop-words to filter from concept extraction
STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "both", "each", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "because", "but", "and", "or", "if", "while",
    "about", "that", "this", "these", "those", "it", "its", "they",
    "them", "their", "what", "which", "who", "whom",
    # Story-specific stop words
    "given", "when", "then", "story", "epic", "acceptance", "criteria",
    "task", "status", "mapped", "implementation", "test", "ac1", "ac2",
    "ac3", "ac4", "ac5", "ac6", "ac7", "ac8",
}


# ── Sprint YAML Parsing ──────────────────────────────────────────────────────

def parse_sprint_yaml(yaml_path: str) -> dict:
    """Parse sprint status YAML and extract active stories.

    Uses a lightweight YAML parser to avoid external dependencies.
    Falls back to regex parsing if PyYAML is not available.

    Args:
        yaml_path: Path to the sprint-status-*.yaml file.

    Returns:
        Dict with sprint metadata and list of active story dicts.
    """
    yaml_file = Path(yaml_path)
    if not yaml_file.is_file():
        return {"error": f"Sprint YAML not found: {yaml_path}", "stories": []}

    content = yaml_file.read_text(encoding="utf-8", errors="replace")

    # Try PyYAML first
    try:
        import yaml
        data = yaml.safe_load(content)
        if data and "sprint" in data:
            sprint = data["sprint"]
            stories = sprint.get("stories", [])
            return {
                "sprint_name": sprint.get("name", "unknown"),
                "sprint_status": sprint.get("status", "unknown"),
                "stories": stories,
            }
    except ImportError:
        pass
    except Exception as e:
        print(f"[cross-story-scanner] PyYAML parse error: {e}", file=sys.stderr)

    # Fallback: regex-based YAML parsing for the known structure
    return _parse_sprint_yaml_regex(content)


def _parse_sprint_yaml_regex(content: str) -> dict:
    """Regex-based fallback parser for sprint YAML.

    Handles the known structure:
        sprint:
          name: "..."
          status: "..."
          stories:
            - id: "story-X.Y"
              title: "..."
              status: "..."
              files:
                - "path/to/file"
    """
    sprint_name = "unknown"
    sprint_status = "unknown"

    name_match = re.search(r'name:\s*"([^"]+)"', content)
    if name_match:
        sprint_name = name_match.group(1)

    status_match = re.search(r'status:\s*"([^"]+)"', content, re.MULTILINE)
    if status_match:
        sprint_status = status_match.group(1)

    stories: list[dict] = []
    # Match each story block: starts with "- id:" and extends until next "- id:" or end
    story_blocks = re.split(r'(?=\s+-\s+id:)', content)

    for block in story_blocks:
        id_match = re.search(r'id:\s*"([^"]+)"', block)
        title_match = re.search(r'title:\s*"([^"]+)"', block)
        status_match = re.search(r'status:\s*"([^"]+)"', block)

        if id_match:
            story: dict[str, Any] = {
                "id": id_match.group(1),
                "title": title_match.group(1) if title_match else "unknown",
                "status": status_match.group(1) if status_match else "unknown",
            }

            # Extract file list if present
            files: list[str] = []
            file_matches = re.findall(r'-\s+["\'\s]?([^"\'\s]+)["\'\s]?', block)
            if file_matches:
                story["files"] = file_matches

            stories.append(story)

    return {
        "sprint_name": sprint_name,
        "sprint_status": sprint_status,
        "stories": stories,
    }


def filter_active_stories(sprint_data: dict) -> list[dict]:
    """Filter stories to only those with active statuses (IN-DEV, READY-FOR-DEV).

    Args:
        sprint_data: Parsed sprint data from parse_sprint_yaml().

    Returns:
        List of story dicts with active status.
    """
    return [
        s for s in sprint_data.get("stories", [])
        if s.get("status", "").upper() in ACTIVE_STATUSES
    ]


# ── Story File Loading & Concept Extraction ──────────────────────────────────

def find_story_file(story_id: str, sprint_yaml_dir: str) -> str | None:
    """Locate the story markdown file for a given story ID.

    Searches for files matching pattern: story-{id}-*.md in the same
    directory as the sprint YAML.

    Args:
        story_id: e.g. "story-1.1"
        sprint_yaml_dir: Directory containing story files.

    Returns:
        Absolute path to story file, or None if not found.
    """
    search_dir = Path(sprint_yaml_dir)
    # Try exact pattern: story-X.Y-*.md
    pattern = f"{story_id}-*.md"
    matches = list(search_dir.glob(pattern))

    if matches:
        return str(matches[0])

    # Broader search: any file containing the story id
    for f in search_dir.glob("*.md"):
        if story_id in f.name:
            return str(f)

    return None


def load_story_content(story_file: str) -> str:
    """Load the full text content of a story file.

    Args:
        story_file: Absolute path to the story markdown file.

    Returns:
        Full text content of the file, or empty string on error.
    """
    try:
        return Path(story_file).read_text(encoding="utf-8", errors="replace")
    except (OSError, IOError) as e:
        print(f"[cross-story-scanner] Cannot read {story_file}: {e}", file=sys.stderr)
        return ""


def extract_concepts(story_content: str) -> list[str]:
    """Extract key concepts from a story's Goal and Acceptance Criteria sections.

    Uses NLP-lite keyword extraction:
    1. Extract Goal line(s)
    2. Extract AC section text
    3. Tokenize into meaningful words/phrases
    4. Remove stop words and short tokens
    5. Deduplicate and rank by specificity

    Args:
        story_content: Full markdown text of a story file.

    Returns:
        List of concept strings suitable for Semble queries.
    """
    if not story_content:
        return []

    # ── 1. Extract Goal text ──────────────────────────────────────────────
    goal_text = ""
    goal_match = re.search(
        r'\*\*Goal:\*\*\s*(.+?)(?:\n---|\n##|\Z)',
        story_content,
        re.DOTALL | re.IGNORECASE,
    )
    if goal_match:
        goal_text = goal_match.group(1).strip()

    # ── 2. Extract AC section ─────────────────────────────────────────────
    ac_text = ""
    ac_match = re.search(
        r'##\s*.*Acceptance Criteria.*?\n(.*?)(?:\n---|\n##\s*[^#]|\Z)',
        story_content,
        re.DOTALL | re.IGNORECASE,
    )
    if ac_match:
        ac_text = ac_match.group(1).strip()

    combined = f"{goal_text} {ac_text}"

    # ── 3. Extract meaningful tokens ──────────────────────────────────────
    # Match technical terms: identifiers, compound words, paths
    raw_tokens = re.findall(r'[a-zA-Z_][a-zA-Z0-9_.-]{2,}', combined)

    # ── 4. Filter stop words and noise ────────────────────────────────────
    meaningful: list[str] = []
    seen: set[str] = set()

    for token in raw_tokens:
        lower = token.lower()
        if lower in STOP_WORDS:
            continue
        if lower in seen:
            continue
        if len(token) < 3:
            continue
        # Skip markdown formatting artifacts
        if token.startswith("**") or token.endswith("**"):
            continue

        seen.add(lower)
        meaningful.append(token)

    # ── 5. Build concept queries ──────────────────────────────────────────
    # Group tokens into coherent queries (up to ~5 terms per query)
    concepts: list[str] = []

    # Primary query: most specific terms from the goal
    if meaningful:
        # Take the most specific (longest) tokens for primary query
        specific_tokens = sorted(meaningful, key=len, reverse=True)[:8]
        primary_query = " ".join(specific_tokens[:5])
        concepts.append(primary_query)

        # Secondary query: remaining important tokens
        if len(specific_tokens) > 5:
            secondary_query = " ".join(specific_tokens[5:])
            concepts.append(secondary_query)

    # Extract quoted strings as exact-match concepts
    quoted = re.findall(r'`([^`]+)`', combined)
    for q in quoted:
        q_clean = q.strip()
        if len(q_clean) > 2 and q_clean.lower() not in seen:
            concepts.append(q_clean)
            seen.add(q_clean.lower())

    return concepts if concepts else ["general project structure"]


# ── Semble Querying per Story ─────────────────────────────────────────────────

def query_semble_for_story(
    story_id: str,
    concepts: list[str],
    project_root: str,
    top_k: int,
) -> list[dict]:
    """Query Semble with a story's extracted concepts and collect results.

    Args:
        story_id: The story identifier (e.g. "story-1.1").
        concepts: List of concept query strings.
        project_root: Project root directory for Semble search.
        top_k: Number of results per query.

    Returns:
        List of result dicts, each with file_path, start_line, end_line, score.
    """
    all_results: list[dict] = []

    for concept in concepts:
        try:
            result = dispatch_search(
                query=concept,
                path=project_root,
                top_k=top_k,
                content="code",
            )
            for r in result.get("results", []):
                r["story_id"] = story_id
                r["query"] = concept
                all_results.append(r)
        except Exception as e:
            print(
                f"[cross-story-scanner] Semble query failed for {story_id} "
                f"concept '{concept}': {e}",
                file=sys.stderr,
            )

    return all_results


# ── Overlap Detection ─────────────────────────────────────────────────────────

def build_file_story_map(
    all_results: dict[str, list[dict]],
) -> dict[str, dict[str, list[dict]]]:
    """Build a mapping of file_path → {story_id → [result entries]}.

    Args:
        all_results: Dict mapping story_id → list of semble result dicts.

    Returns:
        Dict mapping file_path → {story_id → [results with line ranges]}.
    """
    file_map: dict[str, dict[str, list[dict]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for story_id, results in all_results.items():
        for r in results:
            fp = r.get("file_path", "")
            if fp:
                file_map[fp][story_id].append({
                    "start_line": r.get("start_line", 0),
                    "end_line": r.get("end_line", 0),
                    "score": r.get("score", 0.0),
                    "query": r.get("query", ""),
                })

    return dict(file_map)


def ranges_overlap(
    range_a: tuple[int, int],
    range_b: tuple[int, int],
) -> bool:
    """Check if two line ranges overlap.

    Args:
        range_a: (start_line, end_line) for the first range.
        range_b: (start_line, end_line) for the second range.

    Returns:
        True if the ranges overlap.
    """
    return range_a[0] <= range_b[1] and range_b[0] <= range_a[1]


def same_directory(path_a: str, path_b: str) -> bool:
    """Check if two file paths share the same parent directory.

    Args:
        path_a: First file path.
        path_b: Second file path.

    Returns:
        True if both files are in the same directory.
    """
    return str(Path(path_a).parent) == str(Path(path_b).parent)


def detect_conflicts(
    file_map: dict[str, dict[str, list[dict]]],
) -> list[dict]:
    """Analyze file_map for cross-story conflicts and assign severity.

    Severity rules:
      - HIGH:   Same file + overlapping line ranges across stories
      - MEDIUM: Same file, different (non-overlapping) line ranges
      - LOW:    Same directory only (different files from same dir touched)

    Args:
        file_map: Dict from build_file_story_map().

    Returns:
        List of conflict dicts with severity, file_path, stories, ranges.
    """
    conflicts: list[dict] = []

    # ── File-level conflicts (HIGH / MEDIUM) ──────────────────────────────
    for file_path, story_entries in file_map.items():
        story_ids = list(story_entries.keys())
        if len(story_ids) < 2:
            continue  # Only one story touches this file — no conflict

        # For each pair of stories touching this file
        for i in range(len(story_ids)):
            for j in range(i + 1, len(story_ids)):
                sid_a = story_ids[i]
                sid_b = story_ids[j]
                entries_a = story_entries[sid_a]
                entries_b = story_entries[sid_b]

                # Check for overlapping line ranges
                has_overlap = False
                overlap_details: dict[str, dict[str, int]] = {}

                for ea in entries_a:
                    for eb in entries_b:
                        ra = (ea["start_line"], ea["end_line"])
                        rb = (eb["start_line"], eb["end_line"])

                        if ranges_overlap(ra, rb):
                            has_overlap = True
                            # Track the widest range per story
                            if sid_a not in overlap_details:
                                overlap_details[sid_a] = {
                                    "start_line": ea["start_line"],
                                    "end_line": ea["end_line"],
                                }
                            else:
                                overlap_details[sid_a]["start_line"] = min(
                                    overlap_details[sid_a]["start_line"],
                                    ea["start_line"],
                                )
                                overlap_details[sid_a]["end_line"] = max(
                                    overlap_details[sid_a]["end_line"],
                                    ea["end_line"],
                                )

                            if sid_b not in overlap_details:
                                overlap_details[sid_b] = {
                                    "start_line": eb["start_line"],
                                    "end_line": eb["end_line"],
                                }
                            else:
                                overlap_details[sid_b]["start_line"] = min(
                                    overlap_details[sid_b]["start_line"],
                                    eb["start_line"],
                                )
                                overlap_details[sid_b]["end_line"] = max(
                                    overlap_details[sid_b]["end_line"],
                                    eb["end_line"],
                                )

                if has_overlap:
                    # ── HIGH severity: overlapping line ranges ─────────
                    conflicts.append({
                        "file_path": file_path,
                        "conflicting_stories": sorted([sid_a, sid_b]),
                        "ranges": overlap_details,
                        "severity": "HIGH",
                        "reason": "Overlapping line ranges in same file",
                    })
                else:
                    # ── MEDIUM severity: same file, different ranges ───
                    range_info: dict[str, dict[str, int]] = {}
                    for sid, entries in [(sid_a, entries_a), (sid_b, entries_b)]:
                        if entries:
                            range_info[sid] = {
                                "start_line": min(e["start_line"] for e in entries),
                                "end_line": max(e["end_line"] for e in entries),
                            }
                    conflicts.append({
                        "file_path": file_path,
                        "conflicting_stories": sorted([sid_a, sid_b]),
                        "ranges": range_info,
                        "severity": "MEDIUM",
                        "reason": "Same file, non-overlapping line ranges",
                    })

    # ── Directory-level conflicts (LOW) ───────────────────────────────────
    # Build directory → set(story_ids) map from files that had NO file-level conflict
    conflicted_files = {c["file_path"] for c in conflicts}
    dir_map: dict[str, set[str]] = defaultdict(set)

    for file_path, story_entries in file_map.items():
        if file_path in conflicted_files:
            continue  # Already reported at file level
        parent = str(Path(file_path).parent)
        for story_id in story_entries:
            dir_map[parent].add(story_id)

    for directory, story_ids in dir_map.items():
        if len(story_ids) >= 2:
            conflicts.append({
                "file_path": directory + "/",
                "conflicting_stories": sorted(story_ids),
                "ranges": {},
                "severity": "LOW",
                "reason": "Multiple stories modifying files in same directory",
            })

    # Sort by severity: HIGH first, then MEDIUM, then LOW
    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    conflicts.sort(key=lambda c: severity_order.get(c["severity"], 3))

    return conflicts


def deduplicate_conflicts(conflicts: list[dict]) -> list[dict]:
    """Remove duplicate conflict entries (same file + same story pair).

    Args:
        conflicts: List of conflict dicts, potentially with duplicates.

    Returns:
        Deduplicated list of conflicts.
    """
    seen: set[str] = set()
    unique: list[dict] = []

    for c in conflicts:
        key = f"{c['file_path']}|{'|'.join(c['conflicting_stories'])}|{c['severity']}"
        if key not in seen:
            seen.add(key)
            unique.append(c)

    return unique


# ── Report Generation ─────────────────────────────────────────────────────────

def generate_verdict(conflicts: list[dict]) -> tuple[str, str]:
    """Generate verdict and recommendation from conflict list.

    Args:
        conflicts: List of detected conflict dicts.

    Returns:
        Tuple of (verdict, recommendation).
    """
    if not conflicts:
        return (
            "NO_CONFLICTS",
            "All active stories target independent code areas. Safe to parallelize.",
        )

    high_count = sum(1 for c in conflicts if c["severity"] == "HIGH")
    medium_count = sum(1 for c in conflicts if c["severity"] == "MEDIUM")

    if high_count > 0:
        # Collect unique story pairs with HIGH severity
        high_pairs: list[str] = []
        for c in conflicts:
            if c["severity"] == "HIGH":
                pair = " and ".join(c["conflicting_stories"])
                if pair not in high_pairs:
                    high_pairs.append(pair)

        return (
            "CONFLICTS_DETECTED",
            f"Serialize stories {', '.join(high_pairs)} or coordinate changes. "
            f"{high_count} HIGH severity overlap(s) detected.",
        )

    if medium_count > 0:
        return (
            "CAUTION",
            f"{medium_count} file-level overlap(s) detected with non-overlapping "
            f"ranges. Monitor for indirect coupling.",
        )

    return (
        "LOW_RISK",
        "Only directory-level proximity detected. Low risk but monitor for "
        "implicit dependencies.",
    )


def build_report(
    sprint_data: dict,
    active_stories: list[dict],
    conflicts: list[dict],
) -> dict:
    """Build the final JSON conflict report.

    Args:
        sprint_data: Parsed sprint metadata.
        active_stories: List of active story dicts.
        conflicts: List of detected conflicts.

    Returns:
        Complete conflict report dict.
    """
    verdict, recommendation = generate_verdict(conflicts)

    return {
        "scan_timestamp": datetime.now(timezone.utc).isoformat(),
        "sprint_name": sprint_data.get("sprint_name", "unknown"),
        "active_stories": [s["id"] for s in active_stories],
        "stories_scanned": len(active_stories),
        "conflicts": conflicts,
        "conflict_summary": {
            "total": len(conflicts),
            "high": sum(1 for c in conflicts if c["severity"] == "HIGH"),
            "medium": sum(1 for c in conflicts if c["severity"] == "MEDIUM"),
            "low": sum(1 for c in conflicts if c["severity"] == "LOW"),
        },
        "verdict": verdict,
        "recommendation": recommendation,
    }


# ── Main Scanner Pipeline ────────────────────────────────────────────────────

def run_scan(
    sprint_yaml: str,
    project_root: str,
    top_k: int = DEFAULT_TOP_K,
) -> dict:
    """Execute the full cross-story dependency scan pipeline.

    Pipeline stages:
      1. Parse sprint YAML → active stories
      2. For each story: load file → extract concepts → query Semble
      3. Build file→story map from all results
      4. Detect conflicts with severity assignment
      5. Generate report

    Args:
        sprint_yaml: Path to the sprint-status-*.yaml file.
        project_root: Project root directory for Semble search.
        top_k: Number of Semble results per query.

    Returns:
        Complete scan report dict.
    """
    # ── Stage 1: Parse sprint YAML ────────────────────────────────────────
    sprint_data = parse_sprint_yaml(sprint_yaml)

    if sprint_data.get("error"):
        return {
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
            "error": sprint_data["error"],
            "active_stories": [],
            "conflicts": [],
            "verdict": "ERROR",
            "recommendation": "Fix sprint YAML path and retry.",
        }

    active_stories = filter_active_stories(sprint_data)

    if len(active_stories) < 2:
        return build_report(sprint_data, active_stories, [])

    print(
        f"[cross-story-scanner] Scanning {len(active_stories)} active stories: "
        f"{[s['id'] for s in active_stories]}",
        file=sys.stderr,
    )

    # ── Stage 2: Load stories and extract concepts ────────────────────────
    sprint_yaml_dir = str(Path(sprint_yaml).parent)
    story_concepts: dict[str, list[str]] = {}

    for story in active_stories:
        story_id = story["id"]
        story_file = find_story_file(story_id, sprint_yaml_dir)

        if story_file:
            content = load_story_content(story_file)
            concepts = extract_concepts(content)
            story_concepts[story_id] = concepts
            print(
                f"[cross-story-scanner] {story_id}: extracted {len(concepts)} "
                f"concept(s) from {Path(story_file).name}",
                file=sys.stderr,
            )
        else:
            # Use story title as a fallback concept
            title = story.get("title", story_id)
            story_concepts[story_id] = [title]
            print(
                f"[cross-story-scanner] {story_id}: story file not found, "
                f"using title as concept",
                file=sys.stderr,
            )

    # ── Stage 3: Query Semble for each story ──────────────────────────────
    all_results: dict[str, list[dict]] = {}

    for story_id, concepts in story_concepts.items():
        results = query_semble_for_story(
            story_id=story_id,
            concepts=concepts,
            project_root=project_root,
            top_k=top_k,
        )
        all_results[story_id] = results
        print(
            f"[cross-story-scanner] {story_id}: got {len(results)} search result(s)",
            file=sys.stderr,
        )

    # ── Stage 4: Build file map and detect conflicts ──────────────────────
    file_map = build_file_story_map(all_results)
    raw_conflicts = detect_conflicts(file_map)
    conflicts = deduplicate_conflicts(raw_conflicts)

    print(
        f"[cross-story-scanner] Detected {len(conflicts)} conflict(s) "
        f"across {len(file_map)} file(s)",
        file=sys.stderr,
    )

    # ── Stage 5: Generate report ──────────────────────────────────────────
    return build_report(sprint_data, active_stories, conflicts)


# ── CLI Entry Point ──────────────────────────────────────────────────────────

def main():
    """CLI entry point for the cross-story dependency scanner."""
    parser = argparse.ArgumentParser(
        description="Cross-Story Dependency Scanner — Detect code conflicts "
                    "across parallel active stories using Semble search.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan semble integration sprint
  python3 cross-story-scanner.py \\
    --sprint-yaml _iwish-output/iwish-skills/sprint-status-semble-integration.yaml \\
    --project .

  # Scan with higher result count
  python3 cross-story-scanner.py \\
    --sprint-yaml path/to/sprint.yaml \\
    --project /path/to/project \\
    --top-k 10

  # Pretty-print output
  python3 cross-story-scanner.py \\
    --sprint-yaml path/to/sprint.yaml \\
    --project . | python3 -m json.tool
        """,
    )

    parser.add_argument(
        "--sprint-yaml",
        required=True,
        help="Path to the sprint-status-*.yaml file",
    )
    parser.add_argument(
        "--project",
        required=True,
        help="Project root directory for Semble code search",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=DEFAULT_TOP_K,
        help=f"Number of Semble results per concept query (default: {DEFAULT_TOP_K})",
    )

    args = parser.parse_args()

    # Resolve paths
    sprint_yaml = str(Path(args.sprint_yaml).resolve())
    project_root = str(Path(args.project).resolve())

    if not Path(project_root).is_dir():
        print(
            json.dumps({
                "error": f"Project directory not found: {project_root}",
                "verdict": "ERROR",
            }),
        )
        sys.exit(1)

    # Run the scan
    report = run_scan(sprint_yaml, project_root, args.top_k)

    # Output JSON to stdout
    print(json.dumps(report, indent=2, ensure_ascii=False))

    # Exit with non-zero if HIGH conflicts detected
    if report.get("verdict") == "CONFLICTS_DETECTED":
        sys.exit(2)
    elif report.get("verdict") == "ERROR":
        sys.exit(1)


if __name__ == "__main__":
    main()
