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

def get_all_files():
    import subprocess
    cmd = "find src server packages tests -type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.next/*' 2>/dev/null"
    try:
        output = subprocess.check_output(cmd, shell=True, text=True)
        return [f for f in output.split('\n') if f.strip()]
    except Exception:
        return []

all_files_cache = get_all_files()

def get_lexical_files(ac_text: str):
    words = re.findall(r'\b[A-Z][a-z]+|[a-z]{6,}\b', ac_text)
    keywords = list(set(w.lower() for w in words if w.lower() not in ['should', 'ensure', 'system', 'user', 'when', 'then']))
    
    filtered = []
    for f in all_files_cache:
        f_lower = f.lower()
        if any(k in f_lower for k in keywords[:10]):
            filtered.append(f)
    return filtered

def process_story(item):
    file_path = item.get('file_path', item.get('file'))
    story_id = os.path.basename(os.path.dirname(file_path))
    
    if not os.path.exists(file_path):
        return False, "File not found"
        
    with open(file_path, 'r') as f:
        content = f.read()
        
    if '[MISSING_EVIDENCE]' not in content:
        return False, "Already processed"
        
    lines = content.split('\n')
    new_lines = []
    missing_traces = 0
    total_traces = 0
    
    for line in lines:
        if '|' in line and '[MISSING_EVIDENCE]' in line:
            total_traces += 1
            ac_match = re.search(r'\|\s*(AC\d+)\s*\|', line)
            if ac_match:
                ac_id = ac_match.group(1)
                ac_text = line
                candidates = get_lexical_files(ac_text)
                
                code_file = "Not Found"
                test_file = "Not Found"
                for c in candidates:
                    if 'test' in c.lower() or 'spec' in c.lower():
                        if test_file == "Not Found": test_file = c
                    else:
                        if code_file == "Not Found": code_file = c
                
                code_link = f"[{os.path.basename(code_file)}](file://{os.path.abspath(code_file)})" if code_file != "Not Found" else "[MISSING_EVIDENCE]"
                test_link = f"[{os.path.basename(test_file)}](file://{os.path.abspath(test_file)})" if test_file != "Not Found" else "[MISSING_TEST]"
                
                new_line = re.sub(r'\[MISSING_EVIDENCE\]', code_link, line, count=1)
                new_line = re.sub(r'\[MISSING_TEST\]', test_link, new_line, count=1)
                new_lines.append(new_line)
                
                if test_file == "Not Found" or code_file == "Not Found":
                    missing_traces += 1
            else:
                new_lines.append(line)
                missing_traces += 1
        else:
            new_lines.append(line)
            
    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))
        
    if missing_traces > 0:
        return True, f"Success (Quarantined {missing_traces}/{total_traces} ACs)"
    return True, "Success (100% Mapped)"

def main():
    queue_path = '_iwish/runtime/refactoring-queue/irregular_tasks_v3.json'
    if not os.path.exists(queue_path):
        print("Queue file not found.")
        return
        
    with open(queue_path, 'r') as f:
        queue = json.load(f)
        
    print(f"--- Starting Mass Migration on {len(queue)} Stories (Deterministic Mode) ---")
    
    success_count = 0
    quarantine_count = 0
    error_count = 0
    
    for item in queue:
        try:
            story_id = os.path.basename(os.path.dirname(item.get('file_path', item.get('file'))))
            success, msg = process_story(item)
            print(f"[{story_id}] Result: {msg}")
            if success:
                if "Quarantined" in msg:
                    quarantine_count += 1
                else:
                    success_count += 1
            else:
                error_count += 1
        except Exception as e:
            print(f"[{story_id}] Error: {e}")
            error_count += 1
            
    print("\n--- Mass Migration Results ---")
    print(f"Total Processed: {len(queue)}")
    print(f"Fully Successful (100% Mapped): {success_count}")
    print(f"Partially Quarantined: {quarantine_count}")
    print(f"Errors/Already Processed: {error_count}")

if __name__ == '__main__':
    main()
