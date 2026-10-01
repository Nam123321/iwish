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

import sys

def main():
    files_changed = 0
    lines_changed = 0

    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--files-changed" and i < len(sys.argv) - 1:
            files_changed = int(sys.argv[i+1])
        if arg == "--lines-changed" and i < len(sys.argv) - 1:
            lines_changed = int(sys.argv[i+1])

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: review-tier-calculator.py --files-changed <int> --lines-changed <int>")
        sys.exit(0)

    # Tier thresholds (QUICK tier REMOVED per user directive)
    # CS < 3 → STANDARD, CS >= 3 → DEEP
    tier = "STANDARD"  # Minimum tier is always STANDARD
    if files_changed > 10 or lines_changed > 500:
        tier = "DEEP"
    # Note: no QUICK tier logic here anymore

    print(f"Review Tier Evaluated: {tier}")
    
    if tier == "DEEP":
        print("⚠️ DEEP tier requires Adversarial Review protocol.")
    else:
        print("ℹ️ STANDARD tier requires basic 3-layer checklist.")
        
    # Output to stdout can be captured by bash scripts
    sys.exit(0)

if __name__ == "__main__":
    main()
