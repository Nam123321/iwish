#!/usr/bin/env python3
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

import sys
import os
import re

# Exclude list for styling frameworks (e.g., if a file is under landing page or mobile, or is a CSS file)
PORTAL_DIRS = ['src/components/', 'src/pages/', 'src/features/']
EXCLUDE_SUBSTRINGS = ['landing', 'mobile']

# Tailwind pattern matches common utility classes
TAILWIND_PATTERNS = [
    r'^bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)(/[0-9]+)?$',
    r'^bg-\[#?[0-9a-fA-F]+\]$',
    r'^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)(/[0-9]+)?$',
    r'^text-\[#?[0-9a-fA-F]+\]$',
    r'^hover:bg-',
    r'^hover:text-',
    r'^active:scale-',
    r'^rounded-(sm|md|lg|xl|2xl|3xl|full|none)$',
    r'^shadow-(sm|md|lg|xl|2xl|inner|none|2xl)$',
    r'^space-(x|y)-\d+(\.\d+)?$',
    r'^grid-cols-\d+$',
    r'^col-span-\d+$',
    r'^divide-[x-y]$',
    r'^[pm][xy]?-\d+(\.\d+)?$',
    r'^[pm][tbrl]?-\d+(\.\d+)?$',
    r'^(w|h)-(1\/|2\/|3\/|4\/|5\/|6\/|12|full|screen|auto|fit|\d+(\.\d+)?)$',
    r'^min-h-\w+$',
    r'^max-w-\w+$',
    r'^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$',
    r'^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$',
    r'^tracking-(tighter|tight|normal|wide|wider|widest)$',
    r'^leading-(none|tight|snug|normal|relaxed|loose|\d+)$',
    r'^items-(start|end|center|baseline|stretch)$',
    r'^justify-(start|end|center|between|around|evenly)$',
    r'^content-(start|end|center|between|around|evenly|stretch)$',
    r'^self-(auto|start|end|center|stretch|baseline)$',
    r'^place-(items|content|self)-(start|end|center|stretch|between|around|evenly|auto)$',
    r'^(inset|top|bottom|left|right)-\d+(\.\d+)?$',
    r'^(duration|delay|ease)-\d+$',
    r'^flex-(col|row|wrap|nowrap|1|auto|initial|none)$',
    r'^grid$',
    r'^flex$',
    r'^hidden$',
    r'^relative$',
    r'^absolute$',
    r'^fixed$',
    r'^overflow-(auto|hidden|scroll|visible)$',
    r'^border(-[tbrl])?$',
    r'^border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)$',
    r'^border-\[#?[0-9a-fA-F]+\]$',
    r'^gap-\d+(\.\d+)?$'
]

compiled_patterns = [re.compile(pat) for pat in TAILWIND_PATTERNS]

def is_tailwind_token(token):
    # Exclude standard project CSS classes and utility libraries
    if token.startswith(('cowok-', 'btn', 'input-', 'bento-', 'glass-', 'panel-', 'switch', 'theme-', 'filter-', 'active')):
        return False
    
    # Check if matches any tailwind patterns
    for pat in compiled_patterns:
        if pat.match(token):
            return True
    return False

def check_file(file_path):
    # Normalized path
    normalized_path = os.path.relpath(file_path).replace('\\', '/')
    
    # Verify path boundaries
    in_portal = any(normalized_path.startswith(d) for d in PORTAL_DIRS)
    excluded = any(sub in normalized_path for sub in EXCLUDE_SUBSTRINGS)
    
    if not in_portal or excluded:
        # Skip files outside the portal or matching exclude list (like landing/mobile)
        return []
    
    if not normalized_path.endswith(('.jsx', '.tsx', '.js', '.ts')):
        return []
        
    violations = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return []
        
    for idx, line in enumerate(lines):
        # Extract classNames from className="..." or className={`...`} or className={cn(...)}
        if 'className=' in line:
            # Match strings inside double quotes, single quotes, or backticks
            class_contents = re.findall(r'className=["\'`]([^"\'`]+)["\'`]', line)
            # Also check for curly brace arrays if any
            curly_braces = re.findall(r'className=\{([^}]+)\}', line)
            
            for content in class_contents:
                tokens = content.split()
                tailwind_tokens = [t for t in tokens if is_tailwind_token(t)]
                if tailwind_tokens:
                    violations.append({
                        'line': idx + 1,
                        'content': line.strip(),
                        'tokens': tailwind_tokens
                    })
                    
            for content in curly_braces:
                # Find all string literals inside curly braces
                literals = re.findall(r'["\'`]([^"\'`]+)["\'`]', content)
                for lit in literals:
                    tokens = lit.split()
                    tailwind_tokens = [t for t in tokens if is_tailwind_token(t)]
                    if tailwind_tokens:
                        violations.append({
                            'line': idx + 1,
                            'content': line.strip(),
                            'tokens': tailwind_tokens
                        })
                        
    return violations

def main():
    if len(sys.argv) > 1:
        # Check specific files
        files_to_check = sys.argv[1:]
    else:
        # Or scan the staged files using git
        import subprocess
        try:
            cmd = ['git', 'diff', '--cached', '--name-only']
            staged_files = subprocess.check_output(cmd).decode('utf-8').splitlines()
            # If nothing is staged, check all modified unstaged files
            if not staged_files:
                cmd = ['git', 'diff', '--name-only']
                staged_files = subprocess.check_output(cmd).decode('utf-8').splitlines()
            files_to_check = [f for f in staged_files if os.path.exists(f)]
        except Exception:
            files_to_check = []
            
    if not files_to_check:
        print("No files to validate.")
        return 0
        
    has_violations = False
    for file_path in files_to_check:
        violations = check_file(file_path)
        if violations:
            has_violations = True
            print(f"\n❌ Tailwind CSS violation in Web Portal file: {file_path}")
            for v in violations:
                print(f"  Line {v['line']}: {v['content']}")
                print(f"    Tailwind classes detected: {', '.join(v['tokens'])}")
                
    if has_violations:
        print("\nError: Tailwind CSS utility classes are strictly prohibited in the Web Portal.")
        print("Please replace them with standard custom CSS or project custom classes.")
        return 1
        
    print("Tailwind check passed successfully.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
