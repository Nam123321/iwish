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
import glob

def apply_mappings():
    chunks = glob.glob('_iwish/runtime/refactoring-queue/irregular_results_chunk_*.json')
    
    total_processed = 0
    total_acs_mapped = 0
    
    for chunk_file in chunks:
        with open(chunk_file, 'r') as f:
            try:
                results = json.load(f)
            except json.JSONDecodeError:
                print(f"Error parsing {chunk_file}")
                continue
                
        for task in results:
            story_path = task.get('file_path')
            traceability = task.get('traceability', {})
            
            if not os.path.exists(story_path):
                print(f"Story not found: {story_path}")
                continue
                
            with open(story_path, 'r') as f:
                lines = f.read().split('\n')
                
            new_lines = []
            in_ac_table = False
            
            for line in lines:
                if re.match(r'^\|\s*(ID|AC)\s*\|', line, re.IGNORECASE):
                    in_ac_table = True
                    new_lines.append(line)
                    continue
                    
                if in_ac_table and re.match(r'^\|[-\s|]+\|$', line):
                    new_lines.append(line)
                    continue
                    
                if in_ac_table and line.strip() == "":
                    in_ac_table = False
                    
                if in_ac_table and '|' in line:
                    # Parse row
                    cols = [c.strip() for c in line.split('|')[1:-1]]
                    if len(cols) >= 7:
                        ac_match = re.match(r'^(AC\d+)', cols[0])
                        if ac_match:
                            ac = ac_match.group(1)
                            # Check if we have a mapping
                            mapped_file = traceability.get(ac)
                            
                            # If mapped file is not empty and not MISSING_EVIDENCE, apply it
                            if mapped_file and mapped_file != "[MISSING_EVIDENCE]" and "N/A" not in mapped_file:
                                cols[2] = f"[{os.path.basename(mapped_file)}](file://{mapped_file})"
                                cols[3] = "No" # Missing implementation
                                
                                # Guess test file
                                test_file = mapped_file.replace('.ts', '.test.ts').replace('.tsx', '.test.tsx')
                                cols[4] = f"[{os.path.basename(test_file)}](file://{test_file})"
                                cols[5] = "No" # Missing test
                                
                                total_acs_mapped += 1
                                
                        new_line = f"| {' | '.join(cols)} |"
                        new_lines.append(new_line)
                        continue
                        
                new_lines.append(line)
                
            with open(story_path, 'w') as f:
                f.write('\n'.join(new_lines))
                
            total_processed += 1
            
    print(f"Processed {total_processed} irregular stories, mapped {total_acs_mapped} ACs.")

if __name__ == '__main__':
    apply_mappings()
