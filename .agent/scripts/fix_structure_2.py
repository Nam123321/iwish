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
planning_file = "_iwish-output/2. Product Planning/2.4. epics-and-stories.md"

def update_planning_file(old_path, new_path):
    if not os.path.exists(planning_file): return
    with open(planning_file, 'r', encoding='utf-8') as f:
        content = f.read()
    # Replace exact substring (url encoded spaces handled loosely or we just replace the FG string)
    old_fg = old_path.split('/')[-2] if '/' in old_path else old_path
    new_fg = new_path.split('/')[-2] if '/' in new_path else new_path
    if old_fg and new_fg and old_fg != new_fg:
        content = content.replace(old_fg, new_fg)
    with open(planning_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("1. Moving Epic-30 to FG-01. Platform Foundation & Connectors...")
src_30 = os.path.join(base_dir, "Epic-30")
dst_30 = os.path.join(base_dir, "FG-01. Platform Foundation & Connectors", "Epic-30")
if os.path.exists(src_30):
    shutil.move(src_30, dst_30)
    print(f"Moved Epic-30 to FG-01")

print("\n2. Fixing FG-06 duplicates...")
src_fg06_chat = os.path.join(base_dir, "FG-06. Communication & Chat")
dst_fg09_chat = os.path.join(base_dir, "FG-09. Communication & Chat")
if os.path.exists(src_fg06_chat):
    shutil.move(src_fg06_chat, dst_fg09_chat)
    print("Renamed FG-06. Communication & Chat to FG-09")
    update_planning_file("FG-06. Communication & Chat", "FG-09. Communication & Chat")

print("\n3. Fixing NEW-* story names...")
for root, dirs, files in os.walk(base_dir):
    if not root.endswith("1. Epic & Story") and "Epic-" in os.path.basename(root):
        epic_id = root.split("Epic-")[-1]
        
        # Find all stories in this epic
        stories = [d for d in dirs if d.startswith("Story-")]
        max_id = 0
        new_stories = []
        for s in stories:
            if "NEW-" in s.upper():
                new_stories.append(s)
            else:
                match = re.search(r'Story-\d+\.(\d+)', s)
                if match:
                    max_id = max(max_id, int(match.group(1)))
        
        if new_stories:
            print(f"Found NEW stories in Epic-{epic_id}: {new_stories}")
            # Map old to new names
            renames = {}
            for i, ns in enumerate(sorted(new_stories, key=lambda x: int(re.search(r'NEW-(\d+)', x.upper()).group(1)))):
                max_id += 1
                new_name = f"Story-{epic_id}.{max_id}"
                renames[ns] = new_name
                
                old_path = os.path.join(root, ns)
                new_path = os.path.join(root, new_name)
                
                # Move folder
                shutil.move(old_path, new_path)
                
                # Update frontmatter in the moved story
                story_md = os.path.join(new_path, "story.md")
                if os.path.exists(story_md):
                    with open(story_md, "r", encoding="utf-8") as f:
                        s_content = f.read()
                    
                    # Replace IDs in content
                    s_content = s_content.replace(ns, new_name)
                    s_content = s_content.replace(ns.lower(), new_name.lower())
                    
                    with open(story_md, "w", encoding="utf-8") as f:
                        f.write(s_content)
                print(f"Renamed {ns} -> {new_name}")
            
            # Update epic.md table
            epic_md = os.path.join(root, "epic.md")
            if os.path.exists(epic_md):
                with open(epic_md, "r", encoding="utf-8") as f:
                    e_content = f.read()
                
                for old_s, new_s in renames.items():
                    # Replace in table (case insensitive replacement if needed)
                    e_content = re.sub(re.escape(old_s), new_s, e_content, flags=re.IGNORECASE)
                    
                with open(epic_md, "w", encoding="utf-8") as f:
                    f.write(e_content)

print("\n4. Fixing blank titles and missing frontmatter for Epics 50, 16, 10...")
# Similar to fix_structure.py but run for all epics to ensure all blank titles are caught.
for root, dirs, files in os.walk(base_dir):
    if "epic.md" in files:
        epic_path = os.path.join(root, "epic.md")
        epic_id_match = re.search(r'Epic-(\d+)', root)
        if not epic_id_match: continue
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
                                stub_content = f"---\ntype: I-Wish Story\ntitle: \"{story_id_raw}: {title}\"\ndescription: \"Chi tiết xem tại PRD\"\nresource: \"{story_id_raw}\"\ntags:\n  - story\nstatus: {status}\nlinks_to:\n  - Epic-{epic_id}\ndependencies: []\n---\n\n# {story_id_raw}: {title}\n\n**Epic:** Epic {epic_id}\n\n> **[LƯU Ý]** File này được tự động tạo từ script fix_structure_2.py dựa trên table ở epic.md.\n"
                                with open(story_md, "w", encoding="utf-8") as f:
                                    f.write(stub_content)
                                print(f"Created missing physical story: {story_id_raw} in Epic-{epic_id}")
                                
                            # If physical exists but title is empty in the table OR frontmatter is missing
                            else:
                                with open(story_md, 'r', encoding='utf-8') as sf:
                                    sm_content = sf.read()
                                
                                # Check if frontmatter exists
                                if not sm_content.startswith('---'):
                                    # Extract title from markdown
                                    h_match = re.search(r'^#\s*Story\s+[\d\.]+[a-zA-Z]*:\s*(.+)$', sm_content, re.MULTILINE)
                                    story_title = h_match.group(1).strip() if h_match else title
                                    fm = f"---\ntype: I-Wish Story\ntitle: \"{story_id_raw}: {story_title}\"\nresource: \"{story_id_raw}\"\ntags:\n  - story\nstatus: {status}\nlinks_to:\n  - Epic-{epic_id}\ndependencies: []\n---\n\n"
                                    with open(story_md, 'w', encoding='utf-8') as sf:
                                        sf.write(fm + sm_content)
                                    print(f"Added frontmatter to {story_id_raw}")
                                
                                # Fix blank title in table
                                if not title:
                                    # re-read after adding frontmatter if we did
                                    with open(story_md, 'r', encoding='utf-8') as sf:
                                        sm_content = sf.read()
                                    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', sm_content, re.DOTALL)
                                    if match:
                                        try:
                                            fm = yaml.safe_load(match.group(1))
                                            story_title = fm.get('title', '')
                                            if story_title:
                                                story_title = re.sub(r'^Story-[\d\.]+[a-zA-Z]?:\s*', '', story_title)
                                                lines[i] = f"| **{story_id_raw}** | {story_title} | {deps} | {status} |"
                                                updated_lines = True
                                                print(f"Fixed blank title for {story_id_raw} in Epic-{epic_id}: {story_title}")
                                        except Exception:
                                            pass
                                            
            if updated_lines:
                new_part2 = '\n'.join(lines)
                new_content = parts[0] + "## Stories\n" + new_part2
                with open(epic_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Saved updated table for Epic-{epic_id}")

