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
Category A Deterministic Worktree-to-Root Synchronizer.
Safely synchronizes code, skills, and configuration files from the active worktree
to the root workspace and master branch without violating Git Ref Modification rules.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

DEFAULT_ROOT = Path("{project-root}").resolve()


def get_git_common_dir() -> Path:
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--git-common-dir"],
            capture_output=True, text=True, check=True
        )
        common_git = Path(res.stdout.strip()).resolve()
        return common_git.parent
    except Exception:
        return DEFAULT_ROOT


def get_active_worktree_for_branch(branch_name: str) -> Path | None:
    try:
        res = subprocess.run(
            ["git", "worktree", "list", "--porcelain"],
            capture_output=True, text=True, check=True
        )
        lines = res.stdout.strip().split("\n")
        current_wt = None
        for line in lines:
            if line.startswith("worktree "):
                current_wt = Path(line.split("worktree ")[1].strip()).resolve()
            elif line.startswith("branch refs/heads/"):
                branch = line.split("branch refs/heads/")[1].strip()
                if branch == branch_name:
                    return current_wt
    except Exception:
        pass
    return None


def copy_file_safe(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        try:
            os.chmod(dst, 0o644)
        except Exception:
            pass
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dst)


def sync_files(files: list[str], src_root: Path, dst_root: Path) -> list[str]:
    synced = []
    for rel in files:
        src = src_root / rel
        dst = dst_root / rel
        if src.exists():
            copy_file_safe(src, dst)
            synced.append(rel)
    return synced


def main() -> int:
    parser = argparse.ArgumentParser(description="Safely sync worktree changes to root repo and master")
    parser.add_argument("--files", nargs="*", help="Specific relative paths to sync (or all recent changes if omitted)")
    parser.add_argument("--commit-msg", default="chore(sync): synchronize updates from worktree to master", help="Git commit message for master")
    parser.add_argument("--no-commit", action="store_true", help="Only copy files, do not commit in root")
    parser.add_argument("--push", action="store_true", help="Push master to remote origin after commit")
    args = parser.parse_args()

    worktree_root = Path.cwd().resolve()
    root_repo = get_git_common_dir()

    if worktree_root == root_repo:
        print(json.dumps({
            "status": "ABORT",
            "message": "Current directory is already the root repository. No sync needed."
        }, indent=2))
        return 0

    # 1. Hygiene sweep in current worktree
    janitor_script = worktree_root / ".agent" / "scripts" / "workspace-janitor.py"
    if janitor_script.exists():
        subprocess.run(["python3", str(janitor_script), "--auto-clean", "--enforce-structure"], capture_output=True)

    # 2. Determine files to sync
    files_to_sync = args.files
    if not files_to_sync:
        # Check files modified in recent commit or staged
        cmd = ["git", "diff", "--name-only", "HEAD~1...HEAD"]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            files_to_sync = [f.strip() for f in res.stdout.strip().split("\n") if f.strip()]
        except Exception:
            files_to_sync = []

        # Also add untracked or modified files in .agent/
        status_res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        for line in status_res.stdout.strip().split("\n"):
            if len(line) > 3:
                f_path = line[3:].strip()
                if f_path.startswith(".agent/") or f_path.startswith("docs/"):
                    if f_path not in files_to_sync:
                        files_to_sync.append(f_path)

    # Filter out blacklisted or ephemeral paths
    valid_files = []
    for f in files_to_sync:
        if f.startswith("_iwish-output") or f.startswith(".git") or f.endswith(".pyc") or f.endswith(".tmp"):
            continue
        valid_files.append(f)

    if not valid_files:
        print(json.dumps({"status": "NOOP", "message": "No valid files to sync."}, indent=2))
        return 0

    # 3. Copy files to root repository safely
    synced_files = sync_files(valid_files, worktree_root, root_repo)

    # 4. Check active master worktree location
    master_wt = get_active_worktree_for_branch("master")
    commit_sha = None

    if not args.no_commit and master_wt and master_wt == root_repo:
        # Stage the specific synced files in root
        stage_cmd = ["git", "-C", str(root_repo), "add"] + synced_files
        subprocess.run(stage_cmd, capture_output=True, text=True, check=True)

        # Check if there are staged changes
        diff_staged = subprocess.run(
            ["git", "-C", str(root_repo), "diff", "--cached", "--quiet"],
            capture_output=True
        )
        if diff_staged.returncode != 0:
            commit_cmd = ["git", "-C", str(root_repo), "commit", "-m", args.commit_msg]
            commit_res = subprocess.run(commit_cmd, capture_output=True, text=True)
            if commit_res.returncode == 0:
                rev_res = subprocess.run(
                    ["git", "-C", str(root_repo), "rev-parse", "HEAD"],
                    capture_output=True, text=True
                )
                commit_sha = rev_res.stdout.strip()

        if args.push:
            subprocess.run(["git", "-C", str(root_repo), "push", "origin", "master"], capture_output=True)

    report = {
        "status": "SUCCESS",
        "synced_files_count": len(synced_files),
        "synced_files": synced_files,
        "source_worktree": str(worktree_root),
        "target_root": str(root_repo),
        "master_commit": commit_sha,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
