---
name: 'make-story-auto-approve'
description: 'Story creation SDLC workflow in Auto-Approve mode. Runs without stopping unless blocked by unresolved conflicts.'
---

# /make-story-auto-approve

This is a convenience wrapper for the `/make-story` workflow that automatically runs in `--auto-approve` mode.

## Workflow Guidelines

**CRITICAL INSTRUCTION:** When this command is invoked, the Orchestrator MUST immediately execute the `/make-story` workflow with the `--auto-approve` flag implicitly set.

- You MUST NOT stop at the end of each step. 
- **Conflict/Business Gate**: Pause ONLY if `/party-mode` reaches an unresolved technical deadlock or requires a business-level decision.

Please follow all execution steps as defined in `/.agent/workflows/make-story.md`.
