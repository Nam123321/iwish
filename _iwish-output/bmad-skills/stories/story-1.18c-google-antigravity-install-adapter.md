---
story_id: "story-1.18c"
title: "Google Antigravity Install Adapter"
status: "review"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "story-1.18-neutral-install-ux-and-platform-expansion.md"
  - "docs/iwish-runtime-substrate.md"
---

# Story 1.18c: Google Antigravity Install Adapter

## Objective

Add a first-class install adapter for Google Antigravity so I-Wish can scaffold the correct runtime surface and onboarding guidance for that environment.

## Acceptance Criteria

- Antigravity install path and runtime materialization rules are defined.
- CLI/runtime recognize `google antigravity` as `supported` only after adapter implementation is complete.
- Docs explain any Antigravity-specific setup differences.

## Implementation Notes

- Adapter path is scaffolded under `.gemini` to align with the Gemini/Antigravity workspace convention already referenced in the SDLC protocol docs.
- Runtime materializes the target directory and writes `.iwish-target.json` markers for supported targets.
- `iwish list-install-targets` should show `google antigravity` as supported after the adapter lands.
