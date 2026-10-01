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
import argparse
import re
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Architecture Framework Validator")
    parser.add_argument("--file", required=True, help="Path to the architecture evaluation report")
    args = parser.parse_args()

    target_file = Path(args.file)

    if not target_file.exists():
        print(f"❌ FAIL: Target file {target_file} does not exist.")
        sys.exit(1)

    with open(target_file, 'r') as f:
        content = f.read().lower()

    required_keywords = [
        ("harness", "Harness & Graph Execution"),
        ("graph", "Harness & Graph Execution"),
        ("routing", "Routing & Loops"),
        ("loop", "Routing & Loops"),
        ("cost", "Cost Structure (Workload Economics)"),
        ("industry", "Industry Best Practices & Mistakes"),
        ("best practice", "Industry Best Practices & Mistakes")
    ]
    
    # Remove markdown code blocks to avoid matching comments as headings
    content_without_code = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
    
    # We will look for headings specifically. Let's extract all headings first.
    headings = re.findall(r'^#+\s+(.*)$', content_without_code, re.MULTILINE)
    headings_text = " ".join(headings)
    
    # We require specific concepts to be present in the headings
    required_frameworks = [
        ("harness", "Harness & Graph Execution"),
        ("routing", "Routing & Loops"),
        ("cost", "Cost Structure"),
        ("best practice", "Industry Best Practices")
    ]
    
    missing = []
    for keyword, name in required_frameworks:
        if keyword not in headings_text:
            missing.append(name)
            
    if missing:
        print(f"❌ Zero-Trust Violation: The report at {target_file} is missing required architectural framework components in its headings.")
        print(f"Missing components: {', '.join(missing)}")
        print("Please ensure your analysis explicitly covers these aspects to avoid superficial evaluations.")
        sys.exit(1)

    print(f"✅ PASS: Architecture framework validation successful for {target_file}.")
    sys.exit(0)

if __name__ == "__main__":
    main()
