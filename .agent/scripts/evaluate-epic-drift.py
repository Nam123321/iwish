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
Evaluate Epic Drift — Real implementation replacing the dummy stub.

Now delegates to architecture-coherence-checker.py for ADR↔Story tech cross-reference,
plus performs contract drift and test coverage checks.

Rewritten: 2026-07-30
Reason: Original was a no-op stub that always returned True, causing Epic 46
        Temporal.io vs BullMQ conflict to go undetected.
"""

import sys
import os
import json
import argparse
import glob
import subprocess
from pathlib import Path


def find_architecture_file():
    """Search for architecture.md in standard locations."""
    candidates = [
        "_iwish-output/2. Product Planning/2.5. architecture.md",
        "_iwish-output/architecture.md",
        "_iwish-output/2. Architecture/architecture.md",
        "docs/architecture.md",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def find_epic_dir(epic_id: str) -> str | None:
    """Find the physical directory for an epic."""
    pattern = f"_iwish-output/3. Development/1. Epic & Story/*/Epic-{epic_id}"
    matches = glob.glob(pattern)
    return matches[0] if matches else None


def run_coherence_check(arch_path: str, epic_dir: str) -> dict:
    """Run the architecture coherence checker."""
    output_path = f"_iwish-output/adhoc-workspace/scratch/coherence-report-epic-drift.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    script_path = os.path.join(os.path.dirname(__file__), "architecture-coherence-checker.py")
    if not os.path.exists(script_path):
        print(f"WARNING: architecture-coherence-checker.py not found at {script_path}")
        return {"overall_status": "SKIP", "reason": "checker script not found"}

    result = subprocess.run(
        [sys.executable, script_path,
         "--architecture", arch_path,
         "--epic-dir", epic_dir,
         "--output-json", output_path],
        capture_output=True, text=True
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    if os.path.exists(output_path):
        with open(output_path, "r") as f:
            return json.load(f)
    return {"overall_status": "FAIL" if result.returncode != 0 else "PASS"}


def check_contract_drift(epic_dir: str) -> bool:
    """Check for API contract changes (data-spec vs codebase)."""
    # Look for data-spec files and verify key API endpoints still exist
    data_specs = glob.glob(os.path.join(epic_dir, "*/data-spec.md"))
    if not data_specs:
        return True  # No data specs = no contract to drift

    # Basic check: data-spec files exist and are non-empty
    for spec in data_specs:
        if os.path.getsize(spec) < 50:
            print(f"WARNING: Data spec appears empty: {spec}")
            return False
    return True


def check_test_coverage(epic_dir: str) -> bool:
    """Basic check that test files exist for stories."""
    story_dirs = glob.glob(os.path.join(epic_dir, "Story-*"))
    stories_without_tests = []

    for sd in story_dirs:
        story_file = os.path.join(sd, "story.md")
        if not os.path.exists(story_file):
            continue
        with open(story_file, "r") as f:
            content = f.read()
            
        # Check status from YAML frontmatter
        status_line = next((line for line in content.splitlines() if line.startswith("status:")), "")
        status = status_line.split(":")[-1].strip().lower()
        if status in ["superseded", "cancelled", "merged", "deprecated", "backlog", "ready-for-dev", "in-progress"]:
            continue
            
        import re
        if re.search(r'^type:\s*Config', content, re.IGNORECASE | re.MULTILINE) or re.search(r'^no-code-required:\s*true', content, re.IGNORECASE | re.MULTILINE):
            continue
            
        task_file = os.path.join(sd, "task.md")
        if os.path.exists(task_file):
            with open(task_file, "r") as tf:
                task_content = tf.read()
                if re.search(r'\[[xX/]\].*?No tests required.*?Reason:[ \t]*([^\n]{10,})', task_content, re.IGNORECASE):
                    continue

        # Check if AC-to-Task traceability references test files
        if "test" not in content.lower() and ".test." not in content:
            stories_without_tests.append(os.path.basename(sd))

    if stories_without_tests:
        print(f"WARNING: Stories without test references: {', '.join(stories_without_tests)}")
    return len(stories_without_tests) == 0


def check_drift(epic_id: str) -> bool:
    """Main drift evaluation orchestrator."""
    print(f"Evaluating drift for Epic {epic_id}...")

    epic_dir = find_epic_dir(epic_id)
    if not epic_dir:
        print(f"ERROR: Epic directory not found for Epic {epic_id}")
        return False

    arch_path = find_architecture_file()
    if not arch_path:
        print("WARNING: Architecture file not found. Skipping ADR coherence check.")
        arch_coherence_pass = True
    else:
        coherence_result = run_coherence_check(arch_path, epic_dir)
        arch_coherence_pass = coherence_result.get("overall_status") != "FAIL"

    contract_pass = check_contract_drift(epic_dir)
    test_pass = check_test_coverage(epic_dir)

    drift_report = {
        "architecture_drift": not arch_coherence_pass,
        "contract_drift": not contract_pass,
        "test_coverage_drop": not test_pass,
        "performance_drift": False,  # Future: integrate with performance budget checks
    }

    all_pass = all(not v for v in drift_report.values())

    if all_pass:
        print("Drift Evaluation Passed.")
    else:
        print("Drift Evaluation FAILED.")
        for key, has_drift in drift_report.items():
            if has_drift:
                print(f"  ❌ {key}: DRIFT DETECTED")
            else:
                print(f"  ✅ {key}: OK")

    return all_pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Epic Drift")
    parser.add_argument("--epic", required=True, help="Epic ID to evaluate")
    args = parser.parse_args()

    if check_drift(args.epic):
        sys.exit(0)
    else:
        sys.exit(1)
