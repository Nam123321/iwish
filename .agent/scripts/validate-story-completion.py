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
import json
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--story', required=True, help='Path to story.md (e.g., _iwish-output/.../story.md)')
    args = parser.parse_args()
    
    story_path = args.story
    if not os.path.exists(story_path):
        print(f"❌ ERROR: Story file not found: {story_path}")
        sys.exit(1)
        
    story_dir = os.path.dirname(story_path)
    traceability_path = os.path.join(story_dir, "task-traceability.json")
    
    if not os.path.exists(traceability_path):
        # Fallback to older traceability.json
        traceability_path = os.path.join(story_dir, "traceability.json")
        
    if not os.path.exists(traceability_path):
        # Strictly isolate the AC-to-Task Matrix to avoid false positives (e.g. "completed" in Epic Status)
        with open(story_path, 'r', encoding='utf-8') as f:
            story_text = f.read()
            
        matrix_match = re.search(r'## AC-to-Task Traceability Matrix.*?(?=\n#+ |\Z)', story_text, re.DOTALL | re.IGNORECASE)
        if matrix_match and re.search(r'\|\s*completed\s*\|', matrix_match.group(0).lower()):
            print(f"❌ ERROR: story.md has hardcoded 'completed' status in AC-to-Task matrix,")
            print(f"   but no task-traceability.json exists. Run ac-to-task-mapper.py first.")
            sys.exit(1)
            
        print(f"⚠️ WARNING: No traceability.json found in {story_dir}. Assuming Design-Only story.")
        print("✅ Gate Passed (Design-Only).")
        sys.exit(0)
        
    with open(traceability_path, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"❌ ERROR: Invalid JSON in {traceability_path}")
            sys.exit(1)
            
    acs = data.get("acs", [])
    if not acs:
        print("✅ Gate Passed (No ACs to validate).")
        sys.exit(0)
        
    has_code = False
    for ac in acs:
        impls = ac.get("impl_files", [])
        tests = ac.get("test_files", [])
        if impls or tests:
            has_code = True
            break
            
    if not has_code:
        print(f"⚠️ INFO: No code implementations mapped for any AC. Classified as Design-Only.")
        print("✅ Gate Passed (Design-Only).")
        sys.exit(0)
        
    # Story has code -> Enforce all ACs mapped
    incomplete_acs = []
    for ac in acs:
        impls = ac.get("impl_files", [])
        tests = ac.get("test_files", [])
        if not impls and not tests:
            incomplete_acs.append(ac.get("ac_id", "Unknown"))
            
    if incomplete_acs:
        print(f"❌ ERROR: Completion Gate Failed. The following ACs have NO code or test mappings:")
        for ac in incomplete_acs:
            print(f"  - {ac}")
        print("\nStory cannot be marked 'completed'.")
        sys.exit(1)
        
    print("✅ Completion Gate Passed: All ACs are mapped to code/test files.")

if __name__ == "__main__":
    main()
