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
detect-story-drift.py — Deterministic drift detection for completed stories.

Compares current dependency file hashes against a saved completion-snapshot.json
to detect if any dependency changed since the story was marked completed.

Usage:
    python detect-story-drift.py --story 08.1
    python detect-story-drift.py --epic 08

Exit codes:
    0 — No drift detected in any scanned story
    1 — Drift detected in at least one story
"""

import argparse
import hashlib
import json
import os
import sys


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EPIC_STORY_BASE = os.path.join(
    "_iwish-output", "3. Development", "1. Epic & Story"
)
SNAPSHOT_FILENAME = "completion-snapshot.json"


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
                # Extract story ID from directory name like "Story-08.1 …"
                if story.startswith("Story-"):
                    # Story ID is the token right after "Story-"
                    parts = story.split(" ", 1)
                    sid = parts[0].replace("Story-", "")
                    stories[sid] = story_path
    return stories


def find_stories_for_epic(all_stories: dict[str, str], epic_id: str) -> dict[str, str]:
    """Return the subset of *all_stories* whose ID starts with *epic_id*
    (e.g. epic_id='08' matches '08.1', '08.2', etc.)."""
    matched: dict[str, str] = {}
    for sid, spath in all_stories.items():
        # Match if story ID starts with the epic ID followed by '.'
        # or the story dir lives under an Epic-<epic_id> directory.
        if sid.startswith(epic_id + ".") or sid == epic_id:
            matched[sid] = spath
        else:
            # Fallback: check if parent dir name contains the epic ID
            parent = os.path.basename(os.path.dirname(spath))
            if parent.startswith(f"Epic-{epic_id}"):
                matched[sid] = spath
    return matched


def check_drift(story_id: str, story_dir: str, workspace_root: str) -> dict | None:
    """Check a single story for drift.

    Returns a dict describing the drift result, or None if the story
    should be skipped (no snapshot found).
    """
    snapshot_path = os.path.join(story_dir, SNAPSHOT_FILENAME)
    if not os.path.isfile(snapshot_path):
        return None  # skip

    # Load the snapshot
    with open(snapshot_path, "r", encoding="utf-8") as f:
        snapshot = json.load(f)

    dep_hashes: dict[str, str] = snapshot.get("dependency_hashes", {})
    drifted_files: list[dict] = []

    for rel_path, snapshot_hash in dep_hashes.items():
        # Resolve relative path from workspace root
        abs_path = os.path.join(workspace_root, rel_path)
        current_hash = sha256_file(abs_path)

        if current_hash is None:
            # File was deleted or is inaccessible
            drifted_files.append({
                "file": rel_path,
                "snapshot_hash": snapshot_hash,
                "current_hash": None,
                "status": "deleted",
            })
        elif current_hash != snapshot_hash:
            drifted_files.append({
                "file": rel_path,
                "snapshot_hash": snapshot_hash,
                "current_hash": current_hash,
                "status": "changed",
            })
        # else: no drift for this file

    if drifted_files:
        return {
            "story_id": story_id,
            "story_dir": story_dir,
            "drifted_files": drifted_files,
        }
    else:
        return {
            "story_id": story_id,
            "no_drift": True,
        }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Detect dependency drift for completed I-Wish stories."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--story",
        dest="story_id",
        help="Single story ID to check (e.g. 08.1)",
    )
    group.add_argument(
        "--epic",
        dest="epic_id",
        help="Epic ID — scan all completed stories in this epic (e.g. 08)",
    )
    args = parser.parse_args()

    workspace_root = os.getcwd()

    # Discover all story directories
    base = os.path.join(workspace_root, EPIC_STORY_BASE)
    all_stories = discover_story_dirs(base)

    # Determine which stories to scan
    if args.story_id:
        target_stories: dict[str, str] = {}
        if args.story_id in all_stories:
            target_stories[args.story_id] = all_stories[args.story_id]
        else:
            print(
                f"WARNING: Story '{args.story_id}' not found under {EPIC_STORY_BASE}",
                file=sys.stderr,
            )
    else:
        target_stories = find_stories_for_epic(all_stories, args.epic_id)
        if not target_stories:
            print(
                f"WARNING: No stories found for epic '{args.epic_id}' under {EPIC_STORY_BASE}",
                file=sys.stderr,
            )

    # Scan each story
    drift_detected: list[dict] = []
    no_drift: list[str] = []
    skipped: list[str] = []

    for sid in sorted(target_stories.keys()):
        sdir = target_stories[sid]
        result = check_drift(sid, sdir, workspace_root)

        if result is None:
            # No snapshot found — skip with warning
            print(
                f"WARNING: No {SNAPSHOT_FILENAME} for story {sid} in {sdir}, skipping.",
                file=sys.stderr,
            )
            skipped.append(sid)
        elif result.get("no_drift"):
            no_drift.append(sid)
        else:
            drift_detected.append(result)

    # Build output
    output = {
        "stories_scanned": len(target_stories),
        "drift_detected": drift_detected,
        "no_drift": no_drift,
        "skipped": skipped,
    }

    print(json.dumps(output, indent=2))

    # Exit code: 1 if any drift detected, 0 otherwise
    return 1 if drift_detected else 0


if __name__ == "__main__":
    sys.exit(main())
