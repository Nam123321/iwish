---
name: subagent-path-jail
description: Strict file path isolation and containment validator preventing subagents
  from writing outside boundaries
version: 1.0.0
tags:
- security
- sandbox
- path-jail
- execution-guard
---
# 🛡️ Subagent Path-Jail Execution Guardian

## Purpose
Absorbed from `rohitg00/ai-engineering-from-scratch` (Phase 19 Lesson 26).
Provides a defense-in-depth wrapper for executing untrusted subagent commands or test scripts within a confined working directory.

## Capabilities
1. **Path Traversal Prevention:** Uses `os.path.realpath` to ensure all resolved paths remain strictly within the designated jail root directory (defeating `../../etc/passwd` or symlink escapes).
2. **Dangerous Binary Denylist:** Automatically blocks prohibited system utilities (`sudo`, `mkfs`, `dd`, `shutdown`, `nc`, `iptables`).
3. **Hard Wall-Clock Timeout:** Terminates processes exceeding the timeout limit with exit code `-101`.

## Usage
```bash
python3 .agent/scripts/subagent-path-jail.py --jail <sandbox_dir> --timeout 30.0 -- <command> [args...]
```
