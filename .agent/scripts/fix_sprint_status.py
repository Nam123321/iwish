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

# Build a map of actual story_id and its correct name from the physical directories
# Story ID format is typically `story-XX-Y-something`. 
# We'll map `(XX, Y)` to the correct `story-XX-Y-something`
correct_names = {}

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
                        
                        # Try to extract story_id from frontmatter
                        story_id_match = re.search(r'^story_id:\s*"?([^\n"]+)"?', content, re.MULTILINE)
                        if story_id_match and story_id_match.group(1).startswith('story-'):
                            correct_names[(epic_num, story_num)] = story_id_match.group(1)
                        else:
                            # Try to extract title and slugify it
                            title_match = re.search(r'^title:\s*"?Story-\d+\.\d+:\s*([^"\n]+)', content, re.MULTILINE)
                            if title_match:
                                title = title_match.group(1)
                                # Slugify title
                                slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
                                correct_names[(epic_num, story_num)] = f"story-{epic_num}-{story_num}-{slug}"

# Now read the sprint-status.yaml and replace any story line with its correct name
with open(sprint_status_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    match = re.search(r'^\s*story-(\d+)-(\d+)[^:]*:(.*)$', line)
    if match:
        epic_num = match.group(1)
        story_num = match.group(2)
        status_part = match.group(3)
        
        if (epic_num, story_num) in correct_names:
            correct_name = correct_names[(epic_num, story_num)]
            # Preserve the leading whitespace
            indent = line[:line.find('story-')]
            new_lines.append(f"{indent}{correct_name}:{status_part}\n")
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(sprint_status_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated sprint-status.yaml successfully!")
