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
from datetime import datetime

def mass_refactor():
    root_dir = "_iwish-output/3. Development/1. Epic & Story"
    
    today = datetime.now().strftime("%Y-%m-%d")
    changelog_entry = f"| {today} | status_change | Thiếu implementation task để tiến hành phát triển lại | Audit Migration | Script |\n"
    
    count_refactored = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if 'story.md' in filenames:
            file_path = os.path.join(dirpath, 'story.md')
            
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Check if status is completed
            status_match = re.search(r'^status:\s*completed\s*$', content, re.MULTILINE)
            if not status_match:
                continue
                
            # Check if there is missing evidence
            if '[MISSING_EVIDENCE]' not in content:
                continue
                
            # Change status to refactored in frontmatter
            content = re.sub(r'^status:\s*completed\s*$', 'status: refactored', content, flags=re.MULTILINE)
            
            # Change status in blockquote if exists (e.g. > **Status:** Completed)
            content = re.sub(r'>\s*\*\*Status:\*\*\s*(Completed|completed)', '> **Status:** Refactored', content)
            
            # Change status in the AC table if exists (optional, let's keep it simple)
            
            # Add to changelog
            # Check if Change Log section exists
            if '## Change Log' in content:
                # Find the end of the change log table and append the row
                # Or simply append it after the table header
                if re.search(r'\|\s*Date\s*\|\s*Change Type\s*\|', content):
                    content = re.sub(r'(\|\s*Date\s*\|\s*Change Type.*?\n\|[-\s|]+\|\n)', r'\1' + changelog_entry, content)
                else:
                    # Append a simple list item
                    content = content.replace('## Change Log\n', f'## Change Log\n- **[{today}]**: Thiếu implementation task để tiến hành phát triển lại (status_change)\n')
            else:
                # Create change log at the end of the file
                content += f"\n## Change Log\n| Date | Change Type | Description | Reason | Source |\n|---|---|---|---|---|\n{changelog_entry}"
                
            with open(file_path, 'w') as f:
                f.write(content)
                
            print(f"Refactored: {file_path}")
            count_refactored += 1
            
    print(f"\nTotal completed stories refactored: {count_refactored}")

if __name__ == '__main__':
    mass_refactor()
