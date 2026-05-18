---
story_id: "STORY-SIM-1.10"
epic_id: "EPIC-SIM-01"
title: "Cross-Family Open Tool Coverage for Graph and Browser Usage Packs"
status: "COMPLETED"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.10: Cross-Family Open Tool Coverage for Graph and Browser Usage Packs

## 1. Objective

Extend Open Tool support beyond design so that graph and browser solutions also follow the same orchestration rule:

```text
Adapter + Usage Skill Pack + Routing Registration
```

## 2. Problem Statement

The system already moved design tools toward usage-pack thinking, but graph and browser families still had weaker orchestration coverage.

This created an architectural mismatch:

- design was becoming adapter + usage pack
- graph was still mostly adapter/profile driven
- browser support was uneven across default options

## 3. Scope

### In scope

- add default usage-pack skeletons for graph backends
- add default usage-pack skeletons for browser options
- mark `neo4j` and `memgraph` as first-class user-selectable graph options
- expand routing-profile coverage for active workflows that depend on graph/browser/design surfaces

### Out of scope

- full connector-specific execution for every backend
- full migration of every legacy workflow in the repo

## 4. Acceptance Criteria

### AC1: Graph follows Open Tool architecture

- graph adapters have corresponding default usage-pack direction
- docs explicitly state graph must follow adapter + usage pack

### AC2: Browser follows Open Tool architecture

- browser family has default usage-pack skeletons beyond Playwright

### AC3: User-facing graph options are explicit

- `neo4j` and `memgraph` are visible option choices in graph tool setup

### AC4: Coverage improves

- active workflows that rely on graph/browser/design surfaces expose `tool_dependencies`
- Orch can ask for the right tool group at the right time more consistently

### AC5: Source-of-truth is updated

- story exists in `_iwish-output/iwish-skills/stories/`
- sprint status includes the story

## 5. Tasks

- [x] Add graph usage-pack skeletons
- [x] Add browser usage-pack skeletons
- [x] Update Open Tool standard for graph/browser parity
- [x] Promote `neo4j` and `memgraph` into user-facing graph choices
- [x] Expand routing-profile coverage for active workflows
- [x] Update sprint/source-of-truth artifacts

## 6. Definition of Done

- [x] Cross-family Open Tool parity documented
- [x] Graph/browser default skeletons exist
- [x] Routing-profile coverage expanded
- [x] Story and sprint updated
