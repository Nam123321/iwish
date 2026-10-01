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
        print("Usage: validate-design-audit.py <ux_spec_file.md>")
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: validate-design-audit.py <ux_spec_file.md>")
        sys.exit(1)

    ux_file = sys.argv[1]
    
    try:
        with open(ux_file) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ FAIL: File not found: {ux_file}")
        sys.exit(1)

    REQUIRED_PASSES = [
        "Information Architecture",
        "State Coverage", 
        "Typography",
        "Interaction",
        "Responsive",
        "Accessibility",
        "AI Slop"
    ]

    # Extract scores
    scores = {}
    for p in REQUIRED_PASSES:
        # Match "Information Architecture: 8/10" or similar
        match = re.search(rf'{p}.*?(\d+)/10', content, re.IGNORECASE)
        if match:
            scores[p] = int(match.group(1))

    # Gate 1: All 7 passes present
    missing = [p for p in REQUIRED_PASSES if p not in scores]
    if missing:
        print(f"❌ FAIL: Missing design audit passes: {missing}")
        sys.exit(1)

    # Gate 2: All scores >= 6
    failing = {p: s for p, s in scores.items() if s < 6}
    if failing:
        print(f"❌ FAIL: Design passes below threshold (6/10): {failing}")
        sys.exit(1)

    avg = sum(scores.values()) / len(scores)
    print(f"✅ PASS: All 7 design passes validated. Average: {avg:.1f}/10")
    sys.exit(0)

if __name__ == "__main__":
    main()
