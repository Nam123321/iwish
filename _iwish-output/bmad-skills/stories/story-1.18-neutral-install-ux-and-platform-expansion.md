---
story_id: "story-1.18"
title: "Neutral Install UX and Multi-Platform Adapter Expansion"
status: "review"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "docs/iwish-runtime-substrate.md"
  - "docs/iwish-github-launch-plan.md"
  - "story-1.9-tool-setup-onboarding-and-graph-selection.md"
  - "story-1.18a-windsurf-install-adapter.md"
  - "story-1.18b-opencode-install-adapter.md"
  - "story-1.18c-google-antigravity-install-adapter.md"
---

# Story 1.18: Neutral Install UX and Multi-Platform Adapter Expansion

## Objective

Remove platform bias from the install UX and expand I-Wish install-target support beyond the current first-party set.

## Problem

The current install flow was implicitly biased toward `codex` because the CLI defaulted to that target when `--platform` was omitted.

This creates two problems:

- the install UX is not neutral
- public launch messaging overstates platform openness compared with the actual supported install matrix

At the same time, the system still lacks official install adapters for:

- `windsurf`
- `opencode`
- `google antigravity`

## Target Outcome

1. Install/update/init should prompt the user to choose platform(s) when none are provided.
2. Public-facing docs should describe the supported install matrix accurately.
3. I-Wish should gain a tracked path for install-target expansion to additional IDE/runtime platforms.
4. Install-target expansion should be represented in runtime code as an adapter catalog, not just prose in docs.

## Acceptance Criteria

- **AC1:** `iwish install` no longer silently defaults to a single platform.
- **AC2:** `iwish update` no longer silently defaults to a single platform.
- **AC3:** Legacy `iwish-db init` follows the same neutral prompting rule.
- **AC4:** Public docs clearly distinguish:
  - supported install targets
  - planned targets
- **AC5:** A tracked implementation path exists for:
  - `windsurf`
  - `opencode`
  - `google antigravity`
- **AC6:** Install-target expansion is treated as adapter work, not just documentation.
- **AC7:** Runtime exposes a machine-readable install target catalog with explicit `supported` vs `planned` states.
- **AC8:** CLI can show the install target matrix without requiring the user to inspect source or docs.
- **AC9:** Follow-up adapter stories exist for each planned platform.

## Task Breakdown

| Task | Description |
|---|---|
| T1 | Remove implicit single-platform install default |
| T2 | Add interactive platform selection when `--platform` is omitted |
| T3 | Update README/runtime docs with accurate support matrix |
| T4 | Define install adapter scope for `windsurf`, `opencode`, `google antigravity` |
| T5 | Add follow-up implementation stories or subtasks for those adapters |
| T6 | Add install target catalog into runtime/constants to track supported vs planned states |
| T7 | Expose a CLI surface to list install targets for review and onboarding |

## Story Quality Notes

- `story-1.18` is a platform/runtime infrastructure story, not just a docs cleanup task.
- Completion for this story should end in `review`, not `completed`, until adapter catalog behavior and follow-up stories are checked through `/review`.
- Planned platforms must not appear as if they are already installable.

## Notes

- `iwish-db` remains a compatibility alias for migration safety, not a canonical public surface.
- New public launch material should lead with `iwish`.
- `story-1.18a`, `story-1.18b`, and `story-1.18c` move through `review` once adapter paths and runtime markers are scaffolded.
