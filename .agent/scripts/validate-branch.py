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
import subprocess
import re
import os
import yaml
import glob
import json
import hashlib
from datetime import datetime

def run_cmd(cmd, check=True):
    try:
        result = subprocess.run(cmd, check=check, text=True, capture_output=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"FATAL: Command '{' '.join(cmd)}' failed with error: {e.stderr.strip()}")
        if check:
            sys.exit(1)
        return ""

def get_default_branch():
    """EC-P7: Dynamically detect main or master."""
    out = run_cmd(['git', 'remote', 'show', 'origin'], check=False)
    match = re.search(r'HEAD branch:\s*(.+)', out)
    if match:
        return match.group(1)
    
    branches = run_cmd(['git', 'branch', '--list']).split('\n')
    branches = [b.strip('* ').strip() for b in branches]
    if 'main' in branches:
        return 'main'
    return 'master'

def check_dirty_state(is_plan=False):
    status = run_cmd(['git', 'status', '--porcelain'])
    if not status:
        return # Clean state

    diff_head = run_cmd(['git', 'diff', 'HEAD'], check=False)
    if '<<<<<<<' in diff_head:
        if is_plan:
            return "Conflict markers detected in dirty state."
        print("FATAL: HALT_AND_WAIT_FOR_HUMAN. Conflict markers detected in dirty state. Cannot auto-commit safely.")
        sys.exit(1)
    
    if 'U ' in status or ' U' in status or 'UU' in status:
        if is_plan:
            return "Unmerged files detected in dirty state."
        print("FATAL: HALT_AND_WAIT_FOR_HUMAN. Unmerged files detected in dirty state. Cannot auto-commit safely.")
        sys.exit(1)

    if not is_plan:
        print("FATAL: HALT_AND_WAIT_FOR_HUMAN. Workspace has uncommitted changes.")
        print("Please commit or stash manually before running validate-branch.py.")
        sys.exit(1)
    return "Dirty state detected."

def parse_story_yaml(story_id):
    search_pattern = f"_iwish-output/**/Story-{story_id}/story.md"
    matches = glob.glob(search_pattern, recursive=True)
    if not matches:
        return []
    story_path = matches[0]
    try:
        with open(story_path, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
            if match:
                data = yaml.safe_load(match.group(1))
                return data.get('depends_on', [])
            return []
    except Exception:
        return []

def ensure_branch_exists(branch_name):
    exists = run_cmd(['git', 'branch', '--list', branch_name])
    if not exists:
        exists_remote = run_cmd(['git', 'branch', '--list', '-r', f"origin/{branch_name}"])
        if not exists_remote:
            print(f"FATAL: Dependency branch {branch_name} does not exist locally or on origin.")
            sys.exit(1)
        else:
            run_cmd(['git', 'checkout', '--track', f"origin/{branch_name}"])
            run_cmd(['git', 'checkout', '-'])

def write_branch_lock(story_id, target_branch, base_branch, rule):
    lock_data = {
        "story_id": story_id,
        "target_branch": target_branch,
        "base_branch": base_branch,
        "rule": rule,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    raw_str = json.dumps(lock_data, sort_keys=True)
    sig = hashlib.sha256((raw_str + "WATCHMEN_SALT").encode()).hexdigest()
    lock_data["signature"] = sig
    
    os.makedirs(".agent/cache/spec-locks", exist_ok=True)
    lock_file = f".agent/cache/spec-locks/branch-lock-{story_id}.json.sig"
    with open(lock_file, "w") as f:
        json.dump(lock_data, f, indent=2)
    print(f"🔒 Watchmen Branch Lock generated: {lock_file}")

def preflight_worktree_check(target_branch):
    """P13: Prevent checkout to branch active in another worktree."""
    worktrees = run_cmd(['git', 'worktree', 'list', '--porcelain'], check=False)
    active = re.findall(r'branch refs/heads/(.+)', worktrees)
    if target_branch.replace('feature/', '') in [b.replace('feature/', '') for b in active]:
        current = run_cmd(['git', 'branch', '--show-current'])
        if current != target_branch:
            print(f"FATAL: Branch '{target_branch}' is active in another worktree. Cannot checkout.")
            sys.exit(1)

def check_iwish_output_safety(base_branch):
    """Prevent checkout that would delete _iwish-output files from disk."""
    current_branch = run_cmd(['git', 'branch', '--show-current'])
    if not current_branch:
        current_branch = "HEAD"
        
    def get_count(b):
        if b != "HEAD":
            if subprocess.run(['git', 'rev-parse', '--verify', '--quiet', b], capture_output=True).returncode != 0:
                return 0
        out = run_cmd(['git', 'ls-tree', '-r', '--name-only', b, '--', '_iwish-output/'], check=False).strip()
        return out.count('\n') + 1 if out else 0
        
    current_count = get_count(current_branch)
    base_count = get_count(base_branch)
    
    if current_count > 0 and base_count == 0:
        print(f"FATAL: HALT. Checkout from {current_branch} to {base_branch} would DELETE {current_count} _iwish-output files from disk!")
        print("Run 'git rm -r --cached _iwish-output/' on current branch first.")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-branch.py <story_id> [--plan]")
        sys.exit(1)
    
    story_id = sys.argv[1]
    is_plan = len(sys.argv) > 2 and sys.argv[2] == '--plan'
    
    if not re.match(r'^\d+\.\d+[a-z]?$', story_id):
        print(f"FATAL: Invalid story_id '{story_id}'. Must be format 'N.M' (e.g., 22.11)")
        sys.exit(1)
        
    target_branch = f"feature/story-{story_id}"
    epic_id = story_id.split('.')[0]
    
    run_cmd(['git', 'fetch', 'origin'], check=False)
    current_branch = run_cmd(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    
    dirty_state_msg = check_dirty_state(is_plan=is_plan)
    
    depends_on = parse_story_yaml(story_id)
    default_branch = get_default_branch()
    
    rule = ""
    base_branch = ""
    
    if isinstance(depends_on, list) and len(depends_on) > 1:
        rule = f"T2.5: Multi-Dependency {depends_on}"
        base_branch = default_branch
    elif isinstance(depends_on, list) and len(depends_on) == 1:
        rule = f"T2: Explicit Dependency on feature/story-{depends_on[0]}"
        base_branch = f"feature/story-{depends_on[0]}"
    else:
        current_epic_match = re.search(r'feature/story-([0-9]+)\.', current_branch)
        current_epic = current_epic_match.group(1) if current_epic_match else None
        if current_epic == epic_id:
            rule = f"T1: Same Epic Inheritance ({epic_id})"
            base_branch = current_branch
        else:
            rule = "T3: Independent Baseline"
            base_branch = default_branch

    if is_plan:
        plan_output = {
            "story_id": story_id,
            "target_branch": target_branch,
            "evaluated_base_branch": base_branch,
            "routing_rule": rule,
            "dirty_state_status": dirty_state_msg or "Clean"
        }
        print(json.dumps(plan_output, indent=2))
        sys.exit(0)

    if current_branch == target_branch:
        print(f"✅ [PROVEN_SAFE] Already on '{target_branch}'.")
        write_branch_lock(story_id, target_branch, base_branch, rule)
        sys.exit(0)

    print(f"Routing Rule: {rule}")
    
    preflight_worktree_check(target_branch)
    check_iwish_output_safety(base_branch)
    
    target_exists = (subprocess.run(['git', 'rev-parse', '--verify', '--quiet', target_branch], capture_output=True).returncode == 0)
    
    if "T2.5" in rule:
        if target_exists:
            run_cmd(['git', 'checkout', target_branch])
        else:
            run_cmd(['git', 'checkout', '-b', target_branch, base_branch])
        for dep in depends_on:
            ensure_branch_exists(f"feature/story-{dep}")
        for dep in depends_on:
            dep_branch = f"feature/story-{dep}"
            print(f"Attempting Octopus merge for {dep_branch}...")
            try:
                subprocess.run(['git', 'merge', dep_branch, '--no-edit'], check=True, text=True, capture_output=True)
            except subprocess.CalledProcessError:
                print(f"FATAL: Conflict while merging {dep_branch}. Aborting merge.")
                run_cmd(['git', 'merge', '--abort'], check=False)
                sys.exit(1)
    else:
        if "T2:" in rule:
            ensure_branch_exists(base_branch)
        if target_exists:
            run_cmd(['git', 'checkout', target_branch])
        else:
            run_cmd(['git', 'checkout', '-b', target_branch, base_branch])
        
    print(f"✅ [PROVEN_SAFE] Branch created: {target_branch} from {base_branch}.")
    write_branch_lock(story_id, target_branch, base_branch, rule)
    sys.exit(0)

if __name__ == "__main__":
    main()
