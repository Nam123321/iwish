#!/usr/bin/env python3
import os
import re
import yaml
import sys

def main():
    base_dir = "_iwish-output/3. Development/1. Epic & Story"
    yaml_file = "_iwish-output/3. Development/sprint-status.yaml"
    
    if not os.path.exists(base_dir):
        print(f"Error: Base directory {base_dir} does not exist.")
        sys.exit(1)
        
    if not os.path.exists(yaml_file):
        print(f"Error: YAML file {yaml_file} does not exist.")
        sys.exit(1)
        
    # Count physical story files
    physical_count = 0
    for root, dirs, files in os.walk(base_dir):
        for dir_name in dirs:
            if dir_name.startswith('Story-'):
                match = re.match(r'Story-(\d+)\.(\d+)', dir_name)
                if match:
                    story_file = os.path.join(root, dir_name, 'story.md')
                    if os.path.exists(story_file):
                        physical_count += 1
    
    # Read YAML
    yaml_count = 0
    pattern = re.compile(r'^\s*"Story (\d+\.\d+)[^"]*":')
    with open(yaml_file, 'r', encoding='utf-8') as f:
        for line in f:
            if pattern.search(line):
                yaml_count += 1
                
    if physical_count != yaml_count:
        print(f"FAIL: Physical stories ({physical_count}) != YAML stories ({yaml_count})")
        print("ACTION REQUIRED: Run `/sprint-planning` to rebuild index entirely.")
        sys.exit(1)
        
    print(f"PASS: Structural integrity check passed. {yaml_count} stories matched.")
    sys.exit(0)

if __name__ == "__main__":
    main()
