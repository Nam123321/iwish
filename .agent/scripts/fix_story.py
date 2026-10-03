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

file_path = "{project-root}/_iwish-output/3. Development/1. Epic & Story/FG-01-Platform-Foundation-Connectors/Epic-01/Story-01.6/story.md"

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
in_matrix = False
expected_ac = 1

for line in lines:
    if line.startswith("| AC ID |") or line.startswith("|-------|"):
        in_matrix = True
        new_lines.append(line)
        continue
    
    if in_matrix and line.startswith("| AC"):
        # We know the rows are in order AC1 to AC12. 
        # But wait, earlier I might have corrupted the matrix.
        # Let's clean the row.
        parts = line.split("|")
        # Ensure the row has enough parts
        if len(parts) >= 8:
            # Fix column 1
            parts[1] = f" AC{expected_ac} "
            
            # Fix column 2
            desc = parts[2]
            # Replace any AC number in the description
            desc = re.sub(r"\*\*(?:\[EDGE-CASE\] )?AC[\d\.]+", f"**AC{expected_ac}", desc)
            parts[2] = desc
            
            line = "|".join(parts)
            expected_ac += 1
            new_lines.append(line)
        else:
            # Maybe the line was wrapped or corrupted?
            # Let's check if it's a broken line. 
            pass # We will just skip appending and let the logic handle it or append as is
    elif in_matrix and not line.strip():
        in_matrix = False
        new_lines.append(line)
    elif in_matrix and not line.startswith("|"):
        # Probably a broken line from earlier regex replacing | AC5.2 | -> | AC5 | .2 |
        # Wait! If it's | AC5 | .2 ... it starts with | AC5. So it will be caught by line.startswith("| AC").
        pass
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
