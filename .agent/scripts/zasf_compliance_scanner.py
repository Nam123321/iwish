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
import re
import os

def scan_zasf_compliance(filepath):
    if not os.path.exists(filepath):
        print(f"❌ ZASF Scanner Error: File not found: {filepath}")
        return 1

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Check for "Zero-IT" section (case-insensitive)
    has_zero_it_section = bool(re.search(r'#.*Zero-IT', content, re.IGNORECASE))
    
    # 2. Check for CTS scoring table pattern (e.g. headers with "CTS" or "Score" and some content)
    has_cts_table = bool(re.search(r'\|.*CTS.*\|', content, re.IGNORECASE)) or bool(re.search(r'\|.*Score.*\|', content, re.IGNORECASE))
    
    if not has_zero_it_section:
        print(f"❌ ZASF Compliance FAILED in {filepath}: Missing 'Zero-IT Assistance' section.")
        print("💡 Hint: You must evaluate every field for ZASF/CTS scoring.")
        return 1
        
    if not has_cts_table:
        print(f"❌ ZASF Compliance FAILED in {filepath}: Missing CTS scoring table.")
        print("💡 Hint: Ensure you include a markdown table containing the CTS scores for the UI elements.")
        return 1

    print(f"✅ ZASF Compliance PASSED for {filepath}")
    return 0

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Scan UI Spec for Zero-IT Assistance compliance.")
    parser.add_argument("--file", required=True, help="Path to the UI spec markdown file")
    args = parser.parse_args()
    
    sys.exit(scan_zasf_compliance(args.file))
