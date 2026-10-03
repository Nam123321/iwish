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

import yaml, json

with open('_iwish-output/sync_audit.json', 'r') as f:
    audit = json.load(f)

changed_count = 0

for file_path, broken_links in audit.get('details', {}).items():
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        parts = content.split('---\n', 2)
        if len(parts) < 3: continue
        
        fm = yaml.safe_load(parts[1])
        body = parts[2]
        
        changed = False
        for key in ['links_to', 'dependencies']:
            if key in fm and isinstance(fm[key], list):
                new_arr = [link for link in fm[key] if str(link) not in broken_links]
                if len(new_arr) != len(fm[key]):
                    fm[key] = new_arr
                    changed = True
                    
        if changed:
            class Dumper(yaml.Dumper):
                def increase_indent(self, flow=False, indentless=False):
                    return super(Dumper, self).increase_indent(flow, False)
                    
            new_fm_text = yaml.dump(fm, Dumper=Dumper, default_flow_style=False, sort_keys=False, allow_unicode=True)
            new_content = f"---\n{new_fm_text}---\n{body}"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            changed_count += 1
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print(f"Self-healing complete. Fixed {changed_count} files.")
