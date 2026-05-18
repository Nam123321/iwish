---
story_id: "story-1.18b"
title: "OpenCode Install Adapter"
status: "review"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "story-1.18-neutral-install-ux-and-platform-expansion.md"
  - "docs/iwish-runtime-substrate.md"
---

# Story 1.18b: OpenCode Install Adapter

## Objective

Add a first-class install adapter for OpenCode so I-Wish can scaffold the correct runtime surface and onboarding guidance for that environment.

## Acceptance Criteria

- OpenCode install path and runtime materialization rules are defined.
- CLI/runtime recognize `opencode` as `supported` only after adapter implementation is complete.
- Docs explain any OpenCode-specific setup differences.

## Implementation Notes

- Adapter path is scaffolded under `.opencode`.
- Runtime now materializes target directories and writes `.iwish-target.json` markers for supported targets.
- `iwish list-install-targets` should show `opencode` as supported.
