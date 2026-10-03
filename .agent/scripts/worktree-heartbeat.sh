#!/usr/bin/env bash
# Session Worktree Heartbeat
# Periodically called by active agent/session to signal continuous work
# Prevents Cron Reaper from removing actively utilized worktrees (EC-P13-002)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WORKTREE_PATH="${1:-$PWD}"
WORKTREE_PATH="$(cd "$WORKTREE_PATH" && pwd)"

python3 "$REPO_ROOT/.agent/scripts/worktree-registry.py" heartbeat --path "$WORKTREE_PATH"

# Lock the worktree at the Git level to prevent premature pruning
SESSION_ID=${CONVERSATION_ID:-"orchestrator"}
git worktree lock --reason "active-session-$SESSION_ID" "$WORKTREE_PATH" 2>/dev/null || true

echo "💓 Heartbeat acknowledged and worktree locked for: $WORKTREE_PATH"
