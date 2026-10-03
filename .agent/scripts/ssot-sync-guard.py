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

"""
SSOT Sync Guard — Pre-workflow safeguard.
Ensures all _iwish-output/ files in the current working directory are committed
to the nested SSOT repo before any workflow step that could trigger cleanup.

Designed to be called at the START of:
  - /review (iwish-feature-code-review.md)
  - /approve-qa (iwish-feature-approve-qa.md)
  - /manual-test (manual-test workflow)

Usage:
  python3 .agent/scripts/ssot-sync-guard.py [--auto-commit]

Exit codes:
  0 - All clean, nothing to commit
  1 - Uncommitted changes found (without --auto-commit)
  0 - Auto-committed successfully (with --auto-commit)
  2 - Fatal error (nested repo not initialized)
"""
import subprocess
import sys
import os

# Detect project root reliably via git
_git_root = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=False)
PROJECT_ROOT = _git_root.stdout.strip() if _git_root.returncode == 0 else os.getcwd()
SSOT_DIR = os.path.join(PROJECT_ROOT, "_iwish-output")
SSOT_GIT = os.path.join(SSOT_DIR, ".git")
AUTO_COMMIT = "--auto-commit" in sys.argv

def run(cmd, cwd=None):
    return subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=cwd)

def main():
    print("🛡️  SSOT Sync Guard — Checking for uncommitted SSOT files...")
    
    # Step 1: Verify nested repo exists
    if not os.path.exists(SSOT_GIT):
        print("❌ FATAL: Nested SSOT repo not found at _iwish-output/.git")
        print("   Run: cd _iwish-output && git init && git add . && git commit -m 'init'")
        sys.exit(2)
    
    # Step 2: Check for uncommitted changes in nested repo
    status = run(["git", "status", "--porcelain"], cwd=SSOT_DIR)
    if status.returncode != 0:
        print(f"❌ FATAL: git status failed: {status.stderr}")
        sys.exit(2)
    
    changes = [l for l in status.stdout.strip().split('\n') if l.strip()]
    
    if not changes:
        print("✅ All SSOT files are committed. Safe to proceed.")
        sys.exit(0)
    
    # Count changes by type
    new_files = [l for l in changes if l.startswith('?')]
    modified = [l for l in changes if l.startswith(' M') or l.startswith('M')]
    deleted = [l for l in changes if l.startswith(' D') or l.startswith('D')]
    
    print(f"⚠️  Uncommitted SSOT changes detected:")
    print(f"   New files:      {len(new_files)}")
    print(f"   Modified files: {len(modified)}")
    print(f"   Deleted files:  {len(deleted)}")
    print(f"   Total:          {len(changes)}")
    
    # Show sample of spec files at risk
    spec_exts = {'.md', '.json', '.html', '.yaml'}
    at_risk = []
    for line in changes:
        fname = line[3:].strip().strip('"')
        if any(fname.endswith(ext) for ext in spec_exts):
            if 'Story-' in fname or 'Epic-' in fname:
                at_risk.append(fname)
    
    if at_risk:
        print(f"\n   📋 Spec files at risk (sample):")
        for f in at_risk[:10]:
            print(f"      - {f}")
        if len(at_risk) > 10:
            print(f"      ... and {len(at_risk) - 10} more")
    
    if AUTO_COMMIT:
        print(f"\n🔄 Auto-committing {len(changes)} changes to nested SSOT repo...")
        
        add_result = run(["git", "add", "."], cwd=SSOT_DIR)
        if add_result.returncode != 0:
            print(f"❌ git add failed: {add_result.stderr}")
            sys.exit(2)
        
        commit_result = run(
            ["git", "commit", "-m", f"chore(auto-sync): safeguard commit ({len(changes)} files)"],
            cwd=SSOT_DIR
        )
        if commit_result.returncode != 0:
            print(f"❌ git commit failed: {commit_result.stderr}")
            sys.exit(2)
        
        print(f"✅ Auto-committed successfully. SSOT data is safe.")
        sys.exit(0)
    else:
        print(f"\n❌ HALT: {len(changes)} uncommitted SSOT files detected.")
        print(f"   Run with --auto-commit to save them, or manually commit:")
        print(f"   cd _iwish-output && git add . && git commit -m 'checkpoint'")
        sys.exit(1)

if __name__ == "__main__":
    main()
