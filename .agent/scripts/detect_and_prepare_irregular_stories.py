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
import json

def get_all_files():
    import subprocess
    cmd = "find src server packages tests -type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/.venv/*' 2>/dev/null"
    try:
        output = subprocess.check_output(cmd, shell=True, text=True)
        return [f for f in output.split('\n') if f.strip()]
    except Exception:
        return []

def get_lexical_files(ac_text: str, all_files: list):
    words = re.findall(r'\b[A-Za-z]{4,}\b', ac_text)
    ignore_words = {'should', 'ensure', 'system', 'user', 'when', 'then', 'this', 'that', 'with', 'from'}
    keywords = set(w.lower() for w in words if w.lower() not in ignore_words)
    
    scores = []
    for f in all_files:
        f_lower = os.path.basename(f).lower()
        score = sum(1 for k in keywords if k in f_lower)
        if score > 0:
            scores.append((score, f))
            
    scores.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scores[:100]]

def detect_and_prepare():
    root_dir = "_iwish-output/3. Development/1. Epic & Story"
    all_files = get_all_files()
    
    irregular_stories = []
    tasks = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if 'story.md' in filenames:
            file_path = os.path.join(dirpath, 'story.md')
            with open(file_path, 'r') as f:
                content = f.read()
                
            lines = content.split('\n')
            new_lines = []
            
            in_ac_table = False
            needs_upgrade = False
            has_irregular = False
            ac_text_combined = ""
            
            for line in lines:
                if re.match(r'^\|\s*(ID|AC)\s*\|', line, re.IGNORECASE):
                    # Check if it has 7 columns and standard header
                    if 'Missing Implementation?' not in line:
                        needs_upgrade = True
                        has_irregular = True
                        new_lines.append("| ID | Acceptance Criteria | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |")
                        new_lines.append("|---|---|---|---|---|---|---|---|")
                    else:
                        new_lines.append(line)
                    in_ac_table = True
                    continue
                    
                if in_ac_table and re.match(r'^\|[-\s|]+\|$', line):
                    if needs_upgrade:
                        new_lines.append("|---|---|---|---|---|---|---|---|")
                    else:
                        new_lines.append(line)
                    continue
                    
                if in_ac_table and line.strip() == "":
                    in_ac_table = False
                    
                if in_ac_table and '|' in line:
                    if needs_upgrade:
                        ac_match = re.search(r'\|\s*(AC\d+)\s*\|', line)
                        if ac_match:
                            ac = ac_match.group(1)
                            cols = [c.strip() for c in line.split('|')[1:-1]]
                            # Usually cols[1] is the text or task
                            ac_text = cols[1] if len(cols) > 1 else "N/A"
                            ac_text_combined += ac_text + " "
                            
                            status = cols[-1] if len(cols) > 2 else "N/A"
                            if status.lower() not in ['done', 'todo', 'in progress', 'n/a']:
                                status = 'N/A'
                                
                            new_line = f"| {ac} | {ac_text} | [MISSING_EVIDENCE] | Yes | [MISSING_TEST] | Yes | {status} |"
                            new_lines.append(new_line)
                            continue
                
                new_lines.append(line)
                
            if has_irregular:
                # Save upgraded file
                with open(file_path, 'w') as f:
                    f.write('\n'.join(new_lines))
                    
                irregular_stories.append(file_path)
                
                # Prepare task
                story_id = os.path.basename(dirpath)
                candidates = get_lexical_files(ac_text_combined, all_files)
                if not candidates:
                    candidates = all_files[:100]
                    
                tasks.append({
                    "story_id": story_id,
                    "file_path": file_path,
                    "ac_text": ac_text_combined.strip()[:1000], # Pass text for context
                    "candidates": "\n".join(candidates[:100])
                })
                
    if tasks:
        os.makedirs('_iwish/runtime/refactoring-queue', exist_ok=True)
        with open('_iwish/runtime/refactoring-queue/irregular_tasks.json', 'w') as f:
            json.dump(tasks, f, indent=2)
            
    print(f"Upgraded {len(irregular_stories)} irregular stories and prepared them for mapping.")

if __name__ == '__main__':
    detect_and_prepare()
