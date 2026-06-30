import os
import re
import yaml
from datetime import datetime
import sys

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
        st = re.sub(r'[^a-z0-9\-_]', '', st)
        if st.startswith("ready-for-dev"): return "ready-for-dev"
        return st
    # 2. Look for Status: <status>
    match = re.search(r'^Status:\s*(.+?)(?:\n|$)', content, re.MULTILINE | re.IGNORECASE)
    if match:
        st = match.group(1).strip().lower()
        st = re.sub(r'[^a-z0-9\-_]', '', st)
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

def process_story_file(story_md_path, story_id):
    if not os.path.exists(story_md_path): return None
    with open(story_md_path, "r", encoding="utf-8") as f:
        content = f.read()
    fm = parse_frontmatter(content)
    
    title = fm.get("title", "") if fm else ""
    if not title:
        title = f"Story {story_id.split('-')[-1]}"
        
    status = fm.get("status") if fm else None
    if not status:
        status = extract_status_from_content(content)
        
    return {
        "id": story_id,
        "title": title,
        "status": status.lower()
    }

def process_epic_file(epic_md_path, epic_id):
    if not os.path.exists(epic_md_path): return None
    with open(epic_md_path, "r", encoding="utf-8") as f:
        content = f.read()
    fm = parse_frontmatter(content)
    
    title = fm.get("title", "") if fm else ""
    if not title:
        title = f"Epic {epic_id.split('-')[-1]}"
        
    status = fm.get("status") if fm else None
    if not status:
        status = extract_status_from_content(content)
        
    # Extract FRs
    frs = "N/A"
    fr_match = re.search(r'(?:FRs|FR Covered):\s*([^\n]+)', content, re.IGNORECASE)
    if fr_match:
        frs = fr_match.group(1).strip()
        
    return {
        "id": epic_id,
        "title": title,
        "status": status.lower(),
        "frs": frs
    }

def generate_sprint_status(project_root):
    # Detect layout
    hierarchical_base = os.path.join(project_root, "_iwish-output", "3. Development", "1. Epic & Story")
    flat_base = os.path.join(project_root, "_iwish-output", "stories")
    
    is_hierarchical = os.path.exists(hierarchical_base)
    base_dir = hierarchical_base if is_hierarchical else flat_base
    output_file = os.path.join(project_root, "_iwish-output", "3. Development", "sprint-status.yaml") if is_hierarchical else os.path.join(project_root, "_iwish-output", "stories", "sprint-status.yaml")
    
    # Create dir if not exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    epics_dict = {}

    if os.path.exists(base_dir):
        if is_hierarchical:
            # Hierarchical logic
            for item in os.listdir(base_dir):
                item_path = os.path.join(base_dir, item)
                if not os.path.isdir(item_path):
                    continue
                
                # Check if it's a Feature Group folder or direct Epic folder
                epic_dirs = []
                if item.startswith("FG-"):
                    for epic_item in os.listdir(item_path):
                        epic_path = os.path.join(item_path, epic_item)
                        if os.path.isdir(epic_path) and epic_item.startswith("Epic-"):
                            epic_dirs.append((epic_item, epic_path))
                elif item.startswith("Epic-"):
                    epic_dirs.append((item, item_path))
                    
                for epic_item, epic_path in epic_dirs:
                    epic_id = f"epic-{extract_number(epic_item):g}".replace('.0', '')
                    epic_md = os.path.join(epic_path, "epic.md")
                    
                    epic_data = process_epic_file(epic_md, epic_id)
                    if not epic_data:
                        epic_data = {"id": epic_id, "title": epic_item, "status": "backlog"}
                    epic_data["stories"] = []
                    
                    # Find stories
                    for story_item in os.listdir(epic_path):
                        story_path = os.path.join(epic_path, story_item)
                        if os.path.isdir(story_path) and story_item.startswith("Story-"):
                            story_id = f"story-{story_item.split('-')[-1]}"
                            story_md = os.path.join(story_path, "story.md")
                            story_data = process_story_file(story_md, story_id)
                            if story_data:
                                epic_data["stories"].append(story_data)
                    
                    # Sort stories
                    epic_data["stories"] = sorted(epic_data["stories"], key=lambda x: extract_number(x["id"]))
                    epics_dict[epic_id] = epic_data
        else:
            # Flat layout logic
            for item in os.listdir(base_dir):
                item_path = os.path.join(base_dir, item)
                if os.path.isdir(item_path):
                    # In Flat, sometimes there are folders like Epic-17
                    if item.startswith("Epic-"):
                        epic_id = f"epic-{extract_number(item):g}".replace('.0', '')
                        epic_md = os.path.join(item_path, "epic.md")
                        epic_data = process_epic_file(epic_md, epic_id)
                        if not epic_data: epic_data = {"id": epic_id, "title": item, "status": "backlog"}
                        if epic_id not in epics_dict:
                            epics_dict[epic_id] = epic_data
                            epics_dict[epic_id]["stories"] = []
                        else:
                            epics_dict[epic_id].update(epic_data)
                            if "stories" not in epics_dict[epic_id]: epics_dict[epic_id]["stories"] = []
                elif item.endswith(".md"):
                    if item.lower().startswith("epic-"):
                        epic_id = f"epic-{extract_number(item):g}".replace('.0', '')
                        epic_data = process_epic_file(item_path, epic_id)
                        if not epic_data: epic_data = {"id": epic_id, "title": item, "status": "backlog"}
                        if epic_id not in epics_dict:
                            epics_dict[epic_id] = epic_data
                            epics_dict[epic_id]["stories"] = []
                        else:
                            epics_dict[epic_id].update(epic_data)
                            if "stories" not in epics_dict[epic_id]: epics_dict[epic_id]["stories"] = []
                    elif item.lower().startswith("story-"):
                        story_id = f"story-{extract_number(item)}"
                        epic_num = story_id.split('-')[-1].split('.')[0]
                        epic_id = f"epic-{epic_num}"
                        story_data = process_story_file(item_path, story_id)
                        if story_data:
                            if epic_id not in epics_dict:
                                epics_dict[epic_id] = {"id": epic_id, "title": f"Epic {epic_num}", "status": "backlog", "stories": []}
                            if "stories" not in epics_dict[epic_id]:
                                epics_dict[epic_id]["stories"] = []
                            epics_dict[epic_id]["stories"].append(story_data)

    output_lines = []
    output_lines.append(f"sprint_name: Active Sprint")
    output_lines.append(f"status: active")
    output_lines.append(f"start_date: '{datetime.now().strftime('%Y-%m-%d')}'")
    output_lines.append("")

    # Sort epics
    sorted_epic_ids = sorted(epics_dict.keys(), key=lambda x: extract_number(x))
    for eid in sorted_epic_ids:
        epic = epics_dict[eid]
        
        output_lines.append("# ==========================================")
        epic_num = extract_number(eid)
        if isinstance(epic_num, float) and epic_num.is_integer():
            epic_num = int(epic_num)
        output_lines.append(f"# Epic {epic_num}: {epic['title']}")
        frs = epic.get("frs", "N/A")
        output_lines.append(f"# FRs: {frs}")
        output_lines.append("# ==========================================")
        
        output_lines.append(f"{eid}: {epic['status']}")
        
        if "stories" in epic:
            epic["stories"] = sorted(epic["stories"], key=lambda x: extract_number(x["id"]))
            for story in epic["stories"]:
                story_id = story["id"]
                title = story["title"]
                status = story["status"]
                
                story_num_str = story_id.replace('story-', '').replace('.', '-')
                kebab_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title)
                kebab_title = re.sub(r'\s+', '-', kebab_title).strip('-').lower()
                
                key = f"{story_num_str}-{kebab_title}"
                output_lines.append(f"{key}: {status}")
        
        output_lines.append("")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
        
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    generate_sprint_status(project_root)
