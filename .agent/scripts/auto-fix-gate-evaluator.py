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

import json
import argparse
import sys

# Allowed types for auto-fix
ALLOWLIST_TYPES = {"SyntaxError", "CodeSmell", "TypeError", "LintViolation", "MissingNullCheck"}

def main():
    parser = argparse.ArgumentParser(description="Evaluate Zero-Trust Measure Gates for Auto-Fix Loop.")
    parser.add_argument("--file", required=True, help="Path to the review JSON file.")
    parser.add_argument("--iteration", type=int, required=True, help="Current loop iteration (1, 2, or 3).")
    args = parser.parse_args()

    # Rule 0: Iteration 3 always halts
    if args.iteration >= 3:
        print("DECISION: HALT (Iteration 3 reached max auto-fix limit)")
        sys.exit(1)

    try:
        with open(args.file, "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"DECISION: HALT (Failed to parse JSON: {e})")
        sys.exit(1)

    # Fast track passes if the review is already APPROVED
    if data.get("status") == "APPROVED":
        print("DECISION: HALT (Review already approved, no fix needed)")
        sys.exit(1)

    findings = data.get("findings", [])
    if not findings:
        print("DECISION: HALT (No findings to fix)")
        sys.exit(1)

    # Complexity Score must be <= 2 (or LOW)
    complexity_val = data.get("complexity_score")
    if isinstance(complexity_val, str):
        if complexity_val.upper() != "LOW":
             print("DECISION: HALT (Complexity is not LOW)")
             sys.exit(1)
    elif isinstance(complexity_val, (int, float)):
        if complexity_val > 2:
            print(f"DECISION: HALT (Complexity score {complexity_val} > 2)")
            sys.exit(1)
    else:
        print("DECISION: HALT (Invalid or missing complexity_score)")
        sys.exit(1)

    unique_files = set()

    for finding in findings:
        f_type = finding.get("type")
        if f_type not in ALLOWLIST_TYPES:
            print(f"DECISION: HALT (Finding type '{f_type}' not in allowlist)")
            sys.exit(1)
            
        severity = str(finding.get("severity", "")).upper()
        if severity == "CRITICAL":
            print("DECISION: HALT (CRITICAL severity blocked in all iterations)")
            sys.exit(1)
        
        # Collect files for Iteration 2
        f_file = finding.get("file")
        if f_file:
            unique_files.add(f_file)
    
    # If Iteration 2, impact files must be exactly 1
    if args.iteration >= 2:
        if len(unique_files) > 1:
            print(f"DECISION: HALT (Iteration 2 blocks multi-file impact. Files: {len(unique_files)})")
            sys.exit(1)

    print("DECISION: AUTO_FIX")
    sys.exit(0)

if __name__ == "__main__":
    main()
