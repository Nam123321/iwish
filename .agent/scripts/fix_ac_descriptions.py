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

import re

with open("_iwish-output/3. Development/1. Epic & Story/FG-03-Infrastructure-Core-Services/Epic-74/Story-74.6/story.md", "r", encoding="utf-8") as f:
    text = f.read()

# Extract ACs
acs = {}
in_ac = False
for line in text.split('\n'):
    if line.startswith("## Acceptance Criteria"):
        in_ac = True
    elif line.startswith("## "):
        in_ac = False
    
    if in_ac:
        m = re.search(r'^\*\*(AC\d+):\*\*\s*(.+)', line.strip())
        if m:
            acs[m.group(1)] = m.group(2).strip()

# Update Table
lines = text.split('\n')
in_table = False
header_indices = {}

for i, line in enumerate(lines):
    if line.startswith("## AC-to-Task Traceability Matrix"):
        in_table = True
        continue
    
    if in_table and line.startswith("| AC ID |"):
        headers = [h.strip() for h in line.split('|')]
        header_indices = {h: idx for idx, h in enumerate(headers) if h}
        continue
        
    if in_table and line.startswith("| AC"):
        cols = line.split('|')
        ac_id = cols[1].strip()
        if ac_id in acs:
            cols[2] = f" {acs[ac_id]} "
            lines[i] = "|".join(cols)
            
    if in_table and line.startswith("## ") and not line.startswith("## AC-to-Task"):
        in_table = False

with open("_iwish-output/3. Development/1. Epic & Story/FG-03-Infrastructure-Core-Services/Epic-74/Story-74.6/story.md", "w", encoding="utf-8") as f:
    f.write('\n'.join(lines))

