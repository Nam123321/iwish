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

import json
import datetime
from pathlib import Path

project_root = Path("{project-root}")
epic_dir = project_root / "_iwish-output" / "3. Development" / "1. Epic & Story" / "FG-03-Infrastructure-Core-Services" / "Epic-74"
today = datetime.datetime.now().strftime("%Y-%m-%d")

for story_file in sorted(epic_dir.rglob("story.md")):
    with open(story_file, "r") as f:
        content = f.read()
    
    if "status: completed" not in content.lower():
        continue
        
    matrix_section = ""
    in_matrix = False
    for line in content.splitlines():
        if line.startswith("## AC-to-Task Traceability Matrix"):
            in_matrix = True
            continue
        if in_matrix:
            if line.startswith("## "):
                break
            matrix_section += line + "\n"
            
    missing_impl = 0
    for row in matrix_section.strip().split("\n"):
        if "|" in row and "---" not in row and "AC ID" not in row and "AC/Task" not in row:
            cols = [c.strip() for c in row.split("|")][1:-1]
            if len(cols) == 7 and len(cols[0]) > 0:
                code = cols[2]
                if "TODO" in code or not code or "MISSING" in code:
                    missing_impl += 1
                    
    if missing_impl > 0:
        # Refactor!
        new_content = []
        in_changelog = False
        changelog_injected = False
        
        for line in content.splitlines():
            # Update status
            if line.startswith("status: completed") or line.startswith("status: 'completed'") or line.startswith('status: "completed"'):
                new_content.append("status: refactored")
                continue
                
            # Find changelog to append
            if line.startswith("## Change Log") or line.startswith("## Changelog"):
                in_changelog = True
                new_content.append(line)
                continue
                
            if in_changelog and line.startswith("## "):
                in_changelog = False
                
            if in_changelog and not changelog_injected and line.startswith("|---"):
                new_content.append(line)
                new_content.append(f"| {today} | status_change | Thiếu implementation task để tiến hành phát triển lại | Audit Migration | Script |")
                changelog_injected = True
                continue
                
            new_content.append(line)
            
        with open(story_file, "w") as f:
            f.write("\n".join(new_content) + "\n")
        print(f"Refactored {story_file.parent.name}")

