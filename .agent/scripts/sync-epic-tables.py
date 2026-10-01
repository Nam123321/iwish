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
import sys

def process_epic_md(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    parts = re.split(r'^##\s+Stories\s*$', content, flags=re.MULTILINE)
    if len(parts) < 2:
        return False
        
    header = parts[0].rstrip() + "\n\n## Stories\n"
    
    table_lines = []
    other_lines = []
    
    in_table = False
    lines = parts[1].strip().split('\n')
    for line in lines:
        if line.strip().startswith('|'):
            in_table = True
            table_lines.append(line.strip())
        elif in_table and not line.strip():
            in_table = False
            other_lines.append(line)
        else:
            if not in_table:
                other_lines.append(line)
            else:
                in_table = False
                other_lines.append(line)
                
    if not table_lines:
        return False
        
    parsed_rows = []
    for i, line in enumerate(table_lines):
        if i == 0 or i == 1:
            continue
            
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if len(cells) >= 2:
            story_id = cells[0].replace('**', '')
            match = re.search(r'(\d+\.\d+[a-zA-Z]?)', story_id)
            if match:
                story_id_clean = f"[Story-{match.group(1)}](./Story-{match.group(1)}/story.md)"
            else:
                story_id_clean = f"**{story_id}**"
                
            title = cells[1]
            deps = cells[2] if len(cells) > 2 else ""
            status = cells[3] if len(cells) > 3 else "backlog"
            
            status = status.lower()
            if status == "done":
                status = "completed"
                
            parsed_rows.append(f"| {story_id_clean} | {title} | {deps} | {status} |")
            
    new_table = [
        "| Story ID | Title | Dependencies | Status |",
        "|---|---|---|---|"
    ]
    new_table.extend(parsed_rows)
    
    new_content = header + "\n".join(new_table)
    if other_lines:
        new_content += "\n\n" + "\n".join(other_lines)
        
    new_content += "\n"
    
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False

def main():
    base_dir = "_iwish-output/3. Development/1. Epic & Story"
    if not os.path.exists(base_dir):
        return
        
    count = 0
    for root, dirs, files in os.walk(base_dir):
        if "epic.md" in files:
            file_path = os.path.join(root, "epic.md")
            if process_epic_md(file_path):
                count += 1
                
    print(f"Total updated: {count}")
    
if __name__ == "__main__":
    main()
