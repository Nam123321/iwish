---
name: worktree-port
description: Interactive Slash Command to manage Worktree Ports
category: tooling
roles:
- orch-agent
steps:
- id: wp-01
  description: Parse user action (list, release, assign)
- id: wp-02
  description: Execute action via worktree-port-manager.py
- id: wp-03
  description: Print results
---
# /worktree-port

This workflow allows humans and agents to interactively manage development ports.

## Execution
If user provides `list`:
Run `python3 .agent/scripts/worktree-registry.py list` (assuming it lists ports, otherwise we can add a list command to port manager).

If user provides `release <story_id>`:
Run `python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py release <story_id>`
Run `python3 .agent/skills/worktree-port-allocator/scripts/validate-port-lifecycle.py --phase release --port <port>`

If user provides `assign <story_id> <path>`:
Run `python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py assign <story_id> <path>`
