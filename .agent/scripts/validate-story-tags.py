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
import subprocess
import argparse

COMMENT_MAP = {
    '.ts': '//', '.tsx': '//', '.js': '//', '.jsx': '//',
    '.py': '#', '.css': '/* {} */', '.go': '//', '.java': '//'
}
EXCLUDED_EXTS = {'.json', '.yaml', '.md', '.html', '.env', '.gitignore'}

def get_modified_files():
    try:
        # Check diff against main
        diff_cmd = ["git", "diff", "--name-only", "origin/master...HEAD"]
        result = subprocess.run(diff_cmd, capture_output=True, text=True)
        files = result.stdout.splitlines()
        
        # also get uncommitted changes
        diff_cmd = ["git", "diff", "--name-only", "HEAD"]
        result = subprocess.run(diff_cmd, capture_output=True, text=True)
        files.extend(result.stdout.splitlines())
        
        untracked_cmd = ["git", "ls-files", "--others", "--exclude-standard"]
        result = subprocess.run(untracked_cmd, capture_output=True, text=True)
        files.extend(result.stdout.splitlines())
        
        return list(set(files))
    except Exception:
        return []

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--story', required=True, help='Story ID (e.g., 22.10)')
    args = parser.parse_args()
    
    tag = f"@story-{args.story}"
    files = get_modified_files()
    
    missing_files = []
    for file_path in files:
        if not os.path.exists(file_path):
            continue
        if '_iwish-output' in file_path or '.agent' in file_path:
            continue
            
        ext = os.path.splitext(file_path)[1]
        if ext in EXCLUDED_EXTS or ext not in COMMENT_MAP:
            continue
            
        with open(file_path, 'r') as f:
            content = f.read()
            
        if tag not in content:
            missing_files.append(file_path)
            
    if missing_files:
        print(f"❌ ERROR: Zero-Trust Gate Failed. The following modified files are missing the '{tag}' tag:")
        for f in missing_files:
            print(f"  - {f}")
        print("\nPlease run: python3 .agent/scripts/inject-story-tag.py")
        sys.exit(1)
        
    print("✅ Zero-Trust Gate Passed: All modified code files have story tags.")

if __name__ == "__main__":
    main()
