---
name: worktree-lifecycle-manager
description: >
  Zero-Trust Git Worktree Lifecycle Manager. Handles creation, registration,
  heartbeat updates, cleanup, pruning, and integrity validation for concurrent
  multi-story agent development.
---

# 🌳 Worktree Lifecycle Manager SKILL

## Overview
This skill provides a standardized, zero-trust lifecycle for Git Worktrees during parallel multi-story development. It ensures workspace isolation, prevents cross-contamination, enforces quota boundaries, and prevents disk pollution.

## Golden Rules
1. **Never call raw `git worktree add` directly.** Always use `.agent/bin/git-worktree-guard.sh add` or `.agent/scripts/worktree-guard.py`.
2. **All worktrees MUST be created inside `.worktrees/`** (e.g. `.worktrees/story-45.1`).
3. **Maximum active user worktrees:** 5.
4. **Heartbeat requirement:** Active sessions must trigger `worktree-heartbeat.sh` every 5–10 minutes to protect worktree from the Cron Reaper.
5. **Always cleanup upon completion:** Workflows (like `/approve-qa`) MUST unregister and remove worktrees when a story lands.

## Commands & Operations

### 1. Create a New Worktree (Isolated Workspace)
```bash
# Creates .worktrees/story-<id>, checks out feature/story-<id>, serializes via flock, registers in SQLite
.agent/bin/git-worktree-guard.sh add .worktrees/story-<id> feature/story-<id>

# Initialize environment & dependencies inside the new worktree:
cd .worktrees/story-<id>
pnpm install --frozen-lockfile --prefer-offline
```

### 2. Session Heartbeat (Keep-Alive)
```bash
# Called during long-running tasks or test runs
.agent/scripts/worktree-heartbeat.sh .worktrees/story-<id>
```

### 3. List Active Worktrees & Status
```bash
# Display formatted table of paths, branches, active times, TTL, lock state
python3 .agent/scripts/worktree-registry.py list
```

### 4. Release / Teardown Worktree Upon Completion
```bash
# Safely releases worktree, teardowns processes, backs up diffs, unregisters from SQLite, cleans branches
python3 .agent/scripts/worktree-release.py --target .worktrees/story-<id> --backup

# Or trigger via workflow:
# /release-worktree --target story-<id> --backup --delete-remote
```

### 5. Integrity Audit & Self-Healing
```bash
# Reconciles Git state vs SQLite registry, fixes ghosts and orphans
python3 .agent/scripts/worktree-integrity-validator.py --fix
```

### 6. Force Proactive Reaper Pass
```bash
# Scans for expired (>48h clean, >72h hard) worktrees and archives uncommitted diffs
python3 .agent/scripts/worktree-reaper.py
```
