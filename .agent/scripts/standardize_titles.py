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

import os
import re

EPICS_DIR = '_iwish-output/3. Development/1. Epic & Story'

def standardize_file(file_path, item_type, item_id):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Standardize YAML Frontmatter Title
    # Look for title: "..." or title: ...
    frontmatter_title_pattern = re.compile(r'^(title:\s*)(["\']?)(.*?)(["\']?)$', re.MULTILINE)
    
    def title_replacer(match):
        prefix = match.group(1)
        quote1 = match.group(2)
        raw_title = match.group(3)
        quote2 = match.group(4)
        
        # Strip existing "Epic XX:" or "Story XX:" prefix
        clean_title = re.sub(rf'^{item_type}(?:-|\s+){item_id}?\s*:\s*', '', raw_title, flags=re.IGNORECASE).strip()
        # Fallback if id was different or missing
        clean_title = re.sub(rf'^{item_type}(?:-|\s+)[\d\.]+[a-zA-Z]*\s*:\s*', '', clean_title, flags=re.IGNORECASE).strip()
        
        if not clean_title:
            clean_title = raw_title
            
        new_title = f"{item_type} {item_id}: {clean_title}"
        if not quote1: quote1 = '"'
        if not quote2: quote2 = '"'
        return f"{prefix}{quote1}{new_title}{quote2}"

    new_content = frontmatter_title_pattern.sub(title_replacer, content, count=1)
    
    # 2. Standardize H1 Title
    # Look for the first H1 that might or might not have Epic/Story prefix
    h1_pattern = re.compile(r'^#\s+(.*)$', re.MULTILINE)
    
    def h1_replacer(match):
        raw_h1 = match.group(1)
        clean_h1 = re.sub(rf'^{item_type}(?:-|\s+){item_id}?\s*:\s*', '', raw_h1, flags=re.IGNORECASE).strip()
        clean_h1 = re.sub(rf'^{item_type}(?:-|\s+)[\d\.]+[a-zA-Z]*\s*:\s*', '', clean_h1, flags=re.IGNORECASE).strip()
        
        if not clean_h1:
            clean_h1 = raw_h1
            
        return f"# {item_type} {item_id}: {clean_h1}"

    # Only replace the FIRST H1
    new_content = h1_pattern.sub(h1_replacer, new_content, count=1)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    changed_epics = 0
    changed_stories = 0
    
    for root, dirs, files in os.walk(EPICS_DIR):
        dir_name = os.path.basename(root)
        
        if 'epic.md' in files and dir_name.startswith('Epic-'):
            epic_id = dir_name.replace('Epic-', '')
            if standardize_file(os.path.join(root, 'epic.md'), 'Epic', epic_id):
                changed_epics += 1
                
        if 'story.md' in files and dir_name.startswith('Story-'):
            story_id = dir_name.replace('Story-', '')
            if standardize_file(os.path.join(root, 'story.md'), 'Story', story_id):
                changed_stories += 1

    print(f"Standardized {changed_epics} epic.md files and {changed_stories} story.md files.")

if __name__ == '__main__':
    main()
