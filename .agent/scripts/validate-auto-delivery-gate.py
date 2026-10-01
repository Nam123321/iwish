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
from pathlib import Path

def find_story_dir(story_id, project_root):
    # Try hierarchical layout
    search_path = project_root / "_iwish-output" / "3. Development" / "1. Epic & Story"
    if search_path.exists():
        for story_file in search_path.rglob(f"Story-{story_id}/story.md"):
            return story_file.parent
        for story_file in search_path.rglob(f"story-{story_id}.md"):
            return story_file.parent

    # Try flat layout
    flat_path = project_root / "_iwish-output" / "stories"
    if flat_path.exists():
        for story_file in flat_path.glob(f"story-{story_id}.md"):
            return story_file.parent
            
    return None

def find_story_file(story_dir, story_id):
    sf1 = story_dir / "story.md"
    sf2 = story_dir / f"story-{story_id}.md"
    if sf1.is_file(): return sf1
    if sf2.is_file(): return sf2
    return None

def validate_auto_delivery_gate(story_id):
    project_root = Path(__file__).resolve().parents[2]
    story_dir = find_story_dir(story_id, project_root)
    
    if not story_dir:
        print(f"❌ Error: Cannot find story directory for story_id '{story_id}'.")
        return False
        
    story_file = find_story_file(story_dir, story_id)
    if not story_file:
        print(f"❌ Error: Cannot find story.md in '{story_dir}'.")
        return False

    qa_dir = story_dir / "qa"
    manual_test_guide = qa_dir / "manual-test-guide.md"
    if not manual_test_guide.is_file():
        manual_test_guide = story_dir / "manual-test-guide.md"
        
    if not manual_test_guide.is_file():
        print(f"❌ Error: manual-test-guide.md not found for story '{story_id}'.")
        return False

    story_content = story_file.read_text()
    test_guide_content = manual_test_guide.read_text()

    # 1. AC Traceability Check
    # Extract ACs from story.md. We look for patterns like AC1, AC-1, AC 1.
    ac_matches = re.findall(r'\b(AC[\s\-]?\d+)\b', story_content, re.IGNORECASE)
    # Deduplicate and normalize
    acs = sorted(list(set([re.sub(r'[\s\-]', '', ac).upper() for ac in ac_matches])))
    
    if not acs:
        print(f"⚠️ Warning: No explicit Acceptance Criteria (e.g. AC1, AC-2) found in story '{story_id}'.")
    else:
        missing_acs = []
        for ac in acs:
            # Check if AC is mentioned in the test guide
            # e.g., looking for "AC1" or "AC-1" or "AC 1"
            pattern = re.compile(rf'\b{ac[:2]}[\s\-]?{ac[2:]}\b', re.IGNORECASE)
            if not pattern.search(test_guide_content):
                missing_acs.append(ac)
        
        if missing_acs:
            print(f"❌ Error: AC Traceability Failed! The following ACs from story.md are missing in manual-test-guide.md: {', '.join(missing_acs)}")
            return False
        else:
            print(f"✅ AC Traceability Passed! All {len(acs)} ACs are mapped in the test guide.")

    # 2. Physical Evidence Check
    # Look for any .log, .txt, .json file in the qa directory that isn't the guide itself,
    # or ensure the test guide explicitly references physical passing evidence.
    evidence_found = False
    if qa_dir.is_dir():
        for file in qa_dir.iterdir():
            if file.suffix in ['.log', '.txt', '.json', '.png'] and file.name != 'manual-test-guide.md':
                evidence_found = True
                print(f"✅ Physical Evidence Found: {file.name}")
                break
                
    if not evidence_found:
        # Fallback: check if the test guide contains strong keywords for log evidence
        if re.search(r'(vitest-output|playwright|evidence|log|trace|screenshot)', test_guide_content, re.IGNORECASE):
            evidence_found = True
            print("✅ Physical Evidence referenced in manual-test-guide.md")
        else:
            print("❌ Error: Physical Evidence Check Failed! No log files found in qa/ directory and no evidence traces referenced in manual-test-guide.md.")
            return False
            
    # 3. Test Pass Check
    # Ensure the manual-test-guide actually says passed and doesn't contain un-checked failed tests.
    if re.search(r'Status[\*]*:\s*(Fail|Failed)', test_guide_content, re.IGNORECASE):
        print("❌ Error: manual-test-guide.md indicates a Failed status.")
        return False
        
    if not re.search(r'Status[\*]*:\s*(Pass|Passed|Success)', test_guide_content, re.IGNORECASE):
        print("❌ Error: manual-test-guide.md does not explicitly indicate a Passed status.")
        return False

    print(f"✅ Zero-Trust Automation Gate Passed for Story {story_id}!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 validate-auto-delivery-gate.py <story_id>")
        sys.exit(1)
        
    story_id = sys.argv[1]
    success = validate_auto_delivery_gate(story_id)
    sys.exit(0 if success else 1)
