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

EPICS_DIR = '_iwish-output/3. Development/1. Epic & Story'

def cleanup_epic_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_stories_section = False
    in_auto_sync = False
    modified = False

    for line in lines:
        if line.startswith('## Stories'):
            in_stories_section = True
            new_lines.append(line)
            continue
            
        if line.startswith('## '): # Next section
            in_stories_section = False
            
        if "<!-- BEGIN AUTO-SYNC" in line:
            in_auto_sync = True
            new_lines.append(line)
            continue
            
        if "<!-- END AUTO-SYNC" in line:
            in_auto_sync = False
            new_lines.append(line)
            continue

        # If we are in the stories section but NOT in the auto-sync block, 
        # we should delete any markdown table lines.
        if in_stories_section and not in_auto_sync:
            if line.startswith('|') or (line.strip() == '' and len(new_lines) > 0 and new_lines[-1].startswith('|')):
                # It's a table row or a blank line immediately after a table, drop it.
                # Wait, blank lines might be useful, let's just drop lines starting with '|'
                modified = True
                continue

        new_lines.append(line)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def main():
    count = 0
    for root, dirs, files in os.walk(EPICS_DIR):
        if 'epic.md' in files:
            filepath = os.path.join(root, 'epic.md')
            if cleanup_epic_file(filepath):
                print(f"Cleaned up {filepath}")
                count += 1
    print(f"Cleaned {count} files.")

if __name__ == '__main__':
    main()
