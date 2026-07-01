import os
import re
import yaml
import sys
from datetime import datetime
from collections import defaultdict

def parse_frontmatter(content):
    if not content.startswith('---'):
        return None
    try:
        end = content.find('---', 3)
        if end != -1:
            fm_text = content[3:end]
            return yaml.safe_load(fm_text)
    except Exception:
        pass
    return None

def extract_status_from_content(content):
    match = re.search(r'\*\*Status\*\*:\s*([a-zA-Z-]+)', content)
    if match: return match.group(1).lower()
    if 'status: completed' in content.lower(): return 'completed'
    if 'status: in-progress' in content.lower(): return 'in-progress'
    return 'backlog'

def extract_number(filename):
    match = re.search(r'(\d+(?:\.\d+)?)', filename)
    return float(match.group(1)) if match else 999.0

def process_story_file(story_md_path, story_id):
    if not os.path.exists(story_md_path): return None
    with open(story_md_path, "r", encoding="utf-8") as f:
        content = f.read()
    fm = parse_frontmatter(content)
    
    title = fm.get("title", "") if fm else ""
    if not title:
        match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        title = match.group(1).strip() if match else story_id
        
    status = fm.get("status") if fm else None
    if not status:
        status = extract_status_from_content(content)
        
    return {
        "id": story_id,
        "title": title,
        "status": status.lower()
    }

def process_epic_file(epic_md_path, epic_id, epic_to_fg_map):
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
        
    # Extract Feature Group
    fg = "Uncategorized"
    fg_match = re.search(r'(?:Feature Group|FG):\s*([^\n]+)', content, re.IGNORECASE)
    if fg_match:
        fg = fg_match.group(1).strip()
    else:
        # Fallback to map
        epic_num_str = epic_id.split('-')[-1]
        if epic_num_str.isdigit():
            epic_num = int(epic_num_str)
            if epic_num in epic_to_fg_map:
                fg = epic_to_fg_map[epic_num]
        
    return {
        "id": epic_id,
        "title": title,
        "status": status.lower(),
        "frs": frs,
        "fg": fg
    }

def parse_feature_hierarchy(filepath):
    mapping = {}
    if not os.path.exists(filepath):
        return mapping
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_module = "Uncategorized"
    for line in lines:
        module_match = re.match(r'^###\s+(\d+\.\s+.*?)$', line.strip())
        if module_match:
            current_module = module_match.group(1).strip()
            continue
            
        epic_match = re.search(r'\((?:E|Epic\s*)(\d+)', line, re.IGNORECASE)
        if epic_match:
            epic_num = int(epic_match.group(1))
            mapping[epic_num] = current_module
            
    return mapping

def generate_sprint_status(project_root):
    hierarchical_base = os.path.join(project_root, "_iwish-output", "3. Development", "1. Epic & Story")
    flat_base = os.path.join(project_root, "_iwish-output", "stories")
    
    is_hierarchical = os.path.exists(hierarchical_base)
    base_dir = hierarchical_base if is_hierarchical else flat_base
    output_file = os.path.join(project_root, "_iwish-output", "3. Development", "sprint-status.yaml") if is_hierarchical else os.path.join(project_root, "_iwish-output", "stories", "sprint-status.yaml")
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Parse feature hierarchy for flat layout fallback
    hierarchy_file = os.path.join(project_root, "_iwish-output", "2. Product Planning", "2.5. feature-hierarchy.md")
    epic_to_fg_map = parse_feature_hierarchy(hierarchy_file)
    
    epics_dict = {}

    if os.path.exists(base_dir):
        if is_hierarchical:
            # Hierarchical logic
            for item in os.listdir(base_dir):
                item_path = os.path.join(base_dir, item)
                if not os.path.isdir(item_path):
                    continue
                
                epic_dirs = []
                if item.startswith("FG-"):
                    for epic_item in os.listdir(item_path):
                        epic_path = os.path.join(item_path, epic_item)
                        if os.path.isdir(epic_path) and epic_item.startswith("Epic-"):
                            epic_dirs.append((epic_item, epic_path, item)) # Pass FG folder name
                elif item.startswith("Epic-"):
                    epic_dirs.append((item, item_path, None))
                    
                for epic_item, epic_path, fg_folder in epic_dirs:
                    epic_id = f"epic-{extract_number(epic_item):g}".replace('.0', '')
                    epic_md = os.path.join(epic_path, "epic.md")
                    
                    epic_data = process_epic_file(epic_md, epic_id, epic_to_fg_map)
                    if not epic_data:
                        epic_data = {"id": epic_id, "title": epic_item, "status": "backlog", "fg": fg_folder or "Uncategorized"}
                    elif fg_folder and epic_data["fg"] == "Uncategorized":
                        epic_data["fg"] = fg_folder
                        
                    epic_data["stories"] = []
                    
                    for story_item in os.listdir(epic_path):
                        story_path = os.path.join(epic_path, story_item)
                        if os.path.isdir(story_path) and story_item.startswith("Story-"):
                            story_id = f"story-{story_item.split('-')[-1]}"
                            story_md = os.path.join(story_path, "story.md")
                            story_data = process_story_file(story_md, story_id)
                            if story_data:
                                epic_data["stories"].append(story_data)
                    
                    epic_data["stories"] = sorted(epic_data["stories"], key=lambda x: extract_number(x["id"]))
                    epics_dict[epic_id] = epic_data
        else:
            # Flat layout logic
            for item in os.listdir(base_dir):
                item_path = os.path.join(base_dir, item)
                if os.path.isdir(item_path):
                    if item.startswith("Epic-"):
                        epic_id = f"epic-{extract_number(item):g}".replace('.0', '')
                        epic_md = os.path.join(item_path, "epic.md")
                        epic_data = process_epic_file(epic_md, epic_id, epic_to_fg_map)
                        if not epic_data: epic_data = {"id": epic_id, "title": item, "status": "backlog", "fg": "Uncategorized"}
                        if epic_id not in epics_dict:
                            epics_dict[epic_id] = epic_data
                            epics_dict[epic_id]["stories"] = []
                        else:
                            epics_dict[epic_id].update(epic_data)
                            if "stories" not in epics_dict[epic_id]: epics_dict[epic_id]["stories"] = []
                elif item.endswith(".md"):
                    if item.lower().startswith("epic-"):
                        epic_id = f"epic-{extract_number(item):g}".replace('.0', '')
                        epic_data = process_epic_file(item_path, epic_id, epic_to_fg_map)
                        if not epic_data: epic_data = {"id": epic_id, "title": item, "status": "backlog", "fg": "Uncategorized"}
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
                                fg = "Uncategorized"
                                if epic_num.isdigit() and int(epic_num) in epic_to_fg_map:
                                    fg = epic_to_fg_map[int(epic_num)]
                                epics_dict[epic_id] = {"id": epic_id, "title": f"Epic {epic_num}", "status": "backlog", "stories": [], "fg": fg}
                            if "stories" not in epics_dict[epic_id]:
                                epics_dict[epic_id]["stories"] = []
                            epics_dict[epic_id]["stories"].append(story_data)

    # Group by Feature Group
    fg_groups = defaultdict(list)
    for eid, epic in epics_dict.items():
        fg_groups[epic.get("fg", "Uncategorized")].append(epic)

    output_lines = []
    output_lines.append(f"sprint_name: Active Sprint")
    output_lines.append(f"status: active")
    output_lines.append(f"start_date: '{datetime.now().strftime('%Y-%m-%d')}'")
    output_lines.append("")

    # Sort Feature Groups alphabetically, but keep Uncategorized at the end
    sorted_fgs = sorted([fg for fg in fg_groups.keys() if fg != "Uncategorized"])
    if "Uncategorized" in fg_groups:
        sorted_fgs.append("Uncategorized")

    for fg in sorted_fgs:
        epics = fg_groups[fg]
        # Sort epics within FG
        epics = sorted(epics, key=lambda x: extract_number(x["id"]))
        
        output_lines.append(f"# {'=' * 50}")
        output_lines.append(f"# Feature Group: {fg}")
        output_lines.append(f"# {'=' * 50}")
        output_lines.append("")
        
        for epic in epics:
            epic_num = extract_number(epic["id"])
            if isinstance(epic_num, float) and epic_num.is_integer():
                epic_num = int(epic_num)
            
            output_lines.append(f"# Epic {epic_num}: {epic['title']}")
            
            # Print FRs only if it's available
            if "frs" in epic and epic["frs"] != "N/A":
                output_lines.append(f"# FRs: {epic['frs']}")
            
            output_lines.append(f"{epic['id']}: {epic['status']}")
            
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
            
        output_lines.append("")

    with open(output_file, "w", encoding="utf-8") as f:
        # Avoid multiple consecutive empty lines
        clean_lines = "\n".join(output_lines)
        clean_lines = re.sub(r'\n{3,}', '\n\n', clean_lines)
        f.write(clean_lines)
        
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    generate_sprint_status(project_root)
