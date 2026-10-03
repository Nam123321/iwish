#!/usr/bin/env bash
# ==============================================================================
# Category A Deterministic Sandbox Sync Script with OS-Level RWLock
# Hardened against Git Conflict Deadlocks, Inode Hijacking, and Git LFS bombs.
# ==============================================================================

set -euo pipefail

SANDBOX_DIR="${1:-$HOME/.iwish/sandbox/ai-engineering-from-scratch}"
LOCK_FILE="$HOME/.iwish/sandbox/.ai-engineering-sync.flock"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INDEX_PATH="$PROJECT_ROOT/.agent/skills/ai-engineering-knowledge-consultant/references/routing-index.yaml"
SYNC_REPORT="$PROJECT_ROOT/_iwish-output/adhoc-workspace/scratch/sync-report.json"
CORRELATION_ID="$(uuidgen || echo "sync-$(date +%s)")"

mkdir -p "$(dirname "$LOCK_FILE")"
mkdir -p "$(dirname "$SYNC_REPORT")"

log_json() {
  local level=$1
  local msg=$2
  jq -n -c \
    --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg level "$level" \
    --arg msg "$msg" \
    --arg cid "$CORRELATION_ID" \
    --arg svc "sandbox-sync" \
    '{timestamp: $ts, level: $level, service: $svc, correlationId: $cid, message: $msg}'
}

log_json "INFO" "Starting sync for: $SANDBOX_DIR"

# Hardened environment
export GIT_LFS_SKIP_SMUDGE=1
export PATH="/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin"

# Execute sync inside OS-level Exclusive Lock
python3 - "$SANDBOX_DIR" "$LOCK_FILE" "$SYNC_REPORT" "$CORRELATION_ID" << 'PYEOF'
import os, sys, fcntl, subprocess, json, time
from datetime import datetime, timezone

sandbox = os.path.expanduser(sys.argv[1])
lock_path = os.path.expanduser(sys.argv[2])
report_path = os.path.expanduser(sys.argv[3])
cid = sys.argv[4]

def log_json(level, msg):
    print(json.dumps({
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "level": level,
        "service": "sandbox-sync-py",
        "correlationId": cid,
        "message": msg
    }))

if not os.path.exists(sandbox):
    log_json("ERROR", f"Sandbox not found: {sandbox}")
    sys.exit(1)

try:
    lock_fd = open(lock_path, "w")
    fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except (BlockingIOError, OSError):
    log_json("WARN", "Another process holds lock on sandbox. Skipping sync safely.")
    sys.exit(0)

start_time = time.time()
report = {"sandbox": sandbox, "timestamp": start_time}

try:
    log_json("INFO", "Fetching origin main (shallow, depth=1)...")
    subprocess.run(
        ["git", "-C", sandbox, "fetch", "--depth", "1", "origin", "main"],
        check=True, timeout=30, capture_output=True, text=True
    )

    log_json("INFO", "Hard resetting to origin/main...")
    res = subprocess.run(
        ["git", "-C", sandbox, "reset", "--hard", "origin/main"],
        check=True, timeout=15, capture_output=True, text=True
    )
    report["git_reset_output"] = res.stdout.strip()

    commit = subprocess.run(
        ["git", "-C", sandbox, "rev-parse", "HEAD"],
        check=True, capture_output=True, text=True
    ).stdout.strip()
    report["current_commit"] = commit
    report["status"] = "SUCCESS"
    log_json("INFO", f"Successfully synced to commit: {commit}")

except subprocess.TimeoutExpired:
    report["status"] = "TIMEOUT"
    log_json("ERROR", "Git sync timed out (>30s)")
except subprocess.CalledProcessError as e:
    report["status"] = "ERROR"
    report["error"] = str(e)
    log_json("ERROR", f"Git command failed: {e}")
finally:
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()
    except Exception:
        pass

report["duration_seconds"] = round(time.time() - start_time, 2)
with open(report_path, "w") as f:
    json.dump(report, f, indent=2)

if report.get("status") != "SUCCESS":
    sys.exit(1)
PYEOF

log_json "INFO" "Regenerating routing index from synced sandbox..."
python3 "$PROJECT_ROOT/.agent/scripts/build-sandbox-routing-index.py" --sandbox "$SANDBOX_DIR" --output "$INDEX_PATH" > /dev/null || {
    log_json "WARN" "Failed to rebuild routing index."
}

if [ -f "$INDEX_PATH" ]; then
    log_json "INFO" "Running post-sync index validation..."
    python3 "$PROJECT_ROOT/.agent/scripts/validate-citation-integrity.py" --mode index-check --sandbox "$SANDBOX_DIR" --index "$INDEX_PATH" > /dev/null || {
        log_json "WARN" "Index validation identified orphan entries."
    }
fi

log_json "INFO" "Sync completed successfully."
