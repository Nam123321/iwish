---
epic_id: EPIC-IWISH-01
title: Restructure and Migrate I-Wish to Standalone Framework
status: In Progress
priority: High
---

# Epic: Restructure and Migrate I-Wish

## Objective
Establish I-Wish as an independent, standalone framework by purging legacy I-Wish-DragonBall dependencies and migrating agent definitions natively.

## Goals
- Migrate full agent instructions and prompts directly into the I-Wish repository (`iwish-github`).
- Remove "thin wrappers" and legacy dependencies on I-Wish-DragonBall agents.
- Map and alias roles correctly (e.g., `Cell` -> `website-clone-agent`, `Master-Roshi` -> `tech-writer-agent`).
- Separate research functions into a distinct workflow structure.
- Maintain project tracking by creating and populating Epic and Story documentation within the existing I-Wish-DragonBall management infrastructure.

## Stories
- [x] IW-STORY-01: Migrate legacy agent prompts to I-Wish native agents.
- [x] IW-STORY-02: Update alias registries, constants, and clean up orphaned files (e.g., ui-absorber-agent).
- [ ] IW-STORY-03: Workflow & Runtime Namespace Purge — rename all `iwish-*` → `iwish-*`, restructure `_iwish/bmm/` → `_iwish/framework/`.
