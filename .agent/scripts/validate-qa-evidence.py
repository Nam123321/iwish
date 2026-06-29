#!/usr/bin/env python3
import sys
import os
import re
import glob

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 validate-qa-evidence.py <epic_id> <story_id>")
        sys.exit(1)

    epic_id = sys.argv[1]
    story_id = sys.argv[2]
    
    spec_pattern_flat = f"_iwish-output/stories/manual-test-spec-{story_id}*.md"
    spec_pattern_hierarchical = f"_iwish-output/3. Development/1. Epic & Story/*/Epic-{epic_id}/Story-{story_id}/manual-test-spec-{story_id}*.md"
    
    spec_files = glob.glob(spec_pattern_flat) + glob.glob(spec_pattern_hierarchical)
    
    if not spec_files:
        print(f"❌ Error: No Spec files found matching {spec_pattern_flat} or {spec_pattern_hierarchical}")
        sys.exit(1)
        
    print(f"🔍 Validating QA Evidence for Epic {epic_id}, Story {story_id}...")
    evidence_dir = f"_iwish-output/qa-evidence/Epic-{epic_id}/Story-{story_id}"
    
    if not os.path.exists(evidence_dir):
        print(f"❌ Error: Evidence directory not found at {evidence_dir}")
        sys.exit(1)
        
    files_in_dir = os.listdir(evidence_dir)
    print(f"📁 Found {len(files_in_dir)} files in evidence directory.")
    
    all_passed = True
    
    for spec_path in spec_files:
        print(f"\n📄 Reading spec: {spec_path}")
        with open(spec_path, 'r') as f:
            content = f.read()
            
        # Extract Zero-Trust constraints (checkboxes)
        constraints = []
        in_zt_section = False
        for line in content.split('\n'):
            if "Zero-Trust Evidence Constraints" in line:
                in_zt_section = True
                continue
            if in_zt_section and line.startswith("##"):
                in_zt_section = False
                
            if in_zt_section:
                match = re.search(r'- \[(x|X)\] \*\*(.*?)\*\*', line)
                if match:
                    constraints.append(match.group(2).strip())
                    
        if not constraints:
            print("⚠️ Warning: No Zero-Trust evidence constraints defined in this spec. Passing by default.")
            continue
            
        print(f"📋 Required Evidence Types: {', '.join(constraints)}")
        
        missing_evidence = []
        for constraint in constraints:
            found = False
            if "DOM Hash" in constraint or "Snapshot" in constraint:
                if any(f.endswith('.html') or f.endswith('.json') for f in files_in_dir):
                    found = True
            elif "Network" in constraint:
                if any(f.endswith('.json') or f.endswith('.har') for f in files_in_dir):
                    found = True
            elif "A11y" in constraint:
                if any(f.endswith('.json') or f.endswith('.txt') or f.endswith('.md') for f in files_in_dir):
                    found = True
            elif "Visual" in constraint or "Screenshot" in constraint:
                if any(f.endswith('.png') or f.endswith('.jpg') or f.endswith('.jpeg') for f in files_in_dir):
                    found = True
            elif "Console Log" in constraint:
                if any(f.endswith('.log') or f.endswith('.txt') for f in files_in_dir):
                    found = True
            elif "Database" in constraint:
                if any(f.endswith('.json') or f.endswith('.sql') for f in files_in_dir):
                    found = True
            elif "Performance" in constraint or "Trace" in constraint:
                if any(f.endswith('.json') or f.endswith('.trace') or f.endswith('.md') for f in files_in_dir):
                    found = True
            else:
                found = len(files_in_dir) > 0
                
            if found:
                print(f"  ✅ Found evidence for: {constraint}")
            else:
                print(f"  ❌ Missing evidence for: {constraint}")
                missing_evidence.append(constraint)
                
        if missing_evidence:
            all_passed = False
            
    if not all_passed:
        print("\n❌ VALIDATION FAILED: Missing required physical evidence for one or more portals.")
        print("Agent may be hallucinating a test pass. Please provide the required evidence.")
        sys.exit(1)
        
    print("\n✅ VALIDATION PASSED: All Zero-Trust evidence constraints met across all portal specs!")
    sys.exit(0)

if __name__ == "__main__":
    main()
