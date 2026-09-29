import os
import re
import yaml
import sys
from datetime import datetime
from collections import defaultdict
from domino_engine import DominoEngine

def extract_number(filename):
    match = re.search(r'(\d+(?:\.\d+)?)', filename)
    return float(match.group(1)) if match else 999.0

def generate_sprint_status(project_root):
    output_file = os.path.join(project_root, "_iwish-output", "3. Development", "sprint-status.yaml")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    engine = DominoEngine(project_root)
    epics_dict = engine.get_epics_dict()

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
            
            clean_epic_title = re.sub(r'^(?:Epic\s+)?\d+\s*[:\-]\s*', '', epic['title'], flags=re.IGNORECASE)
            clean_epic_title = clean_epic_title.replace(":", " -").replace('"', "'")
            epic_key = f"Epic {epic_num} - {clean_epic_title}"
            output_lines.append(f"\"{epic_key}\": {epic['status']}")
            
            if "stories" in epic:
                epic["stories"] = sorted(epic["stories"], key=lambda x: extract_number(x["id"]))
                for story in epic["stories"]:
                    story_id = story["id"]
                    title = story["title"]
                    status = story["status"]
                    
                    story_num_str = story_id.replace('story-', '')
                    clean_title = re.sub(r'^(?:Story\s+)?(?:\d+(?:\.\d+)?)\s*[:\-]\s*', '', title, flags=re.IGNORECASE)
                    clean_title = clean_title.replace(":", " -").replace('"', "'")
                    
                    key = f"Story {story_num_str} - {clean_title}"
                    output_lines.append(f"\"{key}\": {status}")
            
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
