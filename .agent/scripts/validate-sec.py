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
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-sec.py <sec_json_path>")
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Error: SEC JSON path required")
        sys.exit(1)

    sec_path = sys.argv[1]
    if not os.path.exists(sec_path):
        print(f"❌ FAIL: SEC file not found: {sec_path}")
        sys.exit(1)

    try:
        with open(sec_path) as f:
            sec_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ FAIL: Invalid JSON in SEC file: {e}")
        sys.exit(1)

    required_keys = ["ac_mapping", "ui_elements", "data_models"]
    missing = [k for k in required_keys if k not in sec_data]
    
    if missing:
        print(f"❌ FAIL: SEC missing required structural keys: {missing}")
        sys.exit(1)

    if not sec_data["ac_mapping"]:
        print("❌ FAIL: SEC ac_mapping is empty. No ACs found.")
        sys.exit(1)

    print("✅ PASS: SEC structure validated successfully.")
    sys.exit(0)

if __name__ == "__main__":
    main()
