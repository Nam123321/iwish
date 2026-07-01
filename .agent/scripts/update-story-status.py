#!/usr/bin/env python3
import os
import sys
import yaml
import re

def update_status(filepath, new_status):
    if not os.path.exists(filepath):
        print(f"Error: File not found: {filepath}")
        sys.exit(1)
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match OKF frontmatter
    fm_match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not fm_match:
        print(f"Error: No YAML frontmatter found in {filepath}")
        sys.exit(1)
        
    fm_str = fm_match.group(1)
    body_str = fm_match.group(2)
    
    try:
        fm_data = yaml.safe_load(fm_str)
        if not isinstance(fm_data, dict):
            fm_data = {}
    except yaml.YAMLError as e:
        print(f"Error parsing YAML frontmatter: {e}")
        sys.exit(1)
        
    fm_data['status'] = new_status
    
    # Dump it back preserving order as much as possible, or at least cleanly
    new_fm_str = yaml.dump(fm_data, sort_keys=False, allow_unicode=True, default_flow_style=False)
    
    new_content = f"---\n{new_fm_str}---\n{body_str}"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Successfully updated status to '{new_status}' in {filepath}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 update-story-status.py <path_to_story.md> <new_status>")
        sys.exit(1)
        
    story_path = sys.argv[1]
    status = sys.argv[2]
    update_status(story_path, status)
