---
story_id: "STORY-SIM-1.7"
epic_id: "EPIC-SIM-01"
title: "Machine-Readable Routing Profiles for Orch Research Efficiency"
status: "COMPLETED"
assignee: "Vegeta"
priority: "HIGH"
phase: "forge"
---

# Story 1.7: Machine-Readable Routing Profiles for Orch Research Efficiency

## 1. Objective

Add a machine-readable `routing-profile.yaml` layer so Orch can research capabilities in a token-efficient and accurate order:

1. source-of-truth context
2. routing profile
3. review pack
4. execution body

This closes the gap where Orch had to infer too much from filenames, heuristic keyword matching, and full-body workflow/skill reads.

## 2. Problem Statement

The current system already has:

- `SKILL.md` / workflow / agent execution bodies
- adoption review packs (`integration-guide.md` + `.html`)
- source-of-truth surfaces such as sprint/story/reconciliation artifacts

But it still lacks a compact machine-readable layer that tells Orch:

- where a capability fits in the delivery framework
- whether it is process-primary, supportive, or foundational
- which phases/stages it serves
- which agent/workflow should own it
- what should trigger or exclude it

Without this layer, Orch wastes tokens and can make noisier routing decisions.

## 3. Scope

### In scope

- Define `routing-profile.yaml` as a standard for:
  - skills
  - workflows
  - agents
  - external modules
- Wire routing profiles into:
  - runtime module registration
  - catalog enrichment
  - inventory
  - skill graph analysis
  - Orch-facing inspection commands
- Seed routing profiles for canonical workflows, canonical agents, and key root skills.
- Create source-of-truth tracking for this work inside `_iwish-output/iwish-skills/`.

### Out of scope

- Full graph-reasoning planner
- Automatic creation of routing profiles for every legacy workflow in the repo
- Replacing the review pack or execution body with routing profiles

## 4. Acceptance Criteria

### AC1: Standard exists

- A dedicated standard document defines:
  - placement
  - required fields
  - Orch research order

### AC2: Runtime generation exists

- External module registration auto-generates a routing profile.
- A dedicated CLI command can generate routing profiles for arbitrary capability types.

### AC3: Orch-facing surfaces use profiles

- Catalog search is enriched with routing-profile metadata.
- Inventory exposes routing-profile coverage.
- Skill graph exposes routing-profile coverage and gaps.

### AC4: Canonical seed coverage exists

- Canonical workflows are seeded with routing profiles.
- Canonical function-first agents are seeded with routing profiles.
- Key root skills used by Orch are seeded with routing profiles.

### AC5: Source-of-truth is updated

- This work is represented as a story in `_iwish-output/iwish-skills/stories/`.
- `_iwish-output/iwish-skills/sprint-status.yaml` includes the story for future review context.

## 5. Tasks

- [x] Define `docs/iwish-routing-profile-standard.md`
- [x] Add routing-profile template to capability package
- [x] Implement runtime loader/generator for routing profiles
- [x] Auto-generate routing profile during `iwish register-module`
- [x] Add CLI:
  - [x] `generate-routing-profile`
  - [x] `routing-profile-status`
- [x] Enrich catalog with routing-profile metadata
- [x] Extend inventory with routing-profile coverage
- [x] Extend skill graph report with routing-profile coverage and gaps
- [x] Seed canonical workflow profiles
- [x] Seed canonical agent profiles
- [x] Seed key root skill profiles
- [x] Update iwish-skills story + sprint tracking

## 6. Notes

- Routing profiles are the **machine-readable first-pass layer**.
- Review packs remain the **human-readable + deep-context layer**.
- `SKILL.md` and workflow/agent bodies remain the **execution layer**.

## 7. Definition of Done

- [x] `routing-profile.yaml` standard exists
- [x] Runtime can generate and store routing profiles
- [x] Orch-facing inventory can inspect routing-profile coverage
- [x] Canonical coverage exists for the most important current surfaces
- [x] Story and sprint state updated for later review
