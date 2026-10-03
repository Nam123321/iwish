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
import glob
import re

def apply_mappings():
    results_dir = '_iwish/runtime/refactoring-queue'
    chunk_files = glob.glob(os.path.join(results_dir, 'subagent_results_chunk_*.json'))
    
    total_processed = 0
    total_quarantined = 0
    
    for chunk_file in chunk_files:
        with open(chunk_file, 'r') as f:
            try:
                tasks = json.load(f)
            except json.JSONDecodeError:
                continue
                
        for task in tasks:
            file_path = task.get('file_path')
            if not file_path or not os.path.exists(file_path):
                continue
                
            traceability = task.get('traceability', {})
            impacts = task.get('impacts', [])
            data_flow = task.get('data_flow', [])
            
            with open(file_path, 'r') as f:
                content = f.read()
                
            lines = content.split('\n')
            new_lines = []
            
            missing_traces = 0
            in_ac_table = False
            
            for line in lines:
                # Detect table header
                if re.match(r'^\|\s*(ID|AC)\s*\|', line, re.IGNORECASE):
                    new_lines.append("| ID | Acceptance Criteria | Mapped Implementation Tasks | Missing Implementation? | Test File Path | Missing Test? | Status | Mapped Tasks |")
                    in_ac_table = True
                    continue
                elif in_ac_table and re.match(r'^\|[-\s|]+\|$', line):
                    new_lines.append("|---|---|---|---|---|---|---|---|")
                    continue
                    
                if in_ac_table and line.strip() == "":
                    in_ac_table = False
                
                # If it's an AC row
                if '|' in line:
                    ac_match = re.search(r'\|\s*(AC\d+)\s*\|', line)
                    if ac_match:
                        ac = ac_match.group(1)
                        trace_path = traceability.get(ac)
                        
                        cols = [c.strip() for c in line.split('|')[1:-1]]
                        if len(cols) >= 4:
                            # Try to extract existing info
                            ac_text = cols[1]
                            status = cols[-1]
                        else:
                            ac_text = "N/A"
                            status = "N/A"
                        
                        code_link = "[MISSING_EVIDENCE]"
                        if trace_path and trace_path != '[MISSING_EVIDENCE]' and trace_path != 'Not Found':
                            code_link = f"[{os.path.basename(trace_path)}](file://{os.path.abspath(trace_path)})"
                        else:
                            missing_traces += 1
                            
                        # Rebuild row in 7-column format
                        new_line = f"| {ac} | {ac_text} | {code_link} | {'Yes' if code_link == '[MISSING_EVIDENCE]' else ''} | [MISSING_TEST] | Yes | {status} |"
                        new_lines.append(new_line)
                        continue

                # Handle Impacts/Data Flow sections if they exist in placeholder form
                if '- [MIGRATION_PLACEHOLDER] Data flow mapping needs verification.' in line:
                    if data_flow:
                        for df in data_flow:
                            new_lines.append(f"- {df}")
                    else:
                        new_lines.append(line)
                    continue
                    
                if '- [MIGRATION_PLACEHOLDER] Impacts mapping needs verification.' in line:
                    if impacts:
                        for imp in impacts:
                            new_lines.append(f"- {imp}")
                    else:
                        new_lines.append(line)
                    continue
                    
                new_lines.append(line)
                
            with open(file_path, 'w') as f:
                f.write('\n'.join(new_lines))
                
            total_processed += 1
            if missing_traces > 0:
                total_quarantined += 1
                
    print(f"--- Patching Complete ---")
    print(f"Total Stories Patched: {total_processed}")
    print(f"Stories with some missing evidence (Quarantined): {total_quarantined}")
    print(f"Fully Mapped Stories: {total_processed - total_quarantined}")

if __name__ == '__main__':
    apply_mappings()
