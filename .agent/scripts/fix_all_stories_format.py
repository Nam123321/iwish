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

import os
import glob
import re

epic_dir = "_iwish-output/3. Development/1. Epic & Story/FG-01-Platform-Foundation-Connectors/Epic-01"
story_dirs = glob.glob(os.path.join(epic_dir, "Story-*"))

for s_dir in story_dirs:
    story_file = os.path.join(s_dir, "story.md")
    if not os.path.exists(story_file):
        continue
    
    with open(story_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    changed = False
    
    # 1. Fix Cross-Feature Dependencies header
    new_content = re.sub(r'^## Cross-Feature Dependencies\s*$', '## 🧭 5. Cross-Feature Dependencies', content, flags=re.MULTILINE)
    if new_content != content:
        changed = True
        content = new_content
        
    # 2. Fix Duplicate Traceability Matrix (Remove the bad one)
    # The bad one looks like:
    # ## Traceability Matrix
    # | Acceptance Criteria | Implementation Tasks | Test File Path |
    # | :--- | :--- | :--- |
    # | AC13 | N/A | [MISSING_EVIDENCE] | Yes | [MISSING_TEST] | Yes | N/A |
    
    # We will remove the block starting with "## Traceability Matrix\n| Acceptance Criteria" up to the next "## "
    bad_matrix_pattern = re.compile(r'^## Traceability Matrix\n.*?^(?=## )', re.MULTILINE | re.DOTALL)
    new_content = bad_matrix_pattern.sub('', content)
    
    if new_content != content:
        changed = True
        content = new_content
        
    if changed:
        with open(story_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {story_file}")
