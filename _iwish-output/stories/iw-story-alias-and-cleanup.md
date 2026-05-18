---
story_id: IW-STORY-02
epic_id: EPIC-IWISH-01
title: Update Alias Registries and Cleanup Orphaned Files
status: Completed
priority: Medium
---

# Story: Alias Management and Cleanup

## Description
With the migration of agent data, the internal routing, alias mappings, and constants within I-Wish need to be updated to match the new taxonomy. Any deprecated or orphaned agent definitions must be removed.

## Acceptance Criteria
- `constants.ts` must reflect the updated `LEGACY_AGENT_ALIASES`.
- The legacy `Cell` agent must map to `website-clone-agent`.
- The `ui-absorber-agent` file must be deleted.
- Ensure correct separation of `tech-writer-agent` and research functions.
