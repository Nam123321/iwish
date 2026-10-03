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

"""CDI Structural Integrity Validator — D11

Companion validator for compile-dependency-index.py (D10).
Checks structural integrity of the Compiled Dependency Index.

Exit 0 on pass, exit 1 on fail.
"""
import os
import yaml
import sys
import glob

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUTPUT_DIR = os.path.join(BASE_DIR, '_iwish-output')
CDI_FILE = os.path.join(OUTPUT_DIR, 'notebooks', 'dependency-index.yaml')
EPIC_STORY_DIR = os.path.join(OUTPUT_DIR, '3. Development', '1. Epic & Story')


def main():
    cdi_path = sys.argv[1] if len(sys.argv) > 1 else CDI_FILE
    errors = []

    # Check 1: File exists and is valid YAML
    if not os.path.exists(cdi_path):
        print(f"FAIL: CDI file {cdi_path} does not exist.")
        sys.exit(1)

    try:
        with open(cdi_path, 'r', encoding='utf-8') as f:
            cdi = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"FAIL: CDI is not valid YAML: {e}")
        sys.exit(1)

    if not isinstance(cdi, dict):
        print("FAIL: CDI root is not a dictionary.")
        sys.exit(1)

    # Check 2: Required top-level keys
    required_keys = ['version', 'compiled_at', 'sources_used', 'epics', 'stories']
    for key in required_keys:
        if key not in cdi:
            errors.append(f"Missing required top-level key: {key}")

    # Check 3: Every physical Epic directory has a CDI entry
    physical_epics = set()
    if os.path.exists(EPIC_STORY_DIR):
        for fg_folder in os.listdir(EPIC_STORY_DIR):
            fg_path = os.path.join(EPIC_STORY_DIR, fg_folder)
            if os.path.isdir(fg_path):
                for epic_folder in os.listdir(fg_path):
                    if epic_folder.startswith('Epic-') and os.path.isdir(os.path.join(fg_path, epic_folder)):
                        physical_epics.add(epic_folder)

    cdi_epics = set(cdi.get('epics', {}).keys())
    missing = physical_epics - cdi_epics
    if missing:
        errors.append(f"Physical Epics missing from CDI: {sorted(missing)}")

    # Check 3.5: Physical story directory scanner
    physical_stories = set()
    if os.path.exists(EPIC_STORY_DIR):
        for fg_folder in os.listdir(EPIC_STORY_DIR):
            fg_path = os.path.join(EPIC_STORY_DIR, fg_folder)
            if os.path.isdir(fg_path):
                for epic_folder in os.listdir(fg_path):
                    if epic_folder.startswith('Epic-') and os.path.isdir(os.path.join(fg_path, epic_folder)):
                        epic_path = os.path.join(fg_path, epic_folder)
                        for story_folder in os.listdir(epic_path):
                            if story_folder.startswith('Story-') and os.path.isdir(os.path.join(epic_path, story_folder)):
                                physical_stories.add(story_folder.lower())
                                
    cdi_stories = set([s.lower() for s in (cdi.get('stories') or {}).keys()])

    # Check 4: Confidence scores in valid range [0.0, 1.0]
    for epic_id, data in cdi.get('epics', {}).items():
        if not isinstance(data, dict):
            errors.append(f"{epic_id}: Epic data is not a dictionary")
            continue
        for direction in ['upstream', 'downstream']:
            for dep in data.get(direction, []):
                conf = dep.get('confidence', -1)
                if not isinstance(conf, (int, float)) or not (0.0 <= conf <= 1.0):
                    errors.append(f"{epic_id}: Invalid confidence {conf} for dep {dep.get('id')}")

    # Check 5: Referenced Epic IDs exist as physical directories or in CDI
    for epic_id, data in cdi.get('epics', {}).items():
        if not isinstance(data, dict):
            continue
        for dep in data.get('upstream', []):
            ref_id = dep.get('id', '')
            if ref_id and ref_id.startswith('Epic-'):
                if ref_id not in cdi_epics and ref_id not in physical_epics:
                    errors.append(f"{epic_id}: References non-existent {ref_id}")

    # Check 6: Epic count sanity (CDI should cover >=80% of physical epics)
    if physical_epics and len(cdi_epics) < len(physical_epics) * 0.8:
        errors.append(
            f"CDI epic coverage too low: {len(cdi_epics)}/{len(physical_epics)} epics "
            f"({len(cdi_epics)/len(physical_epics)*100:.1f}%)"
        )
        
    # Check 7: Story count sanity (CDI should cover >=80% of physical stories)
    if physical_stories and len(cdi_stories) < len(physical_stories) * 0.8:
        errors.append(
            f"CDI story coverage too low: {len(cdi_stories)}/{len(physical_stories)} stories "
            f"({len(cdi_stories)/len(physical_stories)*100:.1f}%)"
        )

    if errors:
        print("CDI VALIDATION FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    print(f"CDI VALIDATION PASSED: {len(cdi_epics)} epics, {len(cdi_stories)} stories. "
          f"({len(physical_epics)} physical epic dirs, {len(physical_stories)} physical story dirs). All checks green.")
    sys.exit(0)


if __name__ == '__main__':
    main()
