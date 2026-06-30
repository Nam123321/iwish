import os
import re
import yaml
from datetime import datetime

BASE_DIR = "_iwish-output/3. Development/1. Epic & Story"
OUTPUT_FILE = "_iwish-output/3. Development/sprint-status.yaml"

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_frontmatter(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.startswith('---\n'):
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    return yaml.safe_load(parts[1])
    except Exception:
        pass
    return {}

def extract_number(name):
    match = re.search(r'(\d+(?:\.\d+[a-z]*)?)', name)
    if match:
        val = match.group(1)
        num_part = re.search(r'(\d+(?:\.\d+)?)', val).group(1)
        return float(num_part)
    return 99999.0

fg_map = {}
if os.path.exists(BASE_DIR):
    for item in os.listdir(BASE_DIR):
        item_path = os.path.join(BASE_DIR, item)
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
output.append("project: Cowok.ai")
output.append("project_key: CWK")
output.append("tracking_system: file-system")
output.append(f"story_location: {BASE_DIR}")
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
        
        fm = parse_frontmatter(epic_md)
        if fm:
            title = fm.get("title", "")
            if title:
                # Remove common prefixes like 'Epic 01:', 'Epic-01:'
                clean_title = re.sub(r'(?i)^epic[- ]?\d+[^a-z0-9]*', '', title)
                epic_slug = f"{epic_name.lower()}-{slugify(clean_title)}"
            status = fm.get("status", "backlog")
        
        output.append(f"  {epic_slug}: {status}")
        
        sorted_stories = sorted(epic_data["stories"], key=lambda x: extract_number(os.path.basename(x)))
        for story_path in sorted_stories:
            story_md = os.path.join(story_path, "story.md")
            fm = parse_frontmatter(story_md)
            if not fm: continue
            
            story_name = os.path.basename(story_path).lower()
            title = fm.get("title", "")
            story_slug = story_name
            if title:
                # Remove common prefixes like 'Story 01.1:', 'Story-01.1:'
                clean_title = re.sub(r'(?i)^story[- ]?\d+\.\d+[a-z]*[^a-z0-9]*', '', title)
                story_slug = f"{story_name}-{slugify(clean_title)}"
            
            status = fm.get("status", "backlog")
            story_slug = story_slug.replace('.', '-')
            output.append(f"  {story_slug}: {status}")
            
        output.append("")

# Maintain phase-0 stories if they don't exist as physical files but were manually added
phase_0_str = """  # ═══════════════════════════════════════════════════════════════
  # Phase 0: Source-of-Truth Normalization
  # ═══════════════════════════════════════════════════════════════
  phase-0-roadmap-source-of-truth-normalization: completed
  phase-0-retrospective: completed
"""
output.insert(7, phase_0_str)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(output))

