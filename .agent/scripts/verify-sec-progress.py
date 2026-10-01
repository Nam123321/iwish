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

"""Validates SEC (Story Execution Checklist) progress at each task checkpoint.
Enforces that agents cannot bulk-write tasks without corresponding AC progress."""
import sys, json, os

def main():
    sec_path = None
    completed_tasks = 0

    for i, arg in enumerate(sys.argv):
        if arg == "--sec" and i+1 < len(sys.argv):
            sec_path = sys.argv[i+1]
        elif arg == "--completed-tasks" and i+1 < len(sys.argv):
            completed_tasks = int(sys.argv[i+1])

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: verify-sec-progress.py --sec <path> --completed-tasks <int>")
        sys.exit(0)

    if not sec_path or not os.path.exists(sec_path):
        print("⚠️ Warning: SEC file missing, skipping progress check.")
        sys.exit(0)

    with open(sec_path) as f:
        sec = json.load(f)

    acs = sec.get("ac_mapping", [])
    total = len(acs)
    if total == 0:
        sys.exit(0)

    # CHECKPOINT_INTERVAL = 1: Check every single task
    CHECKPOINT_INTERVAL = 1

    # Count ACs that have actual evidence of completion in the SEC
    # Require physical existence for any claimed files
    acs_with_evidence = 0
    for ac in acs:
        impl_file = ac.get("impl_file", "")
        evidence_str = str(ac.get("evidence", ""))
        status = ac.get("status", "")
        
        if impl_file:
            if not os.path.exists(impl_file):
                print(f"❌ FAILED: AC claims impl_file '{impl_file}' but it does not exist on disk.")
                sys.exit(1)
            acs_with_evidence += 1
            continue
            
        words = evidence_str.split()
        path_found_and_exists = False
        path_found_and_missing = False
        
        for w in words:
            w = w.strip('\'".,;')
            if '/' in w or w.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.md')):
                if os.path.exists(w):
                    path_found_and_exists = True
                else:
                    path_found_and_missing = True
                    
        if path_found_and_missing and not path_found_and_exists:
            print(f"❌ FAILED: AC evidence '{evidence_str}' contains a path that does not exist.")
            sys.exit(1)
            
        if path_found_and_exists or status in ("completed", "done", "verified") or evidence_str:
            acs_with_evidence += 1

    print(f"SEC Progress: {completed_tasks} tasks completed.")
    print(f"ACs with evidence: {acs_with_evidence} of {total}")

    # ENFORCEMENT 1: Agent claims many tasks but zero ACs have evidence
    # This catches the "bulk-write skeleton code" bypass pattern
    if completed_tasks >= 3 and acs_with_evidence == 0:
        print("❌ FAILED: Agent completed ≥3 tasks but zero ACs have evidence. "
              "SEC bypass suspected (bulk skeleton write).")
        sys.exit(1)

    # ENFORCEMENT 2: Ratio check — tasks should not massively exceed ACs
    # If agent claims 2x more tasks than total ACs, something is wrong
    if completed_tasks > 0 and completed_tasks > total * 2:
        print("❌ FAILED: Agent completed significantly more tasks than total ACs. "
              "SEC bypass suspected.")
        sys.exit(1)

    # ENFORCEMENT 3: Progress gap — tasks far ahead of evidenced ACs
    # Agent should not be more than 3 tasks ahead of verified ACs
    if completed_tasks > acs_with_evidence + 3:
        print(f"⚠️ WARNING: Agent is {completed_tasks - acs_with_evidence} tasks "
              f"ahead of verified ACs. Consider pausing to verify progress.")
        # Warning only, not blocking — to avoid false positives on legitimate
        # infrastructure tasks that don't map 1:1 to ACs

    print("✅ SEC progress check passed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
