#!/usr/bin/env python3
"""
story-chunk-injector.py — Context-Aware Story Chunk Injector
=============================================================
# Part of: I-Wish / code-search skill (Story 1.2)

Reads a story markdown file, extracts key technical concepts from the
Goal, Acceptance Criteria, and Task descriptions, queries Semble for
the most relevant code chunks, and outputs formatted markdown context
blocks ready for dev-agent prompt injection.

Usage:
  python3 story-chunk-injector.py --story <path-to-story.md> --project <project-root> [--top-k 5] [--output stdout|file]

Output: Formatted markdown with fenced code blocks, file paths, line
ranges, and relevance scores — wrapped in sentinel comments for easy
extraction.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


# ── Bootstrap: add scripts dir to sys.path for code-search import ──────────

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

# Rename-safe import: code-search.py uses a hyphen, so importlib is needed
import importlib

_semble_search_mod = importlib.import_module("code-search")
dispatch_search = _semble_search_mod.dispatch_search


# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_TOP_K = 5
MAX_QUERIES = 5  # Cap the number of distinct queries to keep prompt lean
MIN_CONCEPT_LENGTH = 3  # Ignore very short tokens

# Common English/markdown/code stop words to filter out
STOP_WORDS: set[str] = {
    # English
    "the", "and", "for", "with", "that", "this", "from", "into", "when",
    "then", "than", "also", "will", "each", "have", "has", "had", "been",
    "are", "was", "were", "not", "but", "its", "all", "any", "can", "may",
    "should", "could", "would", "must", "shall", "does", "did", "about",
    "more", "most", "some", "such", "only", "other", "which", "while",
    "both", "either", "neither", "every", "using", "used", "uses",
    "e.g.", "i.e.", "vs.", "eg", "ie", "github.com",
    # Markdown / structural
    "given", "when", "then", "acceptance", "criteria", "story", "epic",
    "goal", "task", "status", "mapped", "check", "score", "total",
    "average", "pass", "fail", "tracer", "bullet", "vertical", "slice",
    "complexity", "plan", "tune", "volume", "surface", "burden",
    "traceability", "matrix", "socratic", "review", "synthesis",
    "summary", "guardian", "scorecard", "axis", "justification",
    "finding", "identification",
    # Python / JS / TS keywords
    "import", "from", "return", "const", "let", "var", "function", "class",
    "def", "self", "this", "async", "await", "export", "default", "none",
    "true", "false", "null", "undefined", "string", "number", "boolean",
    "void", "any", "type", "interface", "enum", "struct", "impl",
    # Misc code
    "print", "console", "log", "error", "warning", "info", "debug",
    "input", "output", "file", "path", "name", "value", "data",
    "list", "dict", "map", "set", "array", "object", "result", "results",
}

# File extension → markdown language hint
LANG_MAP: dict[str, str] = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".rb": "ruby",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".md": "markdown",
    ".xml": "xml",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".proto": "protobuf",
    ".prisma": "prisma",
}


# ── Section Extraction ───────────────────────────────────────────────────────

def _extract_sections(content: str) -> dict[str, str]:
    """Parse story markdown and extract key sections by heading.

    Returns a dict mapping section names (lowercased) to their text content.
    Targets: Goal line, Acceptance Criteria, Traceability Matrix, Socratic
    Review, and any section that contains task-like descriptions.
    """
    sections: dict[str, str] = {}

    # Extract the Goal line (appears as **Goal:** ... at the top)
    goal_match = re.search(
        r'\*\*Goal:\*\*\s*(.+?)(?:\n---|\n##|\n\*\*|\Z)',
        content,
        re.DOTALL,
    )
    if goal_match:
        sections["goal"] = goal_match.group(1).strip()

    # Extract named sections by ## headings
    heading_pattern = re.compile(
        r'^##\s+.*?(\d+)\.\s+(.+?)$',
        re.MULTILINE,
    )
    headings = list(heading_pattern.finditer(content))

    for i, match in enumerate(headings):
        section_name = match.group(2).strip().lower()
        start = match.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(content)
        section_text = content[start:end].strip()
        sections[section_name] = section_text

    return sections


def _extract_table_rows(text: str) -> list[str]:
    """Extract content cells from markdown tables."""
    rows: list[str] = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("|") and not re.match(r'^\|[\s\-|]+\|$', line):
            # Split by | and take non-header cells
            cells = [c.strip() for c in line.split("|") if c.strip()]
            rows.extend(cells)
    return rows


# ── Concept Extraction ───────────────────────────────────────────────────────

def extract_concepts(story_path: str) -> list[str]:
    """Extract key technical concepts from a story markdown file.

    Parses the Goal, Acceptance Criteria, and Task description sections
    and extracts technical identifiers using regex patterns:
      - camelCase / PascalCase identifiers
      - snake_case identifiers
      - Backtick-wrapped code references
      - Quoted strings (likely config keys, command names)
      - File paths and module references

    Returns:
        A deduplicated, scored list of concept strings suitable for
        semble search queries.
    """
    path = Path(story_path)
    if not path.is_file():
        print(f"[story-chunk-injector] ❌ Story file not found: {story_path}", file=sys.stderr)
        return []

    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        print(f"[story-chunk-injector] ❌ Cannot read story file: {e}", file=sys.stderr)
        return []

    sections = _extract_sections(content)
    if not sections:
        print(f"[story-chunk-injector] ⚠️  No parseable sections found in {story_path}", file=sys.stderr)
        # Fall back to using the entire file content
        sections = {"full": content}

    # Collect raw text from priority sections
    priority_keys = ["goal", "acceptance criteria (ac)", "acceptance criteria",
                     "ac-to-task traceability matrix", "socratic review synthesis summary"]
    raw_text_parts: list[str] = []

    for key in priority_keys:
        for section_key, section_text in sections.items():
            if key in section_key or section_key in key:
                raw_text_parts.append(section_text)

    # Also grab table rows from all sections (task descriptions live in tables)
    for section_text in sections.values():
        raw_text_parts.extend(_extract_table_rows(section_text))

    # If we didn't match any priority sections, use everything
    if not raw_text_parts:
        raw_text_parts = list(sections.values())

    combined_text = "\n".join(raw_text_parts)

    # ── Extract identifiers ──────────────────────────────────────────────
    concepts: dict[str, float] = {}  # concept → relevance weight

    # 1. Backtick-wrapped code references (highest signal)
    backtick_refs = re.findall(r'`([^`]+)`', combined_text)
    for ref in backtick_refs:
        ref = ref.strip()
        if len(ref) >= MIN_CONCEPT_LENGTH and not ref.startswith("#"):
            concepts[ref] = concepts.get(ref, 0) + 3.0

    # 2. Quoted strings (command names, config keys)
    quoted_refs = re.findall(r'"([^"]+)"', combined_text)
    for ref in quoted_refs:
        ref = ref.strip()
        if len(ref) >= MIN_CONCEPT_LENGTH and len(ref) <= 80:
            concepts[ref] = concepts.get(ref, 0) + 2.0

    # 3. File paths (e.g., src/auth/handler.ts, scripts/code-search-wrapper.sh)
    file_paths = re.findall(
        r'(?:^|\s|[`"\(])([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})(?:\s|[`"\)]|$|,)',
        combined_text,
    )
    for fp in file_paths:
        fp = fp.strip("./")
        if "/" in fp and len(fp) >= 5:
            concepts[fp] = concepts.get(fp, 0) + 2.5

    # 4. camelCase identifiers (e.g., dispatchSearch, findRelated)
    camel_ids = re.findall(r'\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\b', combined_text)
    for ident in camel_ids:
        if len(ident) >= MIN_CONCEPT_LENGTH:
            concepts[ident] = concepts.get(ident, 0) + 2.0

    # 5. PascalCase identifiers (e.g., SembleIndex, ContentType)
    pascal_ids = re.findall(r'\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b', combined_text)
    for ident in pascal_ids:
        if len(ident) >= MIN_CONCEPT_LENGTH:
            concepts[ident] = concepts.get(ident, 0) + 2.0

    # 6. snake_case identifiers (e.g., extract_concepts, dispatch_search)
    snake_ids = re.findall(r'\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b', combined_text)
    for ident in snake_ids:
        if len(ident) >= MIN_CONCEPT_LENGTH:
            concepts[ident] = concepts.get(ident, 0) + 2.0

    # 7. UPPER_SNAKE constants (e.g., DEFAULT_TOP_K, MAX_RETRIES)
    upper_ids = re.findall(r'\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b', combined_text)
    for ident in upper_ids:
        if len(ident) >= MIN_CONCEPT_LENGTH:
            concepts[ident] = concepts.get(ident, 0) + 1.5

    # 8. Hyphenated technical terms (e.g., code-search, cross-story, dev-agent)
    hyphen_terms = re.findall(r'\b([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b', combined_text)
    for term in hyphen_terms:
        if len(term) >= MIN_CONCEPT_LENGTH and term not in ("---",):
            concepts[term] = concepts.get(term, 0) + 1.5

    # ── Filter and deduplicate ───────────────────────────────────────────
    filtered: dict[str, float] = {}
    for concept, weight in concepts.items():
        # Skip stop words
        if concept.lower() in STOP_WORDS:
            continue
        # Skip pure numbers
        if re.match(r'^[\d.]+$', concept):
            continue
        # Skip very short tokens
        if len(concept) < MIN_CONCEPT_LENGTH:
            continue
        # Skip markdown artifacts
        if concept.startswith(("---", "##", "**", "||", "|")):
            continue
        filtered[concept] = weight

    # Sort by weight (descending), then alphabetically for stability
    sorted_concepts = sorted(filtered.items(), key=lambda x: (-x[1], x[0]))

    return [concept for concept, _weight in sorted_concepts]


# ── Query Grouping ───────────────────────────────────────────────────────────

def group_concepts_into_queries(concepts: list[str], max_queries: int = MAX_QUERIES) -> list[str]:
    """Group related concepts into 2-5 composite search queries.

    Strategy:
      1. File paths become their own queries (highest precision)
      2. Multi-word backtick refs become their own queries
      3. Remaining identifiers are grouped into natural-language-ish queries
         of 2-4 terms each
    """
    if not concepts:
        return []

    queries: list[str] = []
    remaining: list[str] = []

    for concept in concepts:
        if len(queries) >= max_queries:
            break

        # File paths → standalone queries
        if "/" in concept and "." in concept:
            queries.append(concept)
            continue

        # Multi-word or complex refs → standalone queries
        if " " in concept or len(concept) > 30:
            queries.append(concept)
            continue

        remaining.append(concept)

    # Group remaining identifiers in clusters of 2-4
    cluster_size = 3
    for i in range(0, len(remaining), cluster_size):
        if len(queries) >= max_queries:
            break
        cluster = remaining[i:i + cluster_size]
        queries.append(" ".join(cluster))

    return queries[:max_queries]


# ── Semble Search & Deduplication ────────────────────────────────────────────

def search_for_context(
    queries: list[str],
    project_path: str,
    top_k: int,
) -> list[dict[str, Any]]:
    """Execute semble searches for each query and deduplicate results.

    Returns a flat list of unique result chunks, sorted by score descending,
    limited to top_k total.
    """
    seen_keys: set[str] = set()  # (file_path, start_line) dedup key
    all_results: list[dict[str, Any]] = []

    for query in queries:
        try:
            response = dispatch_search(
                query=query,
                path=project_path,
                top_k=top_k,
                content="code",
            )
        except Exception as e:
            print(
                f"[story-chunk-injector] ⚠️  Search failed for query '{query}': {e}",
                file=sys.stderr,
            )
            continue

        results = response.get("results", [])
        for chunk in results:
            file_path = chunk.get("file_path", "")
            start_line = chunk.get("start_line", 0)
            dedup_key = f"{file_path}:{start_line}"

            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            # Attach the query that found this chunk for traceability
            chunk["_source_query"] = query
            all_results.append(chunk)

    # Sort by score descending and limit to top_k
    all_results.sort(key=lambda r: r.get("score", 0), reverse=True)
    return all_results[:top_k]


# ── Markdown Formatting ─────────────────────────────────────────────────────

def _detect_lang(file_path: str) -> str:
    """Detect the markdown code fence language from a file extension."""
    ext = Path(file_path).suffix.lower()
    return LANG_MAP.get(ext, "")


def format_injectable_markdown(
    results: list[dict[str, Any]],
    story_name: str = "",
) -> str:
    """Format search results as injectable markdown context blocks.

    Output is wrapped in sentinel HTML comments so downstream consumers
    can easily find and extract/replace the injected context.
    """
    if not results:
        return (
            "<!-- BEGIN SEMBLE CONTEXT -->\n"
            "## 📎 Relevant Code Context (auto-injected by code-search)\n\n"
            "_No relevant code chunks found._\n"
            "<!-- END SEMBLE CONTEXT -->\n"
        )

    lines: list[str] = []
    lines.append("<!-- BEGIN SEMBLE CONTEXT -->")

    header = "## 📎 Relevant Code Context (auto-injected by code-search)"
    if story_name:
        header += f"\n> Story: `{story_name}`"
    lines.append(header)
    lines.append("")

    for idx, chunk in enumerate(results, start=1):
        file_path = chunk.get("file_path", "unknown")
        start_line = chunk.get("start_line", 0)
        end_line = chunk.get("end_line", 0)
        score = chunk.get("score", 0)
        content = chunk.get("content", "")

        # Build the heading
        line_range = f"L{start_line}-{end_line}" if start_line and end_line else ""
        score_str = f"score: {score:.2f}" if isinstance(score, (int, float)) else f"score: {score}"
        meta_parts = [p for p in [line_range, score_str] if p]
        meta = f" ({', '.join(meta_parts)})" if meta_parts else ""

        lines.append(f"### {idx}. `{file_path}`{meta}")

        # Detect language for syntax highlighting
        lang = _detect_lang(file_path)
        lines.append(f"```{lang}")
        # Clean content: strip excessive leading/trailing whitespace per line
        content_lines = content.rstrip().split("\n") if content else []
        for cl in content_lines:
            lines.append(cl.rstrip())
        lines.append("```")
        lines.append("")

    lines.append("<!-- END SEMBLE CONTEXT -->")
    return "\n".join(lines)


# ── Output Handling ──────────────────────────────────────────────────────────

def _derive_output_path(story_path: str) -> str:
    """Derive the output file path from the story path.

    story-1.2-semble-integration.md → story-1.2-semble-integration.context.md
    """
    p = Path(story_path)
    return str(p.with_suffix(".context.md"))


def write_output(
    markdown: str,
    output_mode: str,
    story_path: str,
) -> str | None:
    """Write the formatted markdown to the appropriate destination.

    Returns the output file path if mode is 'file', else None.
    """
    if output_mode == "file":
        out_path = _derive_output_path(story_path)
        try:
            Path(out_path).write_text(markdown, encoding="utf-8")
            print(
                f"[story-chunk-injector] ✅ Context written to: {out_path}",
                file=sys.stderr,
            )
            return out_path
        except OSError as e:
            print(
                f"[story-chunk-injector] ❌ Failed to write output: {e}",
                file=sys.stderr,
            )
            # Fall through to stdout
            print(markdown)
            return None
    else:
        # stdout mode (default)
        print(markdown)
        return None


# ── JSON Summary (machine-readable companion) ───────────────────────────────

def build_summary_json(
    story_path: str,
    concepts: list[str],
    queries: list[str],
    results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build a JSON summary of the injection run for logging/diagnostics."""
    return {
        "story_path": story_path,
        "concepts_extracted": len(concepts),
        "concepts_sample": concepts[:10],
        "queries": queries,
        "results_count": len(results),
        "results": [
            {
                "file_path": r.get("file_path", ""),
                "start_line": r.get("start_line", 0),
                "end_line": r.get("end_line", 0),
                "score": r.get("score", 0),
            }
            for r in results
        ],
    }


# ── Main Pipeline ────────────────────────────────────────────────────────────

def inject_context(
    story_path: str,
    project_path: str,
    top_k: int = DEFAULT_TOP_K,
    output_mode: str = "stdout",
) -> dict[str, Any]:
    """Full pipeline: extract → query → format → output.

    Returns the JSON summary dict for programmatic consumers.
    """
    # Step 1: Extract concepts
    concepts = extract_concepts(story_path)
    if not concepts:
        print(
            "[story-chunk-injector] ⚠️  No concepts extracted. "
            "Outputting empty context block.",
            file=sys.stderr,
        )
        markdown = format_injectable_markdown([], story_name=Path(story_path).stem)
        write_output(markdown, output_mode, story_path)
        return build_summary_json(story_path, [], [], [])

    print(
        f"[story-chunk-injector] 📝 Extracted {len(concepts)} concepts "
        f"(showing top 10): {concepts[:10]}",
        file=sys.stderr,
    )

    # Step 2: Group concepts into queries
    queries = group_concepts_into_queries(concepts)
    print(
        f"[story-chunk-injector] 🔍 Generated {len(queries)} search queries: {queries}",
        file=sys.stderr,
    )

    # Step 3: Search semble
    results = search_for_context(queries, project_path, top_k)
    print(
        f"[story-chunk-injector] 📦 Retrieved {len(results)} unique code chunks",
        file=sys.stderr,
    )

    # Step 4: Format markdown
    story_name = Path(story_path).stem
    markdown = format_injectable_markdown(results, story_name=story_name)

    # Step 5: Output
    write_output(markdown, output_mode, story_path)

    return build_summary_json(story_path, concepts, queries, results)


# ── CLI Entry Point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Story Chunk Injector — Extract story concepts and inject relevant code context",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Print context to stdout
  python3 story-chunk-injector.py --story _iwish-output/iwish-skills/story-1.2-semble-integration.md --project .

  # Write context to a .context.md file alongside the story
  python3 story-chunk-injector.py --story story-1.2.md --project . --output file --top-k 8

  # Only extract concepts (no search)
  python3 story-chunk-injector.py --story story-1.2.md --concepts-only

  # Output JSON summary for programmatic use
  python3 story-chunk-injector.py --story story-1.2.md --project . --json
        """,
    )

    parser.add_argument(
        "--story", "-s",
        required=True,
        help="Path to the story markdown file",
    )
    parser.add_argument(
        "--project", "-p",
        default=".",
        help="Project root directory to search (default: current directory)",
    )
    parser.add_argument(
        "--top-k", "-k",
        type=int,
        default=DEFAULT_TOP_K,
        help=f"Number of code chunks to return (default: {DEFAULT_TOP_K})",
    )
    parser.add_argument(
        "--output", "-o",
        choices=["stdout", "file"],
        default="stdout",
        help="Output mode: 'stdout' prints to console, 'file' writes .context.md (default: stdout)",
    )
    parser.add_argument(
        "--concepts-only",
        action="store_true",
        help="Only extract and print concepts (skip semble search)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output JSON summary instead of markdown",
    )

    args = parser.parse_args()

    # Resolve paths
    story_path = str(Path(args.story).resolve())
    project_path = str(Path(args.project).resolve())

    # Validate story file exists
    if not Path(story_path).is_file():
        print(f"❌ Story file not found: {story_path}", file=sys.stderr)
        sys.exit(1)

    # Validate project directory exists
    if not Path(project_path).is_dir():
        print(f"❌ Project directory not found: {project_path}", file=sys.stderr)
        sys.exit(1)

    # Concepts-only mode
    if args.concepts_only:
        concepts = extract_concepts(story_path)
        if args.json_output:
            print(json.dumps({"concepts": concepts}, indent=2))
        else:
            print(f"Extracted {len(concepts)} concepts:\n")
            for i, concept in enumerate(concepts, 1):
                print(f"  {i:2d}. {concept}")
        sys.exit(0)

    # Full pipeline
    summary = inject_context(
        story_path=story_path,
        project_path=project_path,
        top_k=args.top_k,
        output_mode="stdout" if args.json_output else args.output,
    )

    # JSON mode: print summary to stdout (markdown goes to stderr or file)
    if args.json_output:
        # Re-run with file output to avoid mixing markdown and JSON on stdout
        if args.output == "stdout":
            # Suppress markdown stdout — already printed, redirect to /dev/null
            pass
        print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
