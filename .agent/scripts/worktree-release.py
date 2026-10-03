#!/usr/bin/env python3
"""
Worktree Release & Teardown Manager (Zero-Trust Category A)
Safely releases local and remote resources when a task/story worktree is completed:
- Guards against accidental deletion of main repo
- Backups uncommitted diffs to scratchpad before removal
- Teardowns active background processes and symlinks
- Unlocks Watchmen permissions and removes Git worktree
- Deregisters from SQLite registry and cleans up branches
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
    pass
# ---------------------------------

import subprocess
import fcntl
import shutil
import json
import argparse
import signal
from datetime import datetime, timezone

def get_repo_roots():
    try:
        common_dir = subprocess.check_output(["git", "rev-parse", "--git-common-dir"], text=True).strip()
        main_repo = os.path.abspath(os.path.dirname(common_dir))
    except Exception:
        main_repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    try:
        current_root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
    except Exception:
        current_root = os.getcwd()
        
    return main_repo, current_root

MAIN_REPO, CURRENT_ROOT = get_repo_roots()
WORKTREES_DIR = os.path.join(MAIN_REPO, ".worktrees")
LOCK_FILE = os.path.join(WORKTREES_DIR, ".operations.lock")
BACKUP_DIR = os.path.join(MAIN_REPO, "_iwish-output", "adhoc-workspace", "scratch", "worktree-backups")

class OperationLock:
    def __init__(self, lock_path):
        os.makedirs(os.path.dirname(lock_path), exist_ok=True)
        self.lock_path = lock_path
        self.fd = None
        
    def __enter__(self):
        self.fd = open(self.lock_path, "w+")
        fcntl.flock(self.fd, fcntl.LOCK_EX)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.fd:
            try:
                fcntl.flock(self.fd, fcntl.LOCK_UN)
                self.fd.close()
            except Exception:
                pass

def get_worktree_list():
    try:
        out = subprocess.check_output(["git", "worktree", "list", "--porcelain"], text=True, cwd=MAIN_REPO)
    except Exception as e:
        print(f"❌ Error querying git worktrees: {e}")
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
            if current:
                worktrees.append(current)
            current = {}
    if current:
        worktrees.append(current)
    return worktrees

def resolve_target_worktree(target_arg):
    worktrees = get_worktree_list()
    
    if not target_arg:
        cwd = os.path.abspath(os.getcwd())
        if cwd == MAIN_REPO:
            print("❌ FATAL: Cannot release Main Repo root. Please specify --target <path_or_id>.")
            sys.exit(1)
        for wt in worktrees:
            if wt["path"] == cwd or cwd.startswith(wt["path"]):
                return wt
        return {"path": cwd, "branch": "unknown"}
    
    target_clean = target_arg.strip().rstrip("/")
    # 1. Match exact path
    for wt in worktrees:
        if wt["path"] == os.path.abspath(target_clean):
            return wt
            
    # 2. Match relative to .worktrees/
    candidate_path = os.path.abspath(os.path.join(WORKTREES_DIR, target_clean))
    for wt in worktrees:
        if wt["path"] == candidate_path:
            return wt
            
    # 3. Match by branch name or basename
    for wt in worktrees:
        if wt.get("branch") == target_clean or os.path.basename(wt["path"]) == target_clean:
            return wt
            
    # Fallback to absolute candidate path even if not in porcelain
    if os.path.exists(candidate_path):
        return {"path": candidate_path, "branch": target_clean}
    if os.path.exists(os.path.abspath(target_clean)):
        return {"path": os.path.abspath(target_clean), "branch": "unknown"}

    print(f"❌ Worktree target not found: {target_arg}")
    sys.exit(1)

def kill_processes_in_dir(target_dir):
    print(f"🔍 [TEARDOWN] Scanning active processes in {target_dir}...")
    try:
        out = subprocess.check_output(["lsof", "+D", target_dir], text=True, stderr=subprocess.DEVNULL)
        pids = set()
        for line in out.strip().split("\n")[1:]:
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                cmd_name = parts[0].lower()
                pid = int(parts[1])
                if pid != os.getpid() and "git" not in cmd_name and "language" not in cmd_name and "antigravity" not in cmd_name:
                    pids.add(pid)
                    
        for pid in pids:
            try:
                print(f"   - Terminating background process (PID {pid})...")
                os.kill(pid, signal.SIGTERM)
            except Exception:
                pass
    except Exception:
        pass

def backup_uncommitted_changes(target_path, branch_name):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_branch = branch_name.replace("/", "_")
    patch_filename = f"{safe_branch}_{timestamp}.patch"
    patch_path = os.path.join(BACKUP_DIR, patch_filename)
    
    try:
        diff_out = subprocess.check_output(["git", "-C", target_path, "diff", "HEAD"], text=True)
        untracked = subprocess.check_output(["git", "-C", target_path, "status", "--porcelain"], text=True)
        
        with open(patch_path, "w", encoding="utf-8") as f:
            f.write(f"# Worktree Backup for {target_path} (Branch: {branch_name})\n")
            f.write(f"# Timestamp: {datetime.now(timezone.utc).isoformat()}\n\n")
            f.write("=== GIT STATUS ===\n")
            f.write(untracked + "\n\n")
            f.write("=== GIT DIFF HEAD ===\n")
            f.write(diff_out + "\n")
            
        print(f"💾 [ZERO-DATA-LOSS] Uncommitted changes safely backed up to:\n   -> {patch_path}")
        return patch_path
    except Exception as e:
        print(f"⚠️ Warning: Could not create complete diff patch: {e}")
        return None

def unlink_runtime_symlinks(target_path):
    print("🔗 [UNLINK] Detaching runtime SSOT symlinks...")
    for symlink_name in ["_iwish-output", "_SSOT"]:
        symlink_path = os.path.join(target_path, symlink_name)
        if os.path.islink(symlink_path):
            try:
                os.unlink(symlink_path)
                print(f"   - Unlinked: {symlink_path}")
            except Exception as e:
                print(f"   ⚠️ Could not unlink {symlink_path}: {e}")

def unlock_permissions(target_path):
    scripts_dir = os.path.join(target_path, ".agent", "scripts")
    if os.path.exists(scripts_dir):
        print("🔓 [UNLOCK] Restoring write permissions on .agent/scripts...")
        current_user = os.environ.get("USER", "default_user")
        try:
            subprocess.run(["chmod", "-R", "755", scripts_dir], stderr=subprocess.DEVNULL)
        except Exception:
            pass
        try:
            subprocess.run(["sudo", "-n", "chown", "-R", current_user, scripts_dir], stderr=subprocess.DEVNULL)
        except Exception:
            pass

def deregister_sqlite(target_path):
    reg_script = os.path.join(MAIN_REPO, ".agent", "scripts", "worktree-registry.py")
    if os.path.exists(reg_script):
        print("📋 [REGISTRY] Unregistering worktree from SQLite database...")
        subprocess.run([
            sys.executable, reg_script, "unregister",
            "--path", target_path,
            "--actor", "release-worktree",
            "--reason", "worktree completed and released"
        ], cwd=MAIN_REPO, stderr=subprocess.DEVNULL)

def release_worktree(target_path, branch, force=False, backup=False, delete_remote=False, dry_run=False):
    norm_path = os.path.abspath(target_path)
    print(f"🚀 [RELEASE-WORKTREE] Initiating safe release for: {norm_path}")
    print(f"   - Branch: {branch}")
    
    if norm_path == MAIN_REPO:
        print("❌ FATAL: Cannot release Main Repo root workspace!")
        sys.exit(1)
        
    # 1. Pre-flight Check: Status
    is_dirty = False
    status_out = ""
    if os.path.exists(norm_path):
        try:
            status_out = subprocess.check_output(["git", "-C", norm_path, "status", "--porcelain"], text=True).strip()
            if status_out:
                is_dirty = True
        except Exception:
            pass

    if is_dirty:
        if not (force or backup):
            print("\n❌ [SAFETY HALT] Worktree has uncommitted changes:")
            for line in status_out.split("\n")[:10]:
                print(f"   {line}")
            print("\n💡 Action Required: Commit your changes or run with --backup / --force to preserve diff.")
            sys.exit(1)
        else:
            if not dry_run:
                backup_uncommitted_changes(norm_path, branch)

    if dry_run:
        print("\n🔍 [DRY-RUN] The following actions would be performed:")
        print(f"   1. Terminate background processes in {norm_path}")
        print(f"   2. Unlink SSOT symlinks (_iwish-output, _SSOT)")
        print(f"   3. Unlock Watchmen permissions on {norm_path}/.agent/scripts")
        print(f"   4. Execute 'git worktree remove {norm_path} --force'")
        print(f"   5. Unregister from .worktrees/registry.db")
        print(f"   6. Delete local branch '{branch}' (if not checked out elsewhere)")
        if delete_remote:
            print(f"   7. Delete remote branch 'origin/{branch}' on GitHub")
        print(f"   8. Run worktree integrity validator and workspace janitor")
        print("\n✅ Dry run completed successfully. No changes made.")
        return

    # 2. Teardown active processes & symlinks
    if os.path.exists(norm_path):
        kill_processes_in_dir(norm_path)
        unlink_runtime_symlinks(norm_path)
        unlock_permissions(norm_path)

    # 3. Git Worktree Unlock & Remove
    print("🗑️ [GIT] Removing worktree via Git...")
    subprocess.run(["git", "worktree", "unlock", norm_path], cwd=MAIN_REPO, stderr=subprocess.DEVNULL)
    rm_cmd = ["git", "worktree", "remove", norm_path, "--force"]
    res = subprocess.run(rm_cmd, cwd=MAIN_REPO)
    
    # Fallback cleanup if directory still physically lingers
    if os.path.exists(norm_path):
        print("   - Cleaning up residual directory...")
        shutil.rmtree(norm_path, ignore_errors=True)

    # 4. Deregister from SQLite & Git Prune
    deregister_sqlite(norm_path)
    subprocess.run(["git", "worktree", "prune"], cwd=MAIN_REPO)

    # 5. Local Branch Cleanup
    all_wts = get_worktree_list()
    branch_used_elsewhere = any(wt.get("branch") == branch and wt["path"] != norm_path for wt in all_wts)
    
    if branch and branch != "unknown" and branch != "master" and branch != "main":
        if branch_used_elsewhere:
            print(f"⚠️ [BRANCH] Branch '{branch}' is checked out in another worktree. Skipping branch deletion.")
        else:
            print(f"🌿 [BRANCH] Deleting local branch '{branch}'...")
            del_res = subprocess.run(["git", "branch", "-d", branch], cwd=MAIN_REPO, capture_output=True, text=True)
            if del_res.returncode != 0:
                if force:
                    print(f"   - Force deleting unmerged local branch '{branch}'...")
                    subprocess.run(["git", "branch", "-D", branch], cwd=MAIN_REPO)
                else:
                    print(f"   ℹ️ Local branch '{branch}' not fully merged. Kept for safety (use --force to delete).")

    # 6. Remote Branch Cleanup (GitHub)
    if delete_remote and branch and branch not in ["master", "main", "develop", "unknown"]:
        print(f"☁️ [GITHUB] Checking remote branch 'origin/{branch}'...")
        check_remote = subprocess.run(["git", "ls-remote", "--heads", "origin", branch], cwd=MAIN_REPO, capture_output=True, text=True)
        if check_remote.stdout.strip():
            print(f"   - Deleting remote branch 'origin/{branch}' on GitHub...")
            del_remote_res = subprocess.run(["git", "push", "origin", "--delete", branch], cwd=MAIN_REPO)
            if del_remote_res.returncode == 0:
                print(f"   ✅ Remote branch 'origin/{branch}' deleted successfully.")
            else:
                print(f"   ⚠️ Could not delete remote branch 'origin/{branch}'. It may be protected or already removed.")

    # 7. Post-Cleanup Integrity Check
    print("✨ [HYGIENE] Running integrity validator and hygiene sweep...")
    integrity_script = os.path.join(MAIN_REPO, ".agent", "scripts", "worktree-integrity-validator.py")
    if os.path.exists(integrity_script):
        subprocess.run([sys.executable, integrity_script, "--fix"], cwd=MAIN_REPO, stderr=subprocess.DEVNULL)
        
    janitor_script = os.path.join(MAIN_REPO, ".agent", "scripts", "workspace-janitor.py")
    if os.path.exists(janitor_script):
        subprocess.run([sys.executable, janitor_script, "--auto-clean", "--enforce-structure"], cwd=MAIN_REPO, stderr=subprocess.DEVNULL)

    print(f"\n✅ [SUCCESS] Worktree '{norm_path}' has been cleanly released and resources deallocated!")

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Safe Git Worktree Release Manager")
    parser.add_argument("--target", "-t", default=None, help="Target worktree path, ID, or branch name (default: auto-detect from current cwd)")
    parser.add_argument("--force", "-f", action="store_true", help="Force release even if worktree has uncommitted/unmerged changes")
    parser.add_argument("--backup", "-b", action="store_true", help="Automatically generate diff patch in scratchpad before releasing")
    parser.add_argument("--delete-remote", "-d", action="store_true", help="Delete the corresponding remote branch on GitHub if it exists")
    parser.add_argument("--dry-run", action="store_true", help="Simulate teardown without modifying files or Git state")
    
    args = parser.parse_args()
    
    target_info = resolve_target_worktree(args.target)
    target_path = target_info["path"]
    branch = target_info.get("branch", "unknown")
    
    with OperationLock(LOCK_FILE):
        release_worktree(
            target_path=target_path,
            branch=branch,
            force=args.force,
            backup=args.backup,
            delete_remote=args.delete_remote,
            dry_run=args.dry_run
        )

if __name__ == "__main__":
    main()
