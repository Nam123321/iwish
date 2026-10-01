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
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-autoplan-options.py <epics_file.md>")
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: validate-autoplan-options.py <epics_file.md>")
        sys.exit(1)

    epics_file = sys.argv[1]
    
    try:
        with open(epics_file) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ FAIL: File not found: {epics_file}")
        sys.exit(1)

    REQUIRED_SECTIONS = [
        "Option A",
        "Option B", 
        "Option C",
        "Cross-Epic Dependency Matrix",
        "Infrastructure Requirements"
    ]

    missing = [s for s in REQUIRED_SECTIONS if s not in content]
    if missing:
        print(f"❌ FAIL: Missing autoplan sections: {missing}")
        sys.exit(1)

    # Verify user selection was recorded
    if "Selected Option:" not in content and "Phương án được chọn:" not in content:
        print("❌ FAIL: No user selection recorded (HUMAN GATE bypass detected)")
        sys.exit(1)

    print("✅ PASS: Autoplan 3-option validated with user selection")
    sys.exit(0)

if __name__ == "__main__":
    main()
