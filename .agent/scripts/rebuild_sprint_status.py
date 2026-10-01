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
import re
import yaml

EPICS_DIR = '_iwish-output/3. Development/1. Epic & Story'
SPRINT_STATUS_PATH = '_iwish-output/3. Development/sprint-status.yaml'

def parse_frontmatter(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.startswith('---\n'):
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    try:
                        return yaml.safe_load(parts[1]) or {}
                    except:
                        pass
    return {}

def main():
    # Keep original header if exists
    header_lines = []
    if os.path.exists(SPRINT_STATUS_PATH):
        with open(SPRINT_STATUS_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() == '' or line.startswith('sprint_name') or line.startswith('status:') or line.startswith('start_date'):
                    header_lines.append(line)
                else:
                    break
    if not header_lines:
        header_lines = ["sprint_name: Active Sprint\n", "status: active\n", "start_date: '2026-07-24'\n", "\n"]
        
    structure = {}
    
    # Walk physical directories
    for root, dirs, files in os.walk(EPICS_DIR):
        if root == EPICS_DIR:
            continue
            
        rel_path = os.path.relpath(root, EPICS_DIR)
        parts = rel_path.split(os.sep)
        
        if len(parts) == 1:
            fg_name = parts[0]
            if fg_name not in structure:
                structure[fg_name] = {}
        
        elif len(parts) == 2:
            fg_name = parts[0]
            epic_name = parts[1]
            if epic_name.startswith('Epic-'):
                if fg_name not in structure:
                    structure[fg_name] = {}
                if epic_name not in structure[fg_name]:
                    structure[fg_name][epic_name] = []
                    
        elif len(parts) == 3:
            fg_name = parts[0]
            epic_name = parts[1]
            story_name = parts[2]
            if story_name.startswith('Story-'):
                story_file = os.path.join(root, 'story.md')
                frontmatter = parse_frontmatter(story_file)
                status = frontmatter.get('status', 'backlog').lower()
                
                story_id = story_name.replace('Story-', '')
                if status == 'completed':
                    missing_evidence = []
                    
                    # Core pipeline evidence
                    for phase in ['pre-code', 'post-code', 'review', 'delivery']:
                        if not os.path.exists(os.path.join(root, f'pipeline-evidence-{phase}.json')):
                            missing_evidence.append(phase)
                            
                    # UADRG evidence checks
                    for evidence_file in ['pipeline-evidence-graph.json', 'drift-report.json']:
                        if not os.path.exists(os.path.join(root, evidence_file)):
                            missing_evidence.append(f"UADRG:{evidence_file}")
                    
                    ecc_file = os.path.join('_iwish-output', '_state', 'ecc', f'Story-{story_id}-evidence.json')
                    if not os.path.exists(ecc_file):
                        missing_evidence.append(f"UADRG:ecc-evidence")
                    
                    if missing_evidence:
                        print(f"⚠️  Firewall blocked 'completed' for Story {story_id}: Missing evidence for {missing_evidence}")
                        status = 'dev_completed'
                title = ""
                if os.path.exists(story_file):
                    with open(story_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            # Match "# Story-43.5:" or "# Story 43.5:" or "# Story PE-01.1:"
                            m = re.match(r'^#\s+Story(?:-|\s+)[a-zA-Z0-9\-]+\.\d+(?:[a-zA-Z]+)?:\s*(.*)', line, re.IGNORECASE)
                            if m:
                                title = m.group(1).strip()
                                break
                            m2 = re.match(r'^#\s+(.*)', line)
                            if m2 and 'Story' not in line:
                                title = m2.group(1).strip()
                if not title:
                    title = story_name
                
                story_id = story_name.replace('Story-', '')
                if fg_name not in structure:
                    structure[fg_name] = {}
                if epic_name not in structure[fg_name]:
                    structure[fg_name][epic_name] = []
                
                structure[fg_name][epic_name].append({
                    'id': story_id,
                    'title': title,
                    'status': status
                })

    def extract_num(s):
        m = re.search(r'(\d+)', s)
        return int(m.group(1)) if m else 99999
        
    def extract_float(s):
        m = re.search(r'(\d+\.\d+)', s)
        return float(m.group(1)) if m else 99999.0

    out_lines = header_lines.copy()
    
    sorted_fgs = sorted(structure.keys(), key=extract_num)
    for fg in sorted_fgs:
        # Check if FG has any stories
        fg_has_stories = any(len(stories) > 0 for stories in structure[fg].values())
        if not fg_has_stories:
            continue
            
        out_lines.append(f"# {'='*50}\n")
        out_lines.append(f"# Feature Group: {fg}\n")
        out_lines.append(f"# {'='*50}\n\n")
        
        sorted_epics = sorted(structure[fg].keys(), key=extract_num)
        for epic in sorted_epics:
            if len(structure[fg][epic]) == 0:
                continue # Skip Epics with no stories (like Epic-41.19 directory artifact)
                
            epic_id = epic.replace('Epic-', '')
            epic_title = ""
            epic_file = os.path.join(EPICS_DIR, fg, epic, 'epic.md')
            if os.path.exists(epic_file):
                with open(epic_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        # Match "# Epic 01:" or "# Epic-01:" or "# Epic PE-01:"
                        m = re.match(r'^#\s+Epic(?:-|\s+)[a-zA-Z0-9\-]+:\s*(.*)', line, re.IGNORECASE)
                        if m:
                            epic_title = m.group(1).strip()
                            break
            if not epic_title:
                epic_title = epic
                
            sorted_stories = sorted(structure[fg][epic], key=lambda x: extract_float(x['id']))
            
            epic_fm = parse_frontmatter(epic_file) if os.path.exists(epic_file) else {}
            epic_status = epic_fm.get('status', '').lower()
            
            if not epic_status:
                active_stories = [s for s in sorted_stories if s['status'] not in ('canceled', 'superseded')]
                if not active_stories:
                    epic_status = 'completed' if sorted_stories else 'backlog'
                else:
                    all_completed = all(s['status'] == 'completed' for s in active_stories)
                    all_backlog = all(s['status'] == 'backlog' for s in active_stories)
                    if all_completed:
                        epic_status = 'completed'
                    elif all_backlog:
                        epic_status = 'backlog'
                    else:
                        epic_status = 'in_progress'
                    
            out_lines.append(f"# Epic {epic_id}: {epic_title}\n")
            out_lines.append(f"\"Epic {epic_id} - {epic_title}\": {epic_status}\n")
            
            for story in sorted_stories:
                out_lines.append(f"\"Story {story['id']} - {story['title']}\": {story['status']}\n")
            out_lines.append("\n")

    with open(SPRINT_STATUS_PATH, 'w', encoding='utf-8') as f:
        f.writelines(out_lines)
        
    print(f"Successfully rebuilt sprint-status.yaml")

if __name__ == '__main__':
    main()
