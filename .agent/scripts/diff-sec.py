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

import sys, json, os

def main():
    old_path = None
    new_path = None

    for i, arg in enumerate(sys.argv):
        if arg == "--old" and i+1 < len(sys.argv):
            old_path = sys.argv[i+1]
        elif arg == "--new" and i+1 < len(sys.argv):
            new_path = sys.argv[i+1]

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: diff-sec.py --old <path> --new <path>")
        sys.exit(0)

    if not old_path or not new_path:
        print("Error: Both --old and --new are required")
        sys.exit(1)

    if not os.path.exists(old_path) or not os.path.exists(new_path):
        print("⚠️ Warning: One of the SEC files is missing. Cannot diff.")
        sys.exit(0)

    with open(old_path) as f: old_sec = json.load(f)
    with open(new_path) as f: new_sec = json.load(f)

    # Simple comparison
    old_acs = {ac.get("id"): ac.get("description") for ac in old_sec.get("ac_mapping", [])}
    new_acs = {ac.get("id"): ac.get("description") for ac in new_sec.get("ac_mapping", [])}

    diffs = []
    for ac_id, desc in new_acs.items():
        if ac_id not in old_acs:
            diffs.append(f"Added AC: {ac_id}")
        elif old_acs[ac_id] != desc:
            diffs.append(f"Modified AC: {ac_id}")

    if diffs:
        print("✅ DRIFT DETECTED: SEC has changed.")
        for d in diffs: print(f"  - {d}")
        sys.exit(1)  # Signal drift exists
    else:
        print("ℹ️ NO DRIFT: SEC is unchanged.")
        sys.exit(0)

if __name__ == "__main__":
    main()
