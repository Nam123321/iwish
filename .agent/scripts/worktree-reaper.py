#!/usr/bin/env python3
"""
Worktree Reaper Daemon (Zero-Trust Self-Healing Layer 3)
Automatically reaps stale, abandoned, or expired git worktrees.
Protects active sessions with heartbeats and worktree lock states.
Archives uncommitted diffs before force removal.
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
import fcntl
import json
from datetime import datetime, timezone, timedelta

def get_repo_root():
    try:
        return subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
    except Exception:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

REPO_ROOT = get_repo_root()
WORKTREES_DIR = os.path.join(REPO_ROOT, ".worktrees")
LOCK_FILE = os.path.join(WORKTREES_DIR, ".operations.lock")
ARCHIVE_DIR = os.path.join(WORKTREES_DIR, "archive")
HEARTBEAT_FILE = os.path.join(WORKTREES_DIR, ".reaper-heartbeat")
LOG_FILE = os.path.join(WORKTREES_DIR, "reaper.log")

WARNING_HOURS = 24
SOFT_LIMIT_HOURS = 48
HARD_LIMIT_HOURS = 72
ACTIVE_GRACE_MINUTES = 30

sys.path.insert(0, os.path.join(REPO_ROOT, ".agent", "scripts"))
import importlib.util
spec = importlib.util.spec_from_file_location("worktree_registry", os.path.join(REPO_ROOT, ".agent", "scripts", "worktree-registry.py"))
registry = importlib.util.module_from_spec(spec)
spec.loader.exec_module(registry)

def log_reaper(msg):
    now_str = datetime.now(timezone.utc).isoformat()
    entry = f"[{now_str}] {msg}"
    print(entry)
    os.makedirs(WORKTREES_DIR, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry + "\n")

def get_git_worktrees():
    try:
        out = subprocess.check_output(["git", "worktree", "list", "--porcelain"], text=True, cwd=REPO_ROOT)
    except Exception:
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

def parse_iso(iso_str):
    if not iso_str:
        return None
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except Exception:
        return None

def reap():
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    now = datetime.now(timezone.utc)
    
    # Touch heartbeat file for liveness monitoring
    with open(HEARTBEAT_FILE, "w") as f:
        f.write(now.isoformat())

    fd = open(LOCK_FILE, "w+")
    fcntl.flock(fd, fcntl.LOCK_EX)

    try:
        git_wts = get_git_worktrees()
        reg_map = {r["path"]: r for r in registry.list_worktrees()}

        for wt in git_wts:
            path = wt["path"]
            branch = wt.get("branch", "unknown")
            is_locked = wt.get("locked", False)

            # Check if this is an internal subagent path
            is_subagent = "/.system_generated/" in path or ".gemini" in path

            reg_info = reg_map.get(path, {})
            created_at = parse_iso(reg_info.get("created_at"))
            last_active_at = parse_iso(reg_info.get("last_active_at"))

            # Fallback to filesystem stat if not in registry
            if not created_at and os.path.exists(path):
                mtime = os.path.getmtime(path)
                created_at = datetime.fromtimestamp(mtime, tz=timezone.utc)

            age_hours = (now - created_at).total_seconds() / 3600.0 if created_at else 0.0
            mins_since_active = (now - last_active_at).total_seconds() / 60.0 if last_active_at else 999999.0

            # Rule 1: Skip if explicitly locked
            if is_locked or reg_info.get("locked"):
                log_reaper(f"SKIP (LOCKED): '{path}' is explicitly locked.")
                continue

            # Rule 2: Skip if active heartbeat within grace window
            if mins_since_active < ACTIVE_GRACE_MINUTES:
                log_reaper(f"SKIP (ACTIVE HEARTBEAT): '{path}' was active {mins_since_active:.1f} mins ago.")
                continue

            # Check for uncommitted changes
            dirty_count = 0
            if os.path.exists(path):
                try:
                    st = subprocess.check_output(["git", "-C", path, "status", "--porcelain"], text=True)
                    dirty_count = len([l for l in st.strip().split("\n") if l and not l.startswith("??")])
                except Exception:
                    dirty_count = 0

            # Rule 3: Hard limit (> 72h) -> Force remove after archive
            if age_hours >= HARD_LIMIT_HOURS:
                log_reaper(f"HARD EXPIRY ({age_hours:.1f}h >= {HARD_LIMIT_HOURS}h): Force removing '{path}' (dirty: {dirty_count}).")
                if dirty_count > 0 and os.path.exists(path):
                    patch_name = f"{os.path.basename(path)}-{int(now.timestamp())}.patch"
                    patch_path = os.path.join(ARCHIVE_DIR, patch_name)
                    with open(patch_path, "w") as pf:
                        subprocess.run(["git", "-C", path, "diff", "HEAD"], stdout=pf)
                    log_reaper(f"Archived dirty diff to {patch_path}")

                subprocess.run(["git", "worktree", "remove", "--force", path], cwd=REPO_ROOT)
                registry.unregister_worktree(path, actor="reaper", reason="hard_limit_exceeded")
                continue

            # Rule 4: Soft limit (> 48h) + clean -> Clean remove
            if age_hours >= SOFT_LIMIT_HOURS:
                if dirty_count == 0:
                    log_reaper(f"SOFT EXPIRY ({age_hours:.1f}h >= {SOFT_LIMIT_HOURS}h): Removing clean worktree '{path}'.")
                    subprocess.run(["git", "worktree", "remove", path], cwd=REPO_ROOT)
                    registry.unregister_worktree(path, actor="reaper", reason="soft_limit_clean")
                else:
                    log_reaper(f"WARNING: Worktree '{path}' is {age_hours:.1f}h old but has {dirty_count} uncommitted changes. Grace period active.")
                continue

            # Rule 5: Subagent cleanup if parent conversation inactive
            if is_subagent and age_hours >= 4.0 and mins_since_active >= 60.0:
                log_reaper(f"SUBAGENT CLEANUP: Removing stale subagent worktree '{path}' (age: {age_hours:.1f}h).")
                subprocess.run(["git", "worktree", "remove", "--force", path], cwd=REPO_ROOT)
                registry.unregister_worktree(path, actor="reaper", reason="subagent_stale")
                continue

            if age_hours >= WARNING_HOURS:
                log_reaper(f"NOTICE: Worktree '{path}' has been active for {age_hours:.1f}h.")

        # Prune all dangling worktree metadata
        subprocess.run(["git", "worktree", "prune"], cwd=REPO_ROOT)

    finally:
        fcntl.flock(fd, fcntl.LOCK_UN)
        fd.close()

if __name__ == "__main__":
    reap()
