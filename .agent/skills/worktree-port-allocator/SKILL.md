---
name: worktree-port-allocator
description: >
  Dynamic Port Allocator and Lifecycle Manager for Git Worktrees.
  Automatically assigns, tracks, and releases ports to prevent EADDRINUSE conflicts.
---

# 🔌 Worktree Port Allocator SKILL

## Purpose
This skill handles the dynamic allocation of development server ports (Vite, Node) across multiple concurrent Git worktrees. It uses a SQLite registry (`.worktrees/registry.db`) to ensure atomicity, track process lifetimes (PIDs), and execute Zero-Trust cleanup.

## Usage

### 1. Assign Port to Worktree
```bash
python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py assign <story_id> <worktree_path>
```
*Injects `PORT` into `.env.local`.*

### 2. Get Assigned Port
```bash
python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py get <story_id>
```

### 3. Release Port and Cleanup
```bash
python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py release <story_id>
```
*Kills process group safely using Command Match to prevent Reboot Drift.*

## Zero-Trust Gates
- **validate-port-lifecycle.py --phase health-check**: Ensure the port is genuinely serving HTTP traffic before testing.
- **validate-port-lifecycle.py --phase release**: Ensure the socket is fully closed and unbound.
