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
import shutil
import yaml

base_dir = "_iwish-output/3. Development/1. Epic & Story"

print("1. Fixing Epic-55 mismatch...")
src_55 = os.path.join(base_dir, "FG-03. Infrastructure & Core Services", "Epic-55")
dst_55 = os.path.join(base_dir, "FG-04. AI Agent & Skills", "Epic-55")
if os.path.exists(src_55) and os.path.exists(dst_55):
    for item in os.listdir(src_55):
        if item.startswith("Story-"):
            shutil.move(os.path.join(src_55, item), os.path.join(dst_55, item))
            print(f"Moved {item} to {dst_55}")
    shutil.rmtree(src_55)
    print(f"Deleted empty {src_55}")

print("\n2. Fixing missing YAML frontmatter for Epic-50 and Epic-51...")
def fix_epic_frontmatter(epic_id, title):
    for root, dirs, files in os.walk(base_dir):
        if f"Epic-{epic_id}" in root and "epic.md" in files:
            path = os.path.join(root, "epic.md")
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if not content.startswith("---"):
                fm = f"---\ntype: I-Wish Epic\ntitle: \"Epic-{epic_id}: {title}\"\nresource: \"Epic-{epic_id}\"\nstatus: backlog\n---\n\n"
                with open(path, "w", encoding="utf-8") as f:
                    f.write(fm + content)
                print(f"Added frontmatter to Epic-{epic_id}")

fix_epic_frontmatter(51, "WorkTeam Harness Agent Core")
fix_epic_frontmatter(50, "Task Node Catalog & Workflow Primitives")

print("\n3. Generating missing physical stories and fixing blank titles in epic.md tables...")
for root, dirs, files in os.walk(base_dir):
    if "epic.md" in files:
        epic_path = os.path.join(root, "epic.md")
        epic_id_match = re.search(r'Epic-(\d+)', root)
        if not epic_id_match:
            continue
        epic_id = epic_id_match.group(1)
        
        with open(epic_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        parts = re.split(r'^##\s+Stories\s*$', content, flags=re.MULTILINE)
        if len(parts) >= 2:
            lines = parts[1].split('\n')
            updated_lines = False
            for i, line in enumerate(lines):
                if line.strip().startswith('|') and not line.strip().startswith('|---') and not line.strip().startswith('| Story ID'):
                    cells = [c.strip() for c in line.split('|')[1:-1]]
                    if len(cells) >= 2:
                        story_id_raw = cells[0].replace('*', '').strip()
                        title = cells[1].strip()
                        deps = cells[2].strip() if len(cells) > 2 else "None"
                        status = cells[3].strip() if len(cells) > 3 else "backlog"
                        
                        if story_id_raw.startswith("Story-"):
                            story_dir = os.path.join(root, story_id_raw)
                            story_md = os.path.join(story_dir, "story.md")
                            
                            # If physical doesn't exist, create it!
                            if not os.path.exists(story_dir):
                                os.makedirs(story_dir)
                                stub_content = f"""---
type: I-Wish Story
title: "{story_id_raw}: {title}"
description: "Chi tiết xem tại PRD"
resource: "{story_id_raw}"
tags:
  - story
status: {status}
links_to: 
  - Epic-{epic_id}
dependencies: []
---

# {story_id_raw}: {title}

**Epic:** Epic {epic_id}

> **[LƯU Ý]** File này được tự động tạo từ script fix_structure.py dựa trên table ở epic.md.
"""
                                with open(story_md, "w", encoding="utf-8") as f:
                                    f.write(stub_content)
                                print(f"Created missing physical story: {story_id_raw} in Epic-{epic_id}")
                                
                            # If physical exists but title is empty in the table (like Epic 51)
                            elif not title:
                                with open(story_md, 'r', encoding='utf-8') as sf:
                                    sm_content = sf.read()
                                match = re.match(r'^---\s*\n(.*?)\n---\s*\n', sm_content, re.DOTALL)
                                if match:
                                    try:
                                        fm = yaml.safe_load(match.group(1))
                                        story_title = fm.get('title', '')
                                        if story_title:
                                            # Clean up title
                                            story_title = re.sub(r'^Story-[\d\.]+[a-zA-Z]?:\s*', '', story_title)
                                            # Update the line in the epic.md table!
                                            lines[i] = f"| **{story_id_raw}** | {story_title} | {deps} | {status} |"
                                            updated_lines = True
                                            print(f"Fixed blank title for {story_id_raw} in Epic-{epic_id}: {story_title}")
                                    except yaml.YAMLError:
                                        pass
                                        
            if updated_lines:
                new_part2 = '\n'.join(lines)
                new_content = parts[0] + "## Stories\n" + new_part2
                with open(epic_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Saved updated table for Epic-{epic_id}")
