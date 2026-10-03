#!/usr/bin/env python3
# --- [Watchmen Core Injection] ---
import os, sys
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------
"""
Category A Deterministic Sync Master Code & Stale-Fork Auto-Healing Engine.
Location: .agent/scripts/sync-master-code.py
"""
import os
import sys
import subprocess
import time
from datetime import datetime

LOG_FILE = os.path.abspath(os.path.join(_agent_dir, "logs", "sync-master.log"))

def log_msg(msg):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")
    print(msg)

def run_cmd(cmd, cwd=None, check=False):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=check)

def detect_stale_ghost_fork(cwd):
    """
    Returns True if current HEAD has NO unique functional changes relative to origin/master.
    Uses Dual-Tier Evaluation:
    Tier 1: git cherry origin/master HEAD
    Tier 2: git diff origin/master...HEAD (three-dot diff for squash-merged PRs)
    """
    # Tier 1: git cherry
    cherry_res = run_cmd(["git", "cherry", "origin/master", "HEAD"], cwd=cwd)
    cherry_lines = [l.strip() for l in cherry_res.stdout.splitlines() if l.strip()]
    has_unmerged_commits = any(l.startswith("+") for l in cherry_lines)
    
    if not has_unmerged_commits:
        return True, "All branch commits matched upstream via patch-id (git cherry -)."

    # Tier 2: Diff comparison for squash-merged PRs
    # If the three-dot diff against origin/master is empty, all code changes are already on master
    diff_res = run_cmd(["git", "diff", "--quiet", "origin/master...HEAD"], cwd=cwd)
    if diff_res.returncode == 0:
        return True, "Branch diff against merge-base is completely empty (squash-merged upstream)."

    return False, "Genuine unmerged local commits detected."

def sync_master(target_dir="."):
    cwd = os.path.abspath(target_dir)

    # 0. Check inside git work tree (P1 Input Boundary)
    git_check = run_cmd(["git", "rev-parse", "--is-inside-work-tree"], cwd=cwd)
    if git_check.returncode != 0:
        log_msg(f"❌ [SYNC-MASTER] Target directory is not a Git repository: {cwd}")
        return 1

    # 1. State Transition Check (P2 Gate: mid-rebase, mid-merge, mid-bisect)
    git_dir = run_cmd(["git", "rev-parse", "--git-dir"], cwd=cwd).stdout.strip()
    mid_ops = [
        ("rebase-merge", "git rebase is currently in progress"),
        ("rebase-apply", "git rebase (apply) is currently in progress"),
        ("MERGE_HEAD", "git merge is currently in progress"),
        ("BISECT_START", "git bisect is currently in progress")
    ]
    for marker, desc in mid_ops:
        if os.path.exists(os.path.join(git_dir, marker)):
            log_msg(f"❌ [SYNC-MASTER] Illegal State Transition: {desc} in {cwd}.")
            log_msg("👉 Please resolve or abort the ongoing Git operation before running sync-master-code.")
            return 1

    # 2. Zero-Trust Working Tree Cleanliness Check (P1 Gate)
    status = run_cmd(["git", "status", "--porcelain"], cwd=cwd).stdout.strip()
    if status:
        log_msg("❌ [SYNC-MASTER] Working tree has uncommitted modifications. Aborting to avoid data loss.")
        print(status, file=sys.stderr)
        log_msg("👉 Please commit, stash, or clean up uncommitted changes before syncing.")
        return 1

    # 3. Fetch origin master with fail-closed check (P5 Gate)
    log_msg("📡 [SYNC-MASTER] Fetching latest origin/master...")
    fetch_res = run_cmd(["git", "fetch", "origin", "master"], cwd=cwd)
    if fetch_res.returncode != 0:
        log_msg(f"❌ [SYNC-MASTER] git fetch origin master failed: {fetch_res.stderr.strip()}")
        log_msg("👉 Aborting to prevent operating against stale remote tracking ref.")
        return 1

    # 4. Shallow Clone Awareness (P7 Gate)
    is_shallow = run_cmd(["git", "rev-parse", "--is-shallow-repository"], cwd=cwd).stdout.strip()
    if is_shallow == "true":
        log_msg("ℹ️ [SYNC-MASTER] Shallow clone detected. Fetching full history for merge-base accuracy...")
        run_cmd(["git", "fetch", "--unshallow", "origin", "master"], cwd=cwd)

    # 5. Check if already exactly at origin/master
    head_rev = run_cmd(["git", "rev-parse", "HEAD"], cwd=cwd).stdout.strip()
    master_rev = run_cmd(["git", "rev-parse", "origin/master"], cwd=cwd).stdout.strip()
    if head_rev == master_rev:
        log_msg("✅ [SYNC-MASTER] Worktree is already at exact HEAD of origin/master.")
        return 0

    # 6. Safety Net: Create automated backup branch (P12 Gate)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_branch = f"auto-backup-pre-init-{timestamp}"
    run_cmd(["git", "branch", backup_branch], cwd=cwd)
    log_msg(f"🛡️ [SYNC-MASTER] Automated safety net created: branch '{backup_branch}'")

    # 7. Dual-Tier Ghost Fork Pre-Flight Detection
    is_stale, reason = detect_stale_ghost_fork(cwd)
    if is_stale:
        log_msg(f"🧹 [SYNC-MASTER] Ghost fork detected: {reason}")
        log_msg("⚡ [SYNC-MASTER] Performing zero-risk auto-alignment: git reset --hard origin/master")
        run_cmd(["git", "reset", "--hard", "origin/master"], cwd=cwd, check=True)
        log_msg("✅ [SYNC-MASTER] Worktree pristine alignment complete.")
        log_msg(f"ℹ️ [SYNC-MASTER] Rollback command (if ever needed): git reset --hard {backup_branch}")
        return 0

    # 8. Attempt Linear Rebase for Genuine Local Commits
    log_msg("🔄 [SYNC-MASTER] Genuine local commits detected. Attempting git rebase origin/master...")
    rebase_res = run_cmd(["git", "rebase", "origin/master"], cwd=cwd)
    if rebase_res.returncode == 0:
        log_msg("✅ [SYNC-MASTER] Rebase completed cleanly.")
        return 0

    # 9. Rebase Conflict Encountered -> Abort & Escalate Safely
    log_msg("⚠️ [SYNC-MASTER] Rebase conflict encountered. Aborting rebase to preserve pristine state...")
    run_cmd(["git", "rebase", "--abort"], cwd=cwd)
    log_msg("🚨 [SYNC-MASTER] Genuine conflict detected between local branch and origin/master.")
    log_msg(f"ℹ️ [SYNC-MASTER] Working tree preserved. State backed up at '{backup_branch}'.")
    log_msg("👉 To manually resolve: git rebase origin/master")
    log_msg(f"👉 To discard local commits: git reset --hard origin/master")
    return 2

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(sync_master(target))
