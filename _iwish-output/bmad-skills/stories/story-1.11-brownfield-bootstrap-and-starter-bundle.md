---
story_id: "STORY-SIM-1.11"
epic_id: "EPIC-SIM-01"
title: "Brownfield Bootstrap Flow and Starter Routing Bundle"
status: "COMPLETED"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.11: Brownfield Bootstrap Flow and Starter Routing Bundle

## 1. Objective

Improve first-run Orch behavior for:

- fresh installs with no local workflow profiles
- existing projects that are missing planning/source-of-truth artifacts

## 2. Scope

### In scope

- add starter routing profiles into runtime templates
- add dedicated `bootstrap-existing-project` workflow and routing profile
- document the brownfield bootstrap approach for I-Wish

### Out of scope

- full automation of brownfield PRD/architecture generation
- full migration of all legacy brownfield workflows to new canonical names

## 3. Acceptance Criteria

- runtime install ships starter workflow routing profiles
- Orch can route `brownfield` / `existing project` / `project context` requests into a dedicated bootstrap flow
- source-of-truth is updated

## 4. Tasks

- [x] Add starter routing-profile bundle to runtime templates
- [x] Add `bootstrap-existing-project` workflow
- [x] Add routing profile for bootstrap workflow
- [x] Add brownfield bootstrap documentation
- [x] Update sprint/source-of-truth artifacts
