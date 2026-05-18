---
story_id: "STORY-SIM-1.12"
epic_id: "EPIC-SIM-01"
title: "Absorb, Pivot, and Course-Correction Orchestration"
status: "COMPLETED"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.12: Absorb, Pivot, and Course-Correction Orchestration

## 1. Objective

Create a canonical I-Wish orchestration layer for handling:

- repo absorption and external context intake
- brownfield bootstrap
- mid-flight pivot and change navigation
- pivot-project style re-routing during implementation

The goal is to stop treating these as loosely related workflows and instead define a clear decision framework for Orch.

## 2. Problem Statement

The current system now has strong building blocks:

- `absorb-repo`
- `bootstrap-existing-project`
- `impact-analysis`
- `reconcile-change`
- `fix-bug`
- `pivot-guardian`
- legacy `iwish-bmm-correct-course`

But Orch still lacks one canonical decision model for:

1. when to bootstrap
2. when to absorb
3. when to pivot
4. when to pivot mid-sprint
5. when to chain multiple supportive workflows together

Without this, users can still hit confusion in large changes, brownfield adoption, or evolving project scope.

## 3. Scope

### In scope

- define a canonical I-Wish `pivot-project` change-navigation workflow
- map legacy `iwish-bmm-correct-course` into the canonical I-Wish flow
- define Orch decision rules between:
  - `bootstrap-existing-project`
  - `absorb-repo`
  - `pivot-project`
  - `impact-analysis`
  - `reconcile-change`
- define when pivot is:
  - local
  - story-level
  - epic-level
  - plan-level
- define source-of-truth updates required after major pivot

### Out of scope

- full automation of re-writing PRD/architecture/story documents
- replacing `fix-bug` or `review` with a monolithic pivot flow
- full migration of every legacy workflow wrapper in one pass

## 4. Acceptance Criteria

### AC1: Canonical change-navigation flow exists

- I-Wish has a canonical workflow for `pivot-project` / change navigation
- legacy `iwish-bmm-correct-course` is mapped as a compatibility surface, not the canonical surface

### AC2: Orch routing rules are explicit

- Orch can distinguish:
  - context bootstrap problem
  - repo absorption problem
  - implementation pivot problem
  - simple bugfix/review problem

### AC3: Pivot levels are defined

- the system defines pivot severity such as:
  - local
  - story
  - epic
  - plan
- each level has expected follow-up workflows and required source-of-truth updates

### AC4: Absorb and bootstrap handoff is defined

- if absorbed context reveals missing or stale source-of-truth, Orch knows when to route into `bootstrap-existing-project`
- if bootstrap/review reveals large change, Orch knows when to route into `pivot-project`

### AC5: Story/sprint tracking is updated

- this work is tracked in `_iwish-output/iwish-skills/`

## 5. Proposed Tasks

- [x] Define canonical `pivot-project` workflow for I-Wish
- [x] Add routing profile for change-navigation flow
- [x] Add Orch decision matrix for absorb vs bootstrap vs pivot-project
- [x] Define pivot severity model and source-of-truth update contract
- [x] Map legacy `iwish-bmm-correct-course` to the canonical flow
- [x] Update docs and orchestration inventory

## 6. Notes

- `bootstrap-existing-project` solves missing context.
- `pivot-project` solves wrong direction after context already exists.
- `absorb-repo` solves external capability/repo intake.

I-Wish should treat them as related but distinct supportive workflows.

## 7. Definition of Done

- [x] Canonical pivot/change-navigation flow exists
- [x] Orch decision rules are documented
- [x] Legacy mapping is explicit
- [x] Source-of-truth is updated
