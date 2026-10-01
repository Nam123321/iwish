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

import sys, os

def main():
    story_id = None
    target_file = None
    min_chars = 100

    # Parse args
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        story_id = sys.argv[1]

    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--target" and i < len(sys.argv):
            target_file = sys.argv[i+1]
        elif arg == "--min-chars" and i < len(sys.argv):
            min_chars = int(sys.argv[i+1])
            
    # For help text
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-iron-law.py <story_id> --target <file_path> [--min-chars <int>]")
        sys.exit(0)

    if not target_file or not os.path.exists(target_file):
        print("❌ IRON LAW VIOLATION: No target root cause evidence file found.")
        print("   You MUST create a root-cause analysis BEFORE attempting a fix.")
        sys.exit(1)

    with open(target_file) as f:
        content = f.read()

    if len(content.strip()) < min_chars:
        print(f"❌ IRON LAW VIOLATION: Evidence too short ({len(content)} chars < {min_chars} min)")
        print("   Root cause analysis must be substantive, not a placeholder.")
        sys.exit(1)

    # Check required sections
    required = ["Error", "Root cause", "Evidence"]
    missing = [r for r in required if r.lower() not in content.lower()]
    if missing:
        print(f"❌ IRON LAW VIOLATION: Missing required sections: {missing}")
        sys.exit(1)

    print("✅ IRON LAW PASS: Root cause evidence validated.")
    sys.exit(0)

if __name__ == "__main__":
    main()
