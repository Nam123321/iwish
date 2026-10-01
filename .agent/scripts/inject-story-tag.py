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

COMMENT_MAP = {
    '.ts': '//', '.tsx': '//', '.js': '//', '.jsx': '//',
    '.py': '#', '.css': '/* {} */', '.go': '//', '.java': '//'
}
EXCLUDED_EXTS = {'.json', '.yaml', '.md', '.html', '.env', '.gitignore'}

def get_modified_files():
    try:
        # Get files modified in the current branch compared to main
        # But if we just completed a task, maybe git diff --name-only HEAD~1 ?
        # Or better: untracked + modified in working directory, AND files in current branch diff to main
        # For simplicity, let's just get everything that git considers changed relative to main.
        # Wait, dev-agent runs this after a task. Just get all files in `git diff origin/master...HEAD --name-only` + `git ls-files --others --exclude-standard`
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
    if len(sys.argv) > 1:
        story_id = sys.argv[1]
    else:
        # Try to infer from branch
        branch_cmd = ["git", "branch", "--show-current"]
        branch = subprocess.run(branch_cmd, capture_output=True, text=True).stdout.strip()
        match = re.search(r'story-(\d+\.\d+)', branch)
        if match:
            story_id = match.group(1)
        else:
            print("Usage: python3 inject-story-tag.py <story_id>")
            sys.exit(1)
            
    tag = f"@story-{story_id}"
    files = get_modified_files()
    
    injected_count = 0
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
            
        if tag in content:
            continue
            
        comment_syntax = COMMENT_MAP[ext]
        if '{}' in comment_syntax:
            tag_line = comment_syntax.format(tag) + "\n"
        else:
            tag_line = f"{comment_syntax} {tag}\n"
            
        with open(file_path, 'w') as f:
            f.write(tag_line + content)
        print(f"Injected {tag} into {file_path}")
        injected_count += 1
        
    print(f"Done. Injected tags into {injected_count} files.")

if __name__ == "__main__":
    main()
