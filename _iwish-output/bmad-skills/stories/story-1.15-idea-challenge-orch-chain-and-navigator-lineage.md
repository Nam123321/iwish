---
story_id: "story-1.15"
title: "Idea Challenge Orch Chain and Navigator Lineage"
status: "COMPLETED"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs: ["story-1.14-full-idea-challenge-working-backwards.md", "story-nav-2.1-sync-engine.md"]
---

# Story 1.15: Idea Challenge Orch Chain and Navigator Lineage

## Objective

Deepen the canonical `idea-challenge` flow so Orch can recommend a clear execution chain and preserve the artifact lineage into the HTML project overview.

## Scope

- extend Orch routing so `/idea-challenge` can recommend:
  - `/idea-challenge`
  - `/research`
  - `unique-advantage-evaluator`
  - `/plan`
- expose the expected artifact chain to the user during routing
- ensure `idea-challenge`, distillate, and `biz-stack` artifacts carry phase metadata for Navigator ingestion
- update Navigator sync logic and guardian policy so Discover artifacts appear in the overview

## Acceptance Criteria

- Orch prints a clear workflow chain and artifact chain for `idea-challenge` requests
- `idea-challenge` artifacts are scaffolded with frontmatter suitable for Navigator sync
- Navigator sync can classify planning-based Discover artifacts without manual patching
- `navigator-guardian` and canonical workflows explicitly preserve the idea-to-plan lineage

## Notes

This story closes the gap between strategy/discovery workflows and the older PRD/epic/story-centric HTML overview, so the project narrative begins at idea challenge instead of starting too late.
