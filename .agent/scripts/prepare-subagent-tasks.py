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
import json
import re
import random
import subprocess
try:
    from falkordb import FalkorDB
except ImportError:
    FalkorDB = None

def get_all_files():
    cmd = "find src server packages tests -type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/.venv/*' 2>/dev/null"
    try:
        output = subprocess.check_output(cmd, shell=True, text=True)
        return [f for f in output.split('\n') if f.strip()]
    except Exception:
        return []

def get_structural_files_from_graph(story_id: str):
    if not FalkorDB:
        return []
    try:
        db = FalkorDB(host='localhost', port=6380)
        graph = db.select_graph("iwish_domino")
        query = f"MATCH (s:Story {{id: '{story_id.lower()}'}})-[*1..2]-(f:File) RETURN f.path"
        result = graph.query(query)
        files = []
        for record in result.result_set:
            files.append(record[0])
        return files
    except Exception as e:
        return []

def get_lexical_files(ac_text: str, all_files: list):
    words = re.findall(r'\b[A-Za-z]{4,}\b', ac_text)
    ignore_words = {'should', 'ensure', 'system', 'user', 'when', 'then', 'this', 'that', 'with', 'from'}
    keywords = set(w.lower() for w in words if w.lower() not in ignore_words)
    
    scores = []
    for f in all_files:
        f_lower = os.path.basename(f).lower() # Match against basename for higher accuracy
        score = sum(1 for k in keywords if k in f_lower)
        if score > 0:
            scores.append((score, f))
            
    scores.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scores[:100]]

def main():
    queue_path = '_iwish/runtime/refactoring-queue/legacy-upgrade-queue.json'
    if not os.path.exists(queue_path):
        print("Queue not found")
        return
        
    with open(queue_path, 'r') as f:
        queue = json.load(f)
        
    all_files = get_all_files()
    
    valid_items = []
    for item in queue:
        file_path = item['file']
        try:
            with open(file_path, 'r') as f:
                if '[MIGRATION_PLACEHOLDER]' in f.read():
                    valid_items.append(item)
        except Exception:
            pass
            
    tasks = []
    for item in valid_items:
        file_path = item['file']
        story_id = os.path.basename(os.path.dirname(file_path))
        
        with open(file_path, 'r') as f:
            content = f.read()
            
        if '[MIGRATION_PLACEHOLDER]' not in content:
            continue
            
        ac_match = re.search(r'## Acceptance Criteria(.*?)(##|\Z)', content, re.DOTALL)
        ac_text = ac_match.group(1).strip() if ac_match else ""
        if not ac_text:
            continue
            
        files = get_structural_files_from_graph(story_id)
        if not files:
            files = get_lexical_files(ac_text, all_files)
            if not files:
                files = all_files[:100]
                
        candidate_list = "\n".join(files[:100])
        tasks.append({
            "story_id": story_id,
            "file_path": file_path,
            "ac_text": ac_text,
            "candidates": candidate_list
        })
        
    with open('_iwish/runtime/refactoring-queue/subagent_tasks.json', 'w') as f:
        json.dump(tasks, f, indent=2)
        
    print(f"Prepared {len(tasks)} tasks.")

if __name__ == '__main__':
    main()
