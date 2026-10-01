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
    ignore_words = {'should', 'ensure', 'system', 'user', 'when', 'then', 'this', 'that', 'with', 'from', 'must', 'given', 'edge', 'case'}
    keywords = set(w.lower() for w in words if w.lower() not in ignore_words)
    
    scores = []
    for f in all_files:
        f_lower = os.path.basename(f).lower()
        score = sum(1 for k in keywords if k in f_lower)
        if score > 0:
            scores.append((score, f))
            
    scores.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scores[:50]]

def run():
    root_dir = "_iwish-output/3. Development/1. Epic & Story"
    all_files = get_all_files()
    
    tasks = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if 'story.md' in filenames:
            file_path = os.path.join(dirpath, 'story.md')
            with open(file_path, 'r') as f:
                content = f.read()
                
            ac_section_match = re.search(r'## Acceptance Criteria(.*?)(?:##|\Z)', content, re.DOTALL)
            if not ac_section_match:
                continue
                
            ac_text_block = ac_section_match.group(1)
            acs = []
            for line in ac_text_block.split('\n'):
                line = line.strip()
                if re.match(r'^[-*]\s*(?:\[.*?\]\s*)?AC\d+', line, re.IGNORECASE) or re.match(r'^\d+\.', line):
                    acs.append(line)
                elif re.match(r'^[-*]\s+', line) and len(line) > 10:
                    acs.append(line)
                    
            if not acs:
                continue
                
            table_match = re.search(r'## AC-to-Task Traceability Matrix\n(.*?)(?:##|\Z)', content, re.DOTALL)
            needs_table_rewrite = False
            
            existing_mapping = {}
            
            if table_match:
                table_text = table_match.group(1)
                data_rows = [l for l in table_text.split('\n') if '|' in l and not re.match(r'^\|[-\s|]+\|$', l) and 'Acceptance Criteria' not in l]
                
                if len(data_rows) != len(acs):
                    needs_table_rewrite = True
                elif len(data_rows) > 0:
                    cols = data_rows[0].split('|')
                    if len(cols) < 8:
                        needs_table_rewrite = True
                    else:
                        first_real_ac = acs[0].replace('|', '/').strip()
                        if first_real_ac.startswith('-'): first_real_ac = first_real_ac[1:].strip()
                        if re.match(r'^\d+\.', first_real_ac): first_real_ac = first_real_ac[first_real_ac.find('.')+1:].strip()
                        
                        first_table_ac = data_rows[0].split('|')[2].strip()
                        if first_real_ac != first_table_ac:
                            needs_table_rewrite = True
                else:
                    needs_table_rewrite = True

                for row in data_rows:
                    cols = [c.strip() for c in row.split('|')]
                    if len(cols) >= 4:
                        ac_id = cols[1]
                        impl = cols[3] if len(cols) > 3 else ""
                        test = cols[5] if len(cols) > 5 else ""
                        
                        mapping = {"impl": "[MISSING_EVIDENCE]", "test": "[MISSING_TEST]"}
                        if 'file://' in impl or impl == 'N/A':
                            mapping['impl'] = impl
                        if 'file://' in test or test == 'N/A':
                            mapping['test'] = test
                        existing_mapping[ac_id] = mapping
            else:
                needs_table_rewrite = True
                
            if needs_table_rewrite:
                new_table = "## AC-to-Task Traceability Matrix\n"
                new_table += "| ID | Acceptance Criteria | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |\n"
                new_table += "|---|---|---|---|---|---|---|---|\n"
                
                ac_texts_for_task = {}
                for idx, ac_line in enumerate(acs):
                    ac_id_match = re.search(r'(AC\d+)', ac_line, re.IGNORECASE)
                    ac_id = ac_id_match.group(1).upper() if ac_id_match else f"AC{idx+1}"
                    
                    clean_text = ac_line.replace('|', '/').strip()
                    if clean_text.startswith('-'): clean_text = clean_text[1:].strip()
                    if re.match(r'^\d+\.', clean_text): clean_text = clean_text[clean_text.find('.')+1:].strip()
                    
                    impl = existing_mapping.get(ac_id, {}).get('impl', '[MISSING_EVIDENCE]')
                    test = existing_mapping.get(ac_id, {}).get('test', '[MISSING_TEST]')
                    missing_impl = "No" if impl != '[MISSING_EVIDENCE]' and impl != 'N/A' else "Yes"
                    missing_test = "No" if test != '[MISSING_TEST]' and test != 'N/A' else "Yes"
                    
                    new_table += f"| {ac_id} | {clean_text} | {impl} | {missing_impl} | {test} | {missing_test} | N/A |\n"
                    
                    if impl == '[MISSING_EVIDENCE]':
                        ac_texts_for_task[ac_id] = clean_text
                    
                if table_match:
                    content = content.replace(table_match.group(0), new_table + "\n\n")
                else:
                    content += "\n\n" + new_table
                    
                with open(file_path, 'w') as f:
                    f.write(content)
                    
                if ac_texts_for_task:
                    story_id = os.path.basename(dirpath)
                    combined_text = " ".join(ac_texts_for_task.values())
                    candidates = get_lexical_files(combined_text, all_files)
                    
                    tasks.append({
                        "story_id": story_id,
                        "file_path": file_path,
                        "ac_text": ac_texts_for_task,
                        "candidates": "\n".join(candidates)
                    })
                
    if tasks:
        os.makedirs('_iwish/runtime/refactoring-queue', exist_ok=True)
        with open('_iwish/runtime/refactoring-queue/irregular_tasks_v3.json', 'w') as f:
            json.dump(tasks, f, indent=2)
            
    print(f"Processed and rebuilt tables for {len(tasks)} stories.")

if __name__ == '__main__':
    run()
