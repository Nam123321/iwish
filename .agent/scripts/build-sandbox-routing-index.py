#!/usr/bin/env python3
# --- [Watchmen Core Injection] ---
import os, sys
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------
"""
Category A Deterministic Routing Index Generator for Curriculum Sandbox.
Scans ~/.iwish/sandbox/ai-engineering-from-scratch/phases/,
maps all phases and lessons, queries current git commit,
and generates routing-index.yaml with zero hallucination.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
import yaml

DEFAULT_SANDBOX = Path(os.path.expanduser("~/.iwish/sandbox/ai-engineering-from-scratch")).resolve()
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "skills" / "ai-engineering-knowledge-consultant" / "references" / "routing-index.yaml"


def get_current_commit(sandbox: Path) -> str:
    try:
        res = subprocess.run(
            ["git", "-C", str(sandbox), "rev-parse", "HEAD"],
            capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except Exception:
        return "unknown"


def build_routing_index(sandbox: Path) -> dict:
    phases_dir = sandbox / "phases"
    if not phases_dir.exists() or not phases_dir.is_dir():
        print(f"❌ [INDEX-ERROR] Phases directory not found: {phases_dir}", file=sys.stderr)
        sys.exit(1)

    commit_hash = get_current_commit(sandbox)
    phases = {}
    total_lessons = 0

    # Scan all directories in phases/ sorted alphabetically
    phase_entries = sorted([d for d in phases_dir.iterdir() if d.is_dir()])

    for p in phase_entries:
        phase_name = p.name
        # Find all lesson subdirectories
        lessons = sorted([l.name for l in p.iterdir() if l.is_dir()])
        lesson_count = len(lessons)
        total_lessons += lesson_count

        phases[phase_name] = {
            "lesson_count": lesson_count,
            "lessons": lessons
        }

    return {
        "version": "1.0.0",
        "pinned_commit": commit_hash,
        "total_phases": len(phases),
        "total_lessons": total_lessons,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "phases": phases
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Sandbox Routing Index YAML")
    parser.add_argument("--sandbox", help="Path to sandbox repository")
    parser.add_argument("--output", help="Path to output routing-index.yaml")
    args = parser.parse_args()

    sandbox = Path(args.sandbox).expanduser().resolve() if args.sandbox else DEFAULT_SANDBOX
    output_path = Path(args.output).resolve() if args.output else DEFAULT_OUTPUT

    output_path.parent.mkdir(parents=True, exist_ok=True)
    index_data = build_routing_index(sandbox)

    # Convert to YAML format
    yaml_content = yaml.dump(index_data, sort_keys=False, allow_unicode=True)

    output_path.write_text(yaml_content, encoding="utf-8")
    print(json.dumps({
        "status": "SUCCESS",
        "total_phases": index_data["total_phases"],
        "total_lessons": index_data["total_lessons"],
        "pinned_commit": index_data["pinned_commit"],
        "output_file": str(output_path)
    }, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
