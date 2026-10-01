#!/usr/bin/env python3
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
import subprocess
from pathlib import Path
import json
import sys

project_root = Path("{project-root}")
story_dir = project_root / "_iwish-output" / "3. Development" / "1. Epic & Story"
normalize_script = project_root / ".agent" / "scripts" / "normalize-story-matrix.py"
linker_script = project_root / ".agent" / "scripts" / "auto-traceability-linker.py"

results = []

stories = list(story_dir.rglob("story.md"))
print(f"Found {len(stories)} stories to process.", flush=True)

for idx, story_file in enumerate(stories):
    try:
        story_id = story_file.parent.name.replace("Story-", "")
        epic_id = story_file.parent.parent.name.replace("Epic-", "")
        
        # 1. Normalize
        res1 = subprocess.run(["python3", str(normalize_script), "--story-path", str(story_file)], capture_output=True, text=True)
        if res1.returncode != 0:
            print(f"Error normalizing {story_file}: {res1.stderr}", file=sys.stderr)
            continue
            
        # 2. Link
        res2 = subprocess.run(["python3", str(linker_script), "--story", str(story_file)], capture_output=True, text=True)
        if res2.returncode != 0:
            print(f"Error linking {story_file}: {res2.stderr}", file=sys.stderr)
            continue
            
        # 3. Analyze output for the table
        with open(story_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find status from YAML frontmatter
        status = "unknown"
        for line in content.splitlines():
            if line.startswith("status:"):
                status = line.split(":", 1)[1].strip()
                break

        # Analyze Matrix
        matrix_section = ""
        in_matrix = False
        for line in content.splitlines():
            if line.startswith("## AC-to-Task Traceability Matrix") or line.startswith("## Traceability Matrix"):
                in_matrix = True
                continue
            if in_matrix:
                if line.startswith("## "):
                    break
                matrix_section += line + "\n"
                
        total_acs = 0
        missing_impl = 0
        missing_test = 0
        
        for row in matrix_section.strip().split("\n"):
            if "|" in row and "---" not in row and "AC ID" not in row and "AC/Task" not in row:
                cols = [c.strip() for c in row.split("|")][1:-1]
                if len(cols) >= 5:
                    if cols[0].startswith("AC"):
                        total_acs += 1
                        code = cols[2]
                        test = cols[4] if len(cols) > 4 else "TODO"
                        if "TODO" in code or not code:
                            missing_impl += 1
                        if "TODO" in test or not test:
                            missing_test += 1

        # Check Cross-Feature Dependencies
        cross_feature_deps = "MISSING"
        in_cf = False
        cf_content = ""
        for line in content.splitlines():
            if "Cross-Feature Dependencies" in line or "Cross-feature Dependencies" in line:
                in_cf = True
                continue
            if in_cf:
                if line.startswith("## "):
                    break
                cf_content += line + "\n"
        if len(cf_content.strip()) > 10 and "None" not in cf_content and "TBD" not in cf_content:
            cross_feature_deps = "OK"
        elif "None" in cf_content:
            cross_feature_deps = "None"
            
        results.append({
            "story_id": story_id,
            "epic_id": epic_id,
            "status": status,
            "total_acs": total_acs,
            "missing_impl": missing_impl,
            "missing_test": missing_test,
            "cross_feature_deps": cross_feature_deps,
            "path": str(story_file)
        })
        if idx % 10 == 0:
            print(f"Processed {idx} / {len(stories)}", flush=True)
            
        # Save incrementally
        with open("_iwish-output/adhoc-workspace/scratch/mass_normalize_results.json", "w") as f:
            json.dump(results, f)

    except Exception as e:
        print(f"Exception on {story_file}: {e}")

print(f"Done. Processed {len(results)} stories.")
