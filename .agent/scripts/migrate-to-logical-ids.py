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

import os, glob, yaml, json
from urllib.parse import unquote

def extract_logical_id(path):
    path = unquote(path)
    filename = os.path.basename(path)
    if filename in ['story.md', 'ui-spec.md', 'data-spec.md', 'task.md', 'epic.md']:
        parts = path.split('/')
        if len(parts) >= 2:
            return parts[-2]
    elif filename.startswith('Epic-') and filename.endswith('.md'):
        return filename.replace('.md', '')
    elif filename.startswith('review-story-') and filename.endswith('.md'):
        return filename.replace('review-', '').replace('.md', '').capitalize()
    elif path.startswith('epic://'):
        return filename.capitalize()
    elif filename == '2.4. epics-and-stories.md':
        return 'epics-and-stories'
    elif filename == '2.1. product-brief-or-prd.md':
        return 'PRD'
    else:
        return filename.replace('.md', '')

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if not content.startswith('---\n'):
            return False
            
        parts = content.split('---\n', 2)
        if len(parts) < 3:
            return False
            
        fm_text = parts[1]
        body = parts[2]
        
        fm = yaml.safe_load(fm_text)
        if not isinstance(fm, dict):
            return False
            
        changed = False
        
        for key in ['links_to', 'dependencies']:
            if key in fm and isinstance(fm[key], list):
                new_arr = []
                for link in fm[key]:
                    link_str = str(link)
                    if link_str.startswith('file://') or '/' in link_str or link_str.endswith('.md') or link_str.startswith('epic://'):
                        new_id = extract_logical_id(link_str)
                        new_arr.append(new_id)
                        changed = True
                    else:
                        new_arr.append(link)
                # Deduplicate while preserving order
                fm[key] = list(dict.fromkeys(new_arr))
                
        if changed:
            # write back safely
            class Dumper(yaml.Dumper):
                def increase_indent(self, flow=False, indentless=False):
                    return super(Dumper, self).increase_indent(flow, False)
                    
            new_fm_text = yaml.dump(fm, Dumper=Dumper, default_flow_style=False, sort_keys=False, allow_unicode=True)
            new_content = f"---\n{new_fm_text}---\n{body}"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    return False

files = glob.glob('_iwish-output/**/*.md', recursive=True)
changed_count = 0
for f in files:
    if process_file(f):
        changed_count += 1
        
print(f"Migration complete. Updated {changed_count} files.")
