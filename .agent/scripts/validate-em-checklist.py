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

import sys, re

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-em-checklist.py <architecture_file.md>")
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: validate-em-checklist.py <architecture_file.md>")
        sys.exit(1)

    arch_file = sys.argv[1]
    
    try:
        with open(arch_file) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ FAIL: File not found: {arch_file}")
        sys.exit(1)

    # Gate 1: Section exists
    if "## Engineering Review Checklist" not in content:
        print("❌ FAIL: Missing '## Engineering Review Checklist' section")
        sys.exit(1)

    # Gate 2: Extract checklist section
    section = content.split("## Engineering Review Checklist")[1]
    if "##" in section:
        section = section.split("##")[0]

    # Gate 3: Count answered items (not empty/placeholder)
    # Looking for lines like "- **Blast Radius**: [answer]"
    items = re.findall(r'- \*\*(.+?)\*\*:\s*(.+)', section)
    valid_items = [i for i in items if len(i[1].strip()) > 20 and not i[1].strip().startswith('[')]

    if len(valid_items) < 12:  # At least 12/15 must be substantive
        print(f"❌ FAIL: Only {len(valid_items)}/15 EM items answered substantively")
        sys.exit(1)

    print(f"✅ PASS: {len(valid_items)}/15 EM checklist items validated")
    sys.exit(0)

if __name__ == "__main__":
    main()
