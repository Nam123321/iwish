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
import re
import yaml

sprint_status_path = '_iwish-output/3. Development/sprint-status.yaml'
epics_dir = '_iwish-output/3. Development/1. Epic & Story'

# Build a map of actual story_id and its correct status from the physical directories
true_statuses = {}

for root, dirs, files in os.walk(epics_dir):
    for dir_name in dirs:
        if dir_name.startswith('Story-'):
            match = re.match(r'Story-(\d+)\.(\d+)', dir_name)
            if match:
                epic_num = match.group(1)
                story_num = match.group(2)
                story_file = os.path.join(root, dir_name, 'story.md')
                
                if os.path.exists(story_file):
                    with open(story_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # 1. Try to extract status from frontmatter
                        status_match = re.search(r'^status:\s*"?([^\n"]+)"?', content, re.MULTILINE)
                        status = None
                        if status_match:
                            status = status_match.group(1).strip().lower()
                        else:
                            # 2. Fallback to **Status:** in the markdown body
                            body_status_match = re.search(r'\*\*Status:\*\*\s*(.+)', content)
                            if body_status_match:
                                status = body_status_match.group(1).strip().lower()
                        
                        if status:
                            # normalize status strings
                            if status == 'ready_for_dev': status = 'ready_for_dev'
                            elif 'completed' in status or 'done' in status: status = 'completed'
                            elif 'cancel' in status: status = 'cancelled'
                            
                            true_statuses[(epic_num, story_num)] = status

# Now read the sprint-status.yaml and update the status
with open(sprint_status_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    match = re.search(r'^(\s*story-(\d+)-(\d+)[^:]*:)\s*(.*)$', line)
    if match:
        prefix = match.group(1)
        epic_num = match.group(2)
        story_num = match.group(3)
        old_status = match.group(4)
        
        if (epic_num, story_num) in true_statuses:
            new_status = true_statuses[(epic_num, story_num)]
            new_lines.append(f"{prefix} {new_status}\n")
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(sprint_status_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated sprint-status.yaml with true statuses successfully!")
