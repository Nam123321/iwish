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

# 1. Build list of all valid logical IDs in the workspace
files = glob.glob('_iwish-output/**/*.md', recursive=True)
valid_logical_ids = set()
file_to_logical = {}

for path in files:
    filename = os.path.basename(path)
    if filename in ['story.md', 'ui-spec.md', 'data-spec.md', 'task.md', 'epic.md']:
        parts = path.split('/')
        if len(parts) >= 2:
            logical = parts[-2]
    elif filename.startswith('Epic-') and filename.endswith('.md'):
        logical = filename.replace('.md', '')
    elif filename.startswith('review-story-') and filename.endswith('.md'):
        logical = filename.replace('review-', '').replace('.md', '').capitalize()
    else:
        logical = filename.replace('.md', '')
    
    valid_logical_ids.add(logical)
    file_to_logical[path] = logical

# Add special system IDs that are always valid
valid_logical_ids.add('PRD')
valid_logical_ids.add('epics-and-stories')

# 2. Audit all files
audit_results = {}
total_broken = 0

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.startswith('---\n'): continue
            fm = yaml.safe_load(content.split('---\n', 2)[1])
            if not isinstance(fm, dict): continue
            
            broken_for_this_file = []
            for key in ['links_to', 'dependencies']:
                if key in fm and isinstance(fm[key], list):
                    for link in fm[key]:
                        # Fuzzy match check
                        if link not in valid_logical_ids:
                            # Try case-insensitive or exact match against basenames
                            found = False
                            for v in valid_logical_ids:
                                if str(link).lower() == v.lower():
                                    found = True
                                    break
                            if not found:
                                broken_for_this_file.append(str(link))
            
            if broken_for_this_file:
                audit_results[file_path] = list(set(broken_for_this_file))
                total_broken += len(audit_results[file_path])
    except Exception as e:
        pass

print(json.dumps({'total_files_with_broken_links': len(audit_results), 'total_broken_links': total_broken, 'details': audit_results}, indent=2))
