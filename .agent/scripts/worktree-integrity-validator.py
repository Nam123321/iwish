#!/usr/bin/env python3
"""
Zero-Trust Worktree Integrity Validator
Performs bidirectional reconciliation between Git Worktree state and SQLite Registry.
Detects Orphans, Ghosts, Stale Merged Branches, and Over-Quota violations.
"""

import os
import sys
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
import subprocess
import json
from datetime import datetime, timezone

def get_repo_root():
    try:
        return subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
    except Exception:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

REPO_ROOT = get_repo_root()
MAX_ACTIVE_WORKTREES = 5

sys.path.insert(0, os.path.join(REPO_ROOT, ".agent", "scripts"))
import importlib
try:
    registry_module = importlib.import_module("worktree-registry")
except Exception:
    import importlib.util
    spec = importlib.util.spec_from_file_location("worktree_registry", os.path.join(REPO_ROOT, ".agent", "scripts", "worktree-registry.py"))
    registry_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(registry_module)

def get_git_worktrees():
    try:
        out = subprocess.check_output(["git", "worktree", "list", "--porcelain"], text=True, cwd=REPO_ROOT)
    except Exception as e:
        print(f"Error reading git worktrees: {e}")
        return []
    
    worktrees = []
    current = {}
    for line in out.strip().split("\n"):
        if line.startswith("worktree "):
            current = {"path": os.path.abspath(line[9:].strip())}
        elif line.startswith("branch "):
            current["branch"] = line[7:].strip().replace("refs/heads/", "")
        elif line.startswith("locked"):
            current["locked"] = True
        elif line == "":
            if current and current.get("path") != REPO_ROOT:
                worktrees.append(current)
            current = {}
    if current and current.get("path") != REPO_ROOT:
        worktrees.append(current)
    return worktrees

def is_branch_merged(branch):
    if not branch or branch == "HEAD":
        return False
    try:
        out = subprocess.check_output(["git", "branch", "--merged", "master", "--list", branch], text=True, cwd=REPO_ROOT).strip()
        return bool(out)
    except Exception:
        return False

def validate(fix=False):
    git_wts = get_git_worktrees()
    reg_wts = registry_module.list_worktrees()
    
    git_map = {wt["path"]: wt for wt in git_wts}
    reg_map = {r["path"]: r for r in reg_wts}
    
    issues = []
    actions = []
    
    # 1. Check for Orphans (in git, not in SQLite registry)
    for path, wt in git_map.items():
        # Exclude internal subagent paths from hard error, but keep track
        is_subagent = "/.system_generated/" in path or ".gemini" in path
        if path not in reg_map:
            branch = wt.get("branch", "unknown")
            issues.append(f"ORPHAN WORKTREE: '{path}' (branch: {branch}) is in Git but missing from SQLite registry.")
            if fix:
                registry_module.register_worktree(path, branch, session_id="auto-healed", ttl_hours=48)
                actions.append(f"Auto-registered orphan worktree: {path}")

    # 2. Check for Ghosts (in SQLite registry, not in git or not on disk)
    for path, r in reg_map.items():
        if path not in git_map or not os.path.exists(path):
            issues.append(f"GHOST WORKTREE: '{path}' is registered in SQLite but absent from filesystem/git.")
            if fix:
                registry_module.unregister_worktree(path, actor="validator-heal", reason="ghost_entry")
                actions.append(f"Auto-removed ghost entry: {path}")

    # 3. Check for Stale Merged Branches
    for path, wt in git_map.items():
        branch = wt.get("branch")
        if branch and is_branch_merged(branch):
            issues.append(f"STALE WORKTREE: '{path}' (branch: {branch}) is already merged into master.")

    # 4. Check for Over-Quota
    user_wts = [wt for wt in git_wts if not ("/.system_generated/" in wt["path"] or ".gemini" in wt["path"])]
    if len(user_wts) > MAX_ACTIVE_WORKTREES:
        issues.append(f"OVER-QUOTA: {len(user_wts)} active worktrees exceeds limit ({MAX_ACTIVE_WORKTREES}).")

    # Report Output
    print("=" * 70)
    print("  🔍 WORKTREE INTEGRITY AUDIT REPORT")
    print("=" * 70)
    print(f"Active Git Worktrees: {len(git_wts)} (User: {len(user_wts)}, Subagents: {len(git_wts) - len(user_wts)})")
    print(f"Registered in SQLite: {len(reg_wts)}")
    print("-" * 70)

    if not issues:
        print("✅ WORKTREE INTEGRITY: 100% HEALTHY (Zero Drift Detected)")
        print("=" * 70)
        return 0
    else:
        print(f"⚠️  DISCREPANCIES DETECTED ({len(issues)} issue(s)):")
        for iss in issues:
            print(f"   ❌ {iss}")
        
        if actions:
            print("\n🛠️  HEALING ACTIONS APPLIED:")
            for act in actions:
                print(f"   ✨ {act}")

        print("=" * 70)
        return 1 if not fix else 0

if __name__ == "__main__":
    auto_fix = "--fix" in sys.argv
    res = validate(fix=auto_fix)
    sys.exit(res)
