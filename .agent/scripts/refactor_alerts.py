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

SRC_DIR = '{project-root}/src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if neither alert nor confirm is present
    if not re.search(r'\b(?:window\.)?(?:alert|confirm)\s*\(', content):
        return

    # Check if this is a functional component file. We only inject hooks inside React components
    # A heuristic: look for `export default function` or `const [A-Z]\w* =` or `function [A-Z]\w*`
    is_component_file = bool(re.search(r'(?:export (?:default )?function\s+[A-Z]\w*|const\s+[A-Z]\w*\s*=\s*(?:(?:\([^)]*\))|[^=]+)\s*=>|function\s+[A-Z]\w*)', content))
    
    # We will do a regex replacement but it's very dangerous if nested.
    # To do it safely, let's use a simpler heuristic for string-only alerts
    # window.alert("foo") or alert('foo')
    
    # Let's extract all alerts and confirms
    # alert("something")
    alert_pattern = r'\b(?:window\.)?alert\s*\(\s*(.*?)\s*\)'
    confirm_pattern = r'\b(?:window\.)?confirm\s*\(\s*(.*?)\s*\)'

    original_content = content

    def generate_key(s):
        # strip quotes
        clean_s = s.strip('`\'"')
        # convert to snake case
        key = re.sub(r'[^a-zA-Z0-9]+', '_', clean_s).strip('_').lower()
        if not key:
            key = 'notification'
        return key

    # Replace alert
    def alert_repl(match):
        inner = match.group(1)
        if not inner:
            return match.group(0)
        # Check if inner is just a string or variable.
        # We will wrap it in t(key, inner)
        if inner.startswith("'") or inner.startswith('"') or inner.startswith('`'):
            key = generate_key(inner)
            return f"toast({{ description: t('{key[:30]}', {inner}) }})"
        else:
            return f"toast({{ description: {inner} }})"

    content = re.sub(alert_pattern, alert_repl, content)

    # Replace confirm
    def confirm_repl(match):
        inner = match.group(1)
        if not inner:
            return match.group(0)
        if inner.startswith("'") or inner.startswith('"') or inner.startswith('`'):
            key = generate_key(inner)
            return f"await confirm(t('{key[:30]}', {inner}))"
        else:
            return f"await confirm({inner})"

    content = re.sub(confirm_pattern, confirm_repl, content)

    if content != original_content:
        # We need to inject imports if missing
        imports_to_add = []
        if 'toast' in content and 'useToast' not in content:
            imports_to_add.append("import { useToast } from '@/components/ui/use-toast';")
        if 'confirm' in content and 'useConfirm' not in content:
            imports_to_add.append("import { useConfirm } from '@/components/ui/use-confirm';")
        if 't(' in content and 'useTranslation' not in content:
            imports_to_add.append("import { useTranslation } from 'react-i18next';")

        if imports_to_add:
            # Add to top of file after existing imports
            # Find last import
            lines = content.split('\n')
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            
            lines.insert(last_import_idx + 1, '\n'.join(imports_to_add))
            content = '\n'.join(lines)

        # Inject hooks into the main component.
        # This is the hardest part with regex. Let's find the first functional component body.
        # Heuristic: Find `{` after the component declaration
        component_match = re.search(r'(export (?:default )?function\s+[A-Z]\w*\s*\([^)]*\)\s*\{|const\s+[A-Z]\w*\s*=\s*(?:(?:\([^)]*\))|[^=]+)\s*=>\s*\{)', content)
        if component_match:
            insert_pos = component_match.end()
            hooks = []
            if 'toast' in content and 'const { toast } = useToast()' not in content:
                hooks.append("  const { toast } = useToast();")
            if 'confirm' in content and 'const confirm = useConfirm()' not in content:
                hooks.append("  const confirm = useConfirm();")
            if 't(' in content and 'const { t } = useTranslation()' not in content:
                hooks.append("  const { t } = useTranslation();")
            
            if hooks:
                content = content[:insert_pos] + '\n' + '\n'.join(hooks) + content[insert_pos:]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Refactored: {filepath}")

for root, dirs, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))
