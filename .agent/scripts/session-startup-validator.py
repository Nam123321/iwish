#!/usr/bin/env python3
"""
Session Startup Validator
Executes at the beginning of an agent work session to enforce Zero-Trust workspace hygiene,
validate disk capacity, self-heal registry drift, and verify Reaper daemon health.
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
import shutil
from datetime import datetime, timezone

def get_repo_root():
    try:
        return subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
    except Exception:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

REPO_ROOT = get_repo_root()
WORKTREES_DIR = os.path.join(REPO_ROOT, ".worktrees")
HEARTBEAT_FILE = os.path.join(WORKTREES_DIR, ".reaper-heartbeat")
MIN_FREE_DISK_GB = 5.0

def main():
    print("=" * 70)
    print("  🛡️  ZERO-TRUST SESSION STARTUP VALIDATOR")
    print("=" * 70)

    # 1. Check disk space
    stat = shutil.disk_usage(REPO_ROOT)
    free_gb = stat.free / (1024 ** 3)
    print(f"💾 Free Disk Space: {free_gb:.2f} GB (Threshold: {MIN_FREE_DISK_GB} GB)")
    if free_gb < MIN_FREE_DISK_GB:
        print(f"❌ CRITICAL: Disk space critically low (< {MIN_FREE_DISK_GB} GB). Session creation blocked.")
        sys.exit(1)

    # 2. Run integrity validator with auto-fix
    val_script = os.path.join(REPO_ROOT, ".agent", "scripts", "worktree-integrity-validator.py")
    res = subprocess.run([sys.executable, val_script, "--fix"], cwd=REPO_ROOT)
    if res.returncode != 0:
        print("⚠️  Warning: Worktree integrity detected unhealed issues.")

    # 3. Check Reaper liveness
    reaper_healthy = False
    if os.path.exists(HEARTBEAT_FILE):
        try:
            with open(HEARTBEAT_FILE, "r") as f:
                ts_str = f.read().strip()
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            hours_old = (datetime.now(timezone.utc) - ts).total_seconds() / 3600.0
            if hours_old <= 2.0:
                reaper_healthy = True
                print(f"⏰ Reaper Daemon Heartbeat: Healthy ({hours_old:.1f}h ago)")
        except Exception:
            pass

    if not reaper_healthy:
        print("ℹ️  Reaper heartbeat missing or >2h old. Triggering proactive inline reaper pass...")
        reaper_script = os.path.join(REPO_ROOT, ".agent", "scripts", "worktree-reaper.py")
        subprocess.run([sys.executable, reaper_script], cwd=REPO_ROOT)
        print("✅ Proactive reaper pass complete.")

    print("=" * 70)
    print("✨ SESSION STARTUP VALIDATION COMPLETE: Workspace ready for development.")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
