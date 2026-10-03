#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

"""
generate-completion-snapshot.py — Generate a completion snapshot for a completed story.

Captures sha256 hashes of all dependency files so that downstream drift
detection can identify when a dependency changed after story completion.

Usage:
    python generate-completion-snapshot.py --story 08.1
    python generate-completion-snapshot.py --story 08.1 --story-dir path/to/story

Exit codes:
    0 — Snapshot generated successfully
    1 — Story not found or fatal error
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import sys

# Attempt to import PyYAML; fall back to regex parsing if unavailable
try:
    import yaml  # type: ignore
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EPIC_STORY_BASE = os.path.join(
    "_iwish-output", "3. Development", "1. Epic & Story"
)
SNAPSHOT_FILENAME = "completion-snapshot.json"
SNAPSHOT_VERSION = "1.0"

# Well-known dependency files (relative to workspace root)
WELL_KNOWN_DEPS = [
    os.path.join("_iwish-output", "2. Product Planning", "design-system", "cowokai", "DESIGN.md"),
    os.path.join("_iwish-output", "2. Product Planning", "2.2. database-spec.md"),
    os.path.join("_iwish-output", "2. Product Planning", "2.1. product-brief-or-prd.md"),
]


# ---------------------------------------------------------------------------
# YAML / Frontmatter Parsing
# ---------------------------------------------------------------------------

def extract_frontmatter(content: str) -> str | None:
    """Extract raw YAML frontmatter from markdown content.

    Returns the YAML text between the opening and closing '---' fences,
    or None if no frontmatter is found.
    """
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if match:
        return match.group(1)
    return None


def parse_frontmatter(content: str) -> dict:
    """Parse YAML frontmatter from markdown *content*.

    Uses PyYAML if available; otherwise falls back to regex extraction
    for the specific fields we need (dependencies, links_to).
    """
    raw = extract_frontmatter(content)
    if raw is None:
        return {}

    if HAS_YAML:
        try:
            data = yaml.safe_load(raw)
            return data if isinstance(data, dict) else {}
        except Exception:
            pass  # fall through to regex

    # Regex fallback — extract list fields we care about
    result: dict = {}
    for key in ("dependencies", "links_to"):
        # Match patterns like:
        #   dependencies:
        #     - "08.2"
        #     - 08.3
        pattern = re.compile(
            rf"^{key}\s*:\s*\n((?:\s+-\s+.+\n?)+)",
            re.MULTILINE,
        )
        m = pattern.search(raw)
        if m:
            items = re.findall(r"-\s+[\"']?([^\"'\n]+)[\"']?", m.group(1))
            result[key] = [item.strip() for item in items]
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sha256_file(filepath: str) -> str | None:
    """Return 'sha256:<hex>' for *filepath*, or None if the file is missing."""
    try:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return f"sha256:{h.hexdigest()}"
    except FileNotFoundError:
        return None
    except OSError:
        return None


def discover_story_dirs(base_dir: str) -> dict[str, str]:
    """Walk *base_dir* and return {story_id: story_dir_path} for every
    Story-* directory found under FG-*/Epic-*/."""
    stories: dict[str, str] = {}
    if not os.path.isdir(base_dir):
        return stories

    for fg in sorted(os.listdir(base_dir)):
        fg_path = os.path.join(base_dir, fg)
        if not os.path.isdir(fg_path):
            continue
        for epic in sorted(os.listdir(fg_path)):
            epic_path = os.path.join(fg_path, epic)
            if not os.path.isdir(epic_path):
                continue
            for story in sorted(os.listdir(epic_path)):
                story_path = os.path.join(epic_path, story)
                if not os.path.isdir(story_path):
                    continue
                if story.startswith("Story-"):
                    parts = story.split(" ", 1)
                    sid = parts[0].replace("Story-", "")
                    stories[sid] = story_path
    return stories


def find_parent_epic_md(story_dir: str) -> str | None:
    """Locate the epic.md in the parent Epic-* directory of *story_dir*.

    Returns the absolute path if found, None otherwise.
    """
    epic_dir = os.path.dirname(story_dir)
    candidate = os.path.join(epic_dir, "epic.md")
    if os.path.isfile(candidate):
        return candidate
    # Try case-insensitive search in epic_dir
    if os.path.isdir(epic_dir):
        for fname in os.listdir(epic_dir):
            if fname.lower() == "epic.md" and os.path.isfile(os.path.join(epic_dir, fname)):
                return os.path.join(epic_dir, fname)
    return None


def to_relative(abs_path: str, workspace_root: str) -> str:
    """Convert *abs_path* to a path relative to *workspace_root*.

    Uses forward slashes for portability.
    """
    rel = os.path.relpath(abs_path, workspace_root)
    return rel.replace("\\", "/")


# ---------------------------------------------------------------------------
# Snapshot Generation
# ---------------------------------------------------------------------------

def generate_snapshot(
    story_id: str,
    story_dir: str,
    workspace_root: str,
) -> dict:
    """Build a completion-snapshot dict for the given story.

    Collects sha256 hashes of:
      1. Well-known product-planning docs (DESIGN.md, database-spec, PRD)
      2. Parent epic.md
      3. story.md files for each declared dependency story
      4. ui-spec.md and data-spec.md in the story dir (if they exist)
    """
    dependency_hashes: dict[str, str] = {}

    # ── 1. Well-known dependency files ────────────────────────────────
    for rel_dep in WELL_KNOWN_DEPS:
        abs_dep = os.path.join(workspace_root, rel_dep)
        h = sha256_file(abs_dep)
        if h is not None:
            # Store with forward-slash relative path
            key = rel_dep.replace("\\", "/")
            dependency_hashes[key] = h

    # ── 2. Parent epic.md ─────────────────────────────────────────────
    epic_md = find_parent_epic_md(story_dir)
    if epic_md:
        key = to_relative(epic_md, workspace_root)
        h = sha256_file(epic_md)
        if h:
            dependency_hashes[key] = h

    # ── 3. Parse story.md for dependency story IDs ────────────────────
    story_md_path = os.path.join(story_dir, "story.md")
    dep_story_ids: list[str] = []
    if os.path.isfile(story_md_path):
        # Hash the story's own story.md
        own_key = to_relative(story_md_path, workspace_root)
        own_hash = sha256_file(story_md_path)
        if own_hash:
            dependency_hashes[own_key] = own_hash

        with open(story_md_path, "r", encoding="utf-8") as f:
            content = f.read()
        fm = parse_frontmatter(content)
        dep_story_ids = fm.get("dependencies", []) or []
        links_to = fm.get("links_to", []) or []
        # Combine — links_to may also reference story IDs
        all_dep_ids = list(set(dep_story_ids + links_to))

        # Resolve each dependency story's story.md
        if all_dep_ids:
            base = os.path.join(workspace_root, EPIC_STORY_BASE)
            all_stories = discover_story_dirs(base)
            for dep_id in sorted(all_dep_ids):
                dep_id_str = str(dep_id).strip()
                if dep_id_str in all_stories:
                    dep_story_md = os.path.join(all_stories[dep_id_str], "story.md")
                    h = sha256_file(dep_story_md)
                    if h:
                        key = to_relative(dep_story_md, workspace_root)
                        dependency_hashes[key] = h

    # ── 4. Optional spec files in story dir ───────────────────────────
    for spec_name in ("ui-spec.md", "data-spec.md"):
        spec_path = os.path.join(story_dir, spec_name)
        if os.path.isfile(spec_path):
            key = to_relative(spec_path, workspace_root)
            h = sha256_file(spec_path)
            if h:
                dependency_hashes[key] = h

    # ── Build the snapshot object ─────────────────────────────────────
    snapshot = {
        "story_id": story_id,
        "completed_at": datetime.datetime.now(datetime.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "snapshot_version": SNAPSHOT_VERSION,
        "dependency_hashes": dependency_hashes,
    }
    return snapshot


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a completion snapshot for an I-Wish story."
    )
    parser.add_argument(
        "--story",
        dest="story_id",
        required=True,
        help="Story ID (e.g. 08.1)",
    )
    parser.add_argument(
        "--story-dir",
        dest="story_dir",
        default=None,
        help="Explicit path to the story directory. Auto-discovered if omitted.",
    )
    args = parser.parse_args()

    workspace_root = os.getcwd()
    story_dir = args.story_dir

    # ── Auto-discover story directory if not provided ─────────────────
    if story_dir is None:
        base = os.path.join(workspace_root, EPIC_STORY_BASE)
        all_stories = discover_story_dirs(base)
        if args.story_id not in all_stories:
            print(
                f"ERROR: Story '{args.story_id}' not found under {EPIC_STORY_BASE}",
                file=sys.stderr,
            )
            return 1
        story_dir = all_stories[args.story_id]
    else:
        # Resolve to absolute path if relative
        if not os.path.isabs(story_dir):
            story_dir = os.path.join(workspace_root, story_dir)

    if not os.path.isdir(story_dir):
        print(f"ERROR: Story directory does not exist: {story_dir}", file=sys.stderr)
        return 1

    # ── Generate the snapshot ─────────────────────────────────────────
    snapshot = generate_snapshot(args.story_id, story_dir, workspace_root)

    # ── Write completion-snapshot.json ─────────────────────────────────
    output_path = os.path.join(story_dir, SNAPSHOT_FILENAME)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
        f.write("\n")

    dep_count = len(snapshot["dependency_hashes"])
    print(
        f"✅ Snapshot generated for story {args.story_id} "
        f"({dep_count} dependencies hashed)"
    )
    print(f"   → {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
