---
story_id: "story-1.18a"
title: "Windsurf Install Adapter"
status: "review"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "story-1.18-neutral-install-ux-and-platform-expansion.md"
  - "docs/iwish-runtime-substrate.md"
---

# Story 1.18a: Windsurf Install Adapter

## Objective

Add a first-class install adapter for Windsurf so I-Wish can scaffold the correct runtime surface and onboarding guidance for that environment.

## Acceptance Criteria

- Windsurf install path and runtime materialization rules are defined.
- CLI/runtime recognize `windsurf` as `supported` only after adapter implementation is complete.
- Docs explain any Windsurf-specific setup differences.

## Implementation Notes

- Adapter path is scaffolded under `.windsurf/rules`.
- Runtime now materializes target directories and writes `.iwish-target.json` markers for supported targets.
- `iwish list-install-targets` should show `windsurf` as supported.
