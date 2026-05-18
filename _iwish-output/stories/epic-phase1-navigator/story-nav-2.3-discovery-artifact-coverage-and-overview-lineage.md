---
epic: "EPIC-NAV-2"
story_id: "STORY-NAV-2.3"
title: "Discovery Artifact Coverage and Overview Lineage"
status: "done"
assignee: "Vegeta"
phase: "forge"
depends_on:
  - "story-nav-2.1-sync-engine.md"
  - "story-nav-4.1-navigator-guardian-skill-development.md"
---

# Story NAV-2.3: Discovery Artifact Coverage and Overview Lineage

## Context

The original Navigator flow centered on PRD, epics, stories, and research documents. I-Wish now introduces additional Discover/analysis artifacts such as:

- `idea-challenge-{project}.md`
- `idea-challenge-{project}-distillate.md`
- `biz-stack.md`

Without explicit coverage, the HTML overview starts too late in the product journey and loses the strategic lineage from idea to plan.

## Acceptance Criteria

- **AC1:** `sync-navigator.py` can classify and ingest Discover artifacts created under `_iwish-output/planning/idea-challenges/`
- **AC2:** artifact templates for `idea-challenge`, distillate, and `biz-stack` include enough metadata for routing and Navigator lineage
- **AC3:** `navigator-guardian` policy explicitly includes these analysis artifacts as first-class sync inputs
- **AC4:** canonical workflows that extend the idea-to-plan chain explain that the HTML overview should be refreshed after these artifacts change

## Implementation Notes

- Planning-based Discover artifacts are mapped into Navigator phases instead of being silently skipped
- The overview remains backward compatible with PRD / epic / story flows, but now starts earlier in the journey
- This story complements Orch deep-chain routing by ensuring the visualization layer can reflect the same lineage
