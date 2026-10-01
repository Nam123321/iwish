import os, sys, subprocess, fcntl, shutil
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

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKTREES_DIR = os.path.join(REPO_ROOT, ".worktrees")
LOCK_FILE = os.path.join(WORKTREES_DIR, ".operations.lock")
MAX_ACTIVE_WORKTREES = 5
MIN_FREE_DISK_GB = 5.0

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
            except Exception: pass

def check_disk_space():
    stat = shutil.disk_usage(REPO_ROOT)
    return stat.free / (1024 ** 3)

def is_branch_active_in_any_worktree(branch_name):
    """
    Zero-Trust P13 Safety Guard: Verifies in real-time whether branch is active in any worktree.
    """
    try:
        res = subprocess.run(["git", "worktree", "list", "--porcelain"], cwd=REPO_ROOT, capture_output=True, text=True)
        target_ref = f"refs/heads/{branch_name}"
        for line in res.stdout.splitlines():
            if line.startswith("branch ") and line.split(" ", 1)[1].strip() == target_ref:
                return True
    except Exception:
        pass
    return False

def run_add(args, extra_git_args):
    target_path = os.path.abspath(args.path)
    # Fetch origin master with fail-closed warning
    fetch_res = subprocess.run(["git", "fetch", "origin", "master"], cwd=REPO_ROOT, capture_output=True, text=True)
    if fetch_res.returncode != 0:
        print(f"⚠️ [WORKTREE-GUARD] Warning: git fetch origin master encountered an issue: {fetch_res.stderr.strip()}", file=sys.stderr)

    cmd = ["git", "worktree", "add", target_path]
    if args.branch: cmd.append(args.branch)
    cmd.extend(extra_git_args)

    # Automatically anchor new branches to origin/master to prevent stale local master conflicts
    if "-b" in cmd or "-B" in cmd:
        b_idx = cmd.index("-b") if "-b" in cmd else cmd.index("-B")
        if len(cmd) == b_idx + 2:
            cmd.append("origin/master")
    elif args.branch and len(extra_git_args) == 0:
        check_branch = subprocess.run(["git", "rev-parse", "--verify", args.branch], cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if check_branch.returncode != 0:
            cmd = ["git", "worktree", "add", "-b", args.branch, target_path, "origin/master"]
        else:
            # Branch exists locally: inspect upstream drift
            origin_master_res = subprocess.run(["git", "rev-parse", "origin/master"], cwd=REPO_ROOT, capture_output=True, text=True)
            if origin_master_res.returncode == 0:
                origin_master = origin_master_res.stdout.strip()
                unpushed_res = subprocess.run(["git", "rev-list", f"origin/master..{args.branch}"], cwd=REPO_ROOT, capture_output=True, text=True)
                if unpushed_res.returncode == 0:
                    unpushed = unpushed_res.stdout.strip()
                    if not unpushed:
                        # 0 unpushed commits: check P13 rule before fast-forwarding
                        if not is_branch_active_in_any_worktree(args.branch):
                            print(f"🔄 [WORKTREE-GUARD] Branch '{args.branch}' has 0 unpushed commits. Fast-forwarding to origin/master...")
                            subprocess.run(["git", "update-ref", f"refs/heads/{args.branch}", origin_master], cwd=REPO_ROOT, check=False)
                        else:
                            print(f"ℹ️ [WORKTREE-GUARD] Branch '{args.branch}' is currently checked out in another worktree. Skipping update-ref (P13 Invariant).")

    res = subprocess.run(cmd, cwd=REPO_ROOT)
    if res.returncode != 0: sys.exit(res.returncode)

    # --- ZERO-TRUST: Auto-Lock Watchmen Core on Worktree Creation ---
    print("🔒 [WORKTREE-GUARD] Applying Zero-Trust OS-level lock (root:wheel, 555) to .agent/scripts...")
    scripts_dir = os.path.join(target_path, ".agent", "scripts")
    if os.path.exists(scripts_dir):
        subprocess.run(["sudo", "chown", "-R", "root:wheel", scripts_dir], stderr=subprocess.DEVNULL)
        subprocess.run(["sudo", "chmod", "-R", "555", scripts_dir], stderr=subprocess.DEVNULL)

def run_sync(args, extra_git_args):
    target_path = os.path.abspath(args.path)
    if not os.path.exists(target_path):
        print(f"❌ Worktree path not found: {target_path}")
        sys.exit(1)
        
    print("🔓 [WORKTREE-GUARD] Unlocking .agent/scripts to allow Git Merge...")
    scripts_dir = os.path.join(target_path, ".agent", "scripts")
    current_user = os.environ.get("USER", "default_user")
    if os.path.exists(scripts_dir):
        subprocess.run(["sudo", "chown", "-R", current_user, scripts_dir], stderr=subprocess.DEVNULL)
        subprocess.run(["sudo", "chmod", "-R", "755", scripts_dir], stderr=subprocess.DEVNULL)
        
    print(f"🔄 [WORKTREE-GUARD] Fetching and merging updates from origin/master into worktree...")
    subprocess.run(["git", "-C", target_path, "fetch", "origin", "master"], stderr=subprocess.DEVNULL)
    cmd = ["git", "-C", target_path, "merge", "origin/master"] + extra_git_args
    res = subprocess.run(cmd)
    
    print("🔒 [WORKTREE-GUARD] Relocking .agent/scripts...")
    if os.path.exists(scripts_dir):
        subprocess.run(["sudo", "chown", "-R", "root:wheel", scripts_dir], stderr=subprocess.DEVNULL)
        subprocess.run(["sudo", "chmod", "-R", "555", scripts_dir], stderr=subprocess.DEVNULL)
        
    sys.exit(res.returncode)

def run_remove(args, extra_git_args):
    target_path = os.path.abspath(args.path)
    # --- ZERO-TRUST: Auto-Unlock before Git Remove ---
    print("🔓 [WORKTREE-GUARD] Unlocking Zero-Trust OS-level lock to allow Git to clean up...")
    scripts_dir = os.path.join(target_path, ".agent", "scripts")
    current_user = os.environ.get("USER", "default_user")
    if os.path.exists(scripts_dir):
        subprocess.run(["sudo", "chown", "-R", current_user, scripts_dir], stderr=subprocess.DEVNULL)
        subprocess.run(["sudo", "chmod", "-R", "755", scripts_dir], stderr=subprocess.DEVNULL)
        
    subprocess.run(["git", "worktree", "unlock", target_path], cwd=REPO_ROOT, stderr=subprocess.DEVNULL)
    cmd = ["git", "worktree", "remove", target_path] + extra_git_args
    res = subprocess.run(cmd, cwd=REPO_ROOT)
    sys.exit(res.returncode)

def main():
    if len(sys.argv) < 2: sys.exit(0)
    action = sys.argv[1]
    with OperationLock(LOCK_FILE):
        import argparse
        parser = argparse.ArgumentParser(add_help=False)
        parser.add_argument("path")
        
        if action == "add":
            parser.add_argument("branch", nargs="?", default=None)
            known, extra = parser.parse_known_args(sys.argv[2:])
            run_add(known, extra)
        elif action == "sync":
            known, extra = parser.parse_known_args(sys.argv[2:])
            run_sync(known, extra)
        elif action == "remove":
            known, extra = parser.parse_known_args(sys.argv[2:])
            run_remove(known, extra)
        else:
            sys.exit(subprocess.run(["git", "worktree"] + sys.argv[1:], cwd=REPO_ROOT).returncode)

if __name__ == "__main__":
    main()
