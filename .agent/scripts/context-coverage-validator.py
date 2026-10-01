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
import sys
import subprocess

def get_packed_files(content):
    # Repomix usually wraps files in <file path="...">
    pattern = re.compile(r'<file path="([^"]+)">')
    return set(pattern.findall(content))

def extract_links(content):
    links = []
    in_code_block = False
    for line in content.split('\n'):
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            continue
        if not in_code_block:
            # Match markdown links [text](url)
            matches = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', line)
            for text, url in matches:
                # ignore anchor links and external URLs
                if url.startswith('#') or url.startswith('http://') or url.startswith('https://'):
                    continue
                # strip fragment or query
                url = url.split('#')[0].split('?')[0]
                if url:
                    links.append(url)
    return set(links)

def is_ignored(path, base_dir):
    try:
        # Run git check-ignore
        result = subprocess.run(['git', 'check-ignore', '-q', path], cwd=base_dir)
        return result.returncode == 0
    except Exception:
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 context-coverage-validator.py <path_to_context_md>")
        sys.exit(1)
        
    context_path = os.path.abspath(sys.argv[1])
    base_dir = os.path.dirname(context_path)
    
    if not os.path.exists(context_path):
        print(f"File not found: {context_path}")
        sys.exit(1)
        
    with open(context_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    packed_files = get_packed_files(content)
    # Normalize packed files to absolute paths for comparison
    packed_abs_paths = {os.path.realpath(os.path.join(base_dir, p)) for p in packed_files}
    
    raw_links = extract_links(content)
    
    missing_valid_files = []
    
    supported_extensions = {'.md', '.txt', '.pdf', '.csv', '.json', '.yaml', '.yml'}
    
    for link in raw_links:
        # Resolve to absolute path
        abs_path = os.path.abspath(os.path.join(base_dir, link))
        # Symlink resolution
        real_path = os.path.realpath(abs_path)
        
        # Boundary Check
        if not real_path.startswith(os.path.realpath(base_dir)):
            continue # Path traversal attempt or outside repo
            
        # Packed Check
        if real_path in packed_abs_paths:
            continue
            
        # Exists and is file
        if not os.path.isfile(real_path):
            continue
            
        # Extension Check
        ext = os.path.splitext(real_path)[1].lower()
        if ext not in supported_extensions:
            continue
            
        # Size limit < 20MB
        if os.path.getsize(real_path) >= 20 * 1024 * 1024:
            continue
            
        # Gitignore Check
        if is_ignored(real_path, base_dir):
            continue
            
        missing_valid_files.append(real_path)
        
    # Deduplicate
    missing_valid_files = list(set(missing_valid_files))
    
    # Cap to 10
    if len(missing_valid_files) > 10:
        print(f"Found {len(missing_valid_files)} missing files. Capping to 10.")
        missing_valid_files = missing_valid_files[:10]
        
    for f in missing_valid_files:
        print(f)

if __name__ == '__main__':
    main()
