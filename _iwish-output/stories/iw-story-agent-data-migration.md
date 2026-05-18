---
story_id: IW-STORY-01
epic_id: EPIC-IWISH-01
title: Migrate Legacy Agent Data to Native I-Wish Agents
status: Completed
priority: High
---

# Story: Migrate Legacy Agent Data

## Description
To remove I-Wish's dependency on the I-Wish-DragonBall project, we need to copy the full agent instructions, prompts, and metadata from the legacy `.agent/agents/*.md` files into the new native I-Wish agent files.

## Acceptance Criteria
- All 16 core agents must have their full instruction set migrated.
- The I-Wish `.agent/agents/` folder must contain native agent definitions (e.g., `dev-agent.md`, `ai-agent.md`).
- "Thin wrapper" references to legacy I-Wish agents must be entirely removed.
- Agent names and IDs must correctly reflect their native I-Wish identities.
