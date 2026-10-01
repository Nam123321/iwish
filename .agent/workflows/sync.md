---
name: sync
description: >
  Manual data preservation checkpoint. Syncs SSOT documentation to nested repo
  and optionally pushes code to GitHub. Use as a safety net when automated
  checkpoints are missed.
category: utility
roles:
  - orch-agent
  - dev-agent
steps:
  - id: step-01-ssot-sync
    description: "Run ssot-sync-guard.py to commit _iwish-output/ changes to nested repo."
  - id: step-02-code-status
    description: "Show git status of the main code repo."
  - id: step-03-user-decision
    description: "Ask user whether to commit/push code."
  - id: step-04-execute
    description: "Execute code sync based on user choice."
  - id: step-05-verify
    description: "Show final verification status."
---

# /sync — Manual SSOT & Code Synchronization

Load and execute: `.agent/skills/ssot-sync/SKILL.md`
