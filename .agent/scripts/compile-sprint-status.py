import os
import re
import yaml
from datetime import datetime
import sys

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_frontmatter(content):
    try:
        if content.startswith('---\n'):
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                return yaml.safe_load(parts[1])
    except Exception:
        pass
    return {}

def extract_status_from_content(content):
    # 1. Look for **Status:** <status>
    match = re.search(r'\*\*Status:\*\*\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
    if match:
        st = match.group(1).strip().lower()
        if st.startswith("ready-for-dev"): return "ready-for-dev"
        return st
    # 2. Look for Status: <status>
    match = re.search(r'^Status:\s*(.+?)(?:\n|$)', content, re.MULTILINE | re.IGNORECASE)
    if match:
        st = match.group(1).strip().lower()
        if st.startswith("ready-for-dev"): return "ready-for-dev"
        return st
    return "backlog"

def extract_number(name):
    match = re.search(r'(\d+(?:\.\d+[a-z]*)?)', name)
    if match:
        val = match.group(1)
        num_part = re.search(r'(\d+(?:\.\d+)?)', val).group(1)
        return float(num_part)
    return 99999.0

def generate_sprint_status(base_dir, output_file):
    fg_map = {}
    if os.path.exists(base_dir):
        for item in os.listdir(base_dir):
            item_path = os.path.join(base_dir, item)
            if not os.path.isdir(item_path):
                continue
                
            fg_name = ""
            if item.startswith("FG-"):
                fg_name = item
                for epic_item in os.listdir(item_path):
                    epic_path = os.path.join(item_path, epic_item)
                    if os.path.isdir(epic_path) and epic_item.startswith("Epic-"):
                        if fg_name not in fg_map: fg_map[fg_name] = {}
                        fg_map[fg_name][epic_item] = {"path": epic_path, "stories": []}
                        
                        for story_item in os.listdir(epic_path):
                            story_path = os.path.join(epic_path, story_item)
                            if os.path.isdir(story_path) and story_item.startswith("Story-"):
                                fg_map[fg_name][epic_item]["stories"].append(story_path)
            elif item.startswith("Epic-"):
                fg_name = "Uncategorized"
                if fg_name not in fg_map: fg_map[fg_name] = {}
                fg_map[fg_name][item] = {"path": item_path, "stories": []}
                for story_item in os.listdir(item_path):
                    story_path = os.path.join(item_path, story_item)
                    if os.path.isdir(story_path) and story_item.startswith("Story-"):
                        fg_map[fg_name][item]["stories"].append(story_path)

    output = []
    now_str = datetime.now().strftime("%d-%m-%Y %H:%M")
    output.append(f"generated: {now_str}")
    output.append("tracking_system: file-system")
    output.append(f"story_location: {base_dir}")
    output.append("")
    output.append("development_status:")

    sorted_fgs = sorted(fg_map.keys())
    for fg in sorted_fgs:
        output.append("  # ═══════════════════════════════════════════════════════════════")
        output.append(f"  # {fg}")
        output.append("  # ═══════════════════════════════════════════════════════════════")
        
        epics = fg_map[fg]
        sorted_epics = sorted(epics.keys(), key=extract_number)
        
        for epic_name in sorted_epics:
            epic_data = epics[epic_name]
            epic_md = os.path.join(epic_data["path"], "epic.md")
            
            epic_slug = epic_name.lower()
            status = "backlog"
            
            if os.path.exists(epic_md):
                with open(epic_md, "r", encoding="utf-8") as f:
                    content = f.read()
                    fm = parse_frontmatter(content)
                    
                    title = fm.get("title", "")
                    if title:
                        clean_title = re.sub(r'(?i)^epic[- ]?\d+[^a-z0-9]*', '', title)
                        epic_slug = f"{epic_name.lower()}-{slugify(clean_title)}"
                    
                    status = fm.get("status")
                    if not status:
                        status = extract_status_from_content(content)
            
            output.append(f"  {epic_slug}: {status.lower()}")
            
            sorted_stories = sorted(epic_data["stories"], key=lambda x: extract_number(os.path.basename(x)))
            for story_path in sorted_stories:
                story_md = os.path.join(story_path, "story.md")
                if not os.path.exists(story_md): continue
                
                with open(story_md, "r", encoding="utf-8") as f:
                    content = f.read()
                    fm = parse_frontmatter(content)
                
                story_name = os.path.basename(story_path).lower()
                title = fm.get("title", "") if fm else ""
                story_slug = story_name
                if title:
                    clean_title = re.sub(r'(?i)^story[- ]?\d+\.\d+[a-z]*[^a-z0-9]*', '', title)
                    story_slug = f"{story_name}-{slugify(clean_title)}"
                
                status = fm.get("status") if fm else None
                if not status:
                    status = extract_status_from_content(content)
                
                story_slug = story_slug.replace('.', '-')
                output.append(f"  {story_slug}: {status.lower()}")
                
            output.append("")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "_iwish-output/3. Development/1. Epic & Story"
    out = sys.argv[2] if len(sys.argv) > 2 else "_iwish-output/3. Development/sprint-status.yaml"
    generate_sprint_status(base, out)
