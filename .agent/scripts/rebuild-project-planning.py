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
from datetime import datetime

BASE_DIR = "_iwish-output/3. Development/1. Epic & Story"
OUTPUT_FILE = "_iwish-output/2. Product Planning/2.4. epics-and-stories.md"

def extract_number(name):
    match = re.search(r'(\d+(?:\.\d+[a-z]*)?)', name)
    if match:
        val = match.group(1)
        num_part = re.search(r'(\d+(?:\.\d+)?)', val).group(1)
        return float(num_part)
    return 99999.0

def parse_frontmatter(filepath):
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.startswith('---\n'):
                    parts = content.split('---\n', 2)
                    if len(parts) >= 3:
                        return yaml.safe_load(parts[1])
    except Exception:
        pass
    return {}

fg_map = {}
if os.path.exists(BASE_DIR):
    for item in os.listdir(BASE_DIR):
        item_path = os.path.join(BASE_DIR, item)
        if not os.path.isdir(item_path): continue
            
        fg_name = item if item.startswith("FG-") else "Uncategorized"
        if fg_name not in fg_map: fg_map[fg_name] = {}
        
        target_dir = item_path if item.startswith("FG-") else BASE_DIR
        epics_to_process = os.listdir(target_dir) if item.startswith("FG-") else [item]
        
        for epic_item in epics_to_process:
            epic_path = os.path.join(target_dir, epic_item)
            if os.path.isdir(epic_path) and epic_item.startswith("Epic-"):
                fg_map[fg_name][epic_item] = {"path": epic_path, "stories": []}
                for story_item in os.listdir(epic_path):
                    story_path = os.path.join(epic_path, story_item)
                    if os.path.isdir(story_path) and story_item.startswith("Story-"):
                        fg_map[fg_name][epic_item]["stories"].append(story_path)

output = []
output.append("""---
type: I-Wish Epic Breakdown
title: "Epics & Stories: Cowok.ai Product Planning Roadmap"
description: "Tài liệu này kế thừa và liên kết trực tiếp tới các tài liệu nghiệp vụ ở các giai đoạn trước:"
resource: file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.4.%20epics-and-stories.md
tags: []
timestamp: """ + datetime.now().isoformat() + """
links_to: []
---

# Epics & Stories: Cowok.ai Product Planning Roadmap

## 0. Upstream References
Tài liệu này kế thừa và liên kết trực tiếp tới các tài liệu nghiệp vụ ở các giai đoạn trước:
- **PRD chính:** [2.1. product-brief-or-prd.md](file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.1.%20product-brief-or-prd.md)
- **Thiết kế Database:** [2.2. data-spec.md](file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.2.%20data-spec.md)
- **Đặc tả UI/UX:** [2.3. ui-spec.md](file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/2.3.%20ui-spec.md)
- **Kiến trúc kỹ thuật:** [3.1. architecture.md](file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/2.%20Product%20Planning/3.1.%20architecture.md)
- **Bối cảnh & Quy tắc Dự án:** [project-context.md](file://{home}/Desktop/AI%20Project/Cowok-ai/_iwish-output/1.%20Idea%20Discovery/1.4.%20research/project-context.md)

---

## 1. Epic List Summary (Danh sách Epics)

Lộ trình phát triển Cowok.ai được phân rã thành các Epic cốt lõi và backlog mở rộng (Được rebuild tự động từ Physical Files):

| Epic ID | Tên Epic | Feature Group |
| :--- | :--- | :--- |""")

# Build Epic Summary Table
for fg in sorted(fg_map.keys()):
    epics = fg_map[fg]
    for epic_name in sorted(epics.keys(), key=extract_number):
        fm = parse_frontmatter(os.path.join(epics[epic_name]["path"], "epic.md"))
        title = fm.get("title", epic_name)
        title = re.sub(r'(?i)^epic[- ]?\d+[^a-z0-9]*', '', title)
        output.append(f"| **{epic_name}** | {title} | {fg} |")

output.append("""
---

## 2. User Story Breakdown (Chi tiết Stories theo Epic)
""")

# Build Detailed Breakdown
for fg in sorted(fg_map.keys()):
    output.append(f"### {fg}")
    epics = fg_map[fg]
    for epic_name in sorted(epics.keys(), key=extract_number):
        epic_data = epics[epic_name]
        fm = parse_frontmatter(os.path.join(epic_data["path"], "epic.md"))
        title = fm.get("title", epic_name)
        output.append(f"#### {title}")
        
        stories = epic_data["stories"]
        for story_path in sorted(stories, key=lambda x: extract_number(os.path.basename(x))):
            story_name = os.path.basename(story_path)
            sfm = parse_frontmatter(os.path.join(story_path, "story.md"))
            stitle = sfm.get("title", story_name)
            abs_path = os.path.abspath(os.path.join(story_path, "story.md"))
            
            # Format: - [Story-XX.YY: Title](link)
            clean_title = re.sub(r'(?i)^story[- ]?\d+\.\d+[a-z]*[^a-z0-9]*', '', stitle)
            output.append(f"- [{story_name}: {clean_title}](file://{abs_path})")
        output.append("")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(output))
    
print("Successfully rebuilt 2.4. epics-and-stories.md")
