---
story_id: "STORY-SIM-1.13"
epic_id: "EPIC-SIM-01"
title: "Idea Challenge and Unique Advantage Evaluation Layer"
status: "COMPLETED"
assignee: "pm-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.13: Idea Challenge and Unique Advantage Evaluation Layer

## 1. Objective

Absorb the upstream PRFAQ pattern into I-Wish as `idea-challenge`, and formalize `unique-advantage-evaluator` as a strategic add-on capability that works across idea challenge, planning, and pivot workflows.

The goal is to avoid ad hoc overlap between:

- upstream `prfaq`
- current `socratic-review`
- adjacent internal skills such as `idea-hardening`
- the proposed strategic evaluation capability

## 2. Problem Statement

The repo now contains enough ideation, planning, and review capability that a careless addition would create duplication.

We need one official triage and implementation path that decides:

1. what `idea-challenge` should become in I-Wish
2. whether `unique-advantage-evaluator` should be a new skill, workflow patch, or enhancement to existing capabilities
3. how `socratic-review` should be reused rather than duplicated
4. how strategy/business-advantage outputs become usable in Discover, Plan, and Pivot work

## 3. Scope

### In scope

- absorb and classify upstream `prfaq`
- rename the concept to canonical `idea-challenge`
- define trigger vocabulary beyond specialist moat terminology
- define `unique-advantage-evaluator` as a two-way capability:
  - stress-test mode
  - solution-proposal mode
- review overlap with:
  - `socratic-review`
  - `idea-hardening`
  - planning/research workflows
- define whether the capability starts as:
  - `skill-attachment`
  - `workflow-patch`
  - or a new standalone skill
- define business-side outputs such as `biz-stack`

### Out of scope

- full final implementation of all PRFAQ stages
- retrofitting every legacy ideation workflow in one pass
- global injection of strategy logic into implementation and QA flows

## 4. Acceptance Criteria

### AC1: Official triage exists

- I-Wish has an explicit triage artifact for:
  - `idea-challenge`
  - `unique-advantage-evaluator`
  - `socratic-review`
- the shape, role, and phase of each capability is documented

### AC2: Naming is canonical

- upstream `prfaq` is represented as canonical `idea-challenge`
- proposed `strategy-moat-evaluator` is represented as canonical `unique-advantage-evaluator`

### AC3: Overlap is resolved

- the system explicitly documents what belongs to:
  - `idea-challenge`
  - `unique-advantage-evaluator`
  - `socratic-review`
- duplication risk with `idea-hardening` is reviewed before net-new capability creation

### AC4: Two-way strategic behavior is defined

- `unique-advantage-evaluator` supports:
  - stress-test mode
  - solution-proposal mode
- the capability can propose:
  - business-model directions
  - pricing angles
  - distribution angles
  - defensibility hypotheses
  - `biz-stack` output

### AC5: Source-of-truth is updated

- sprint/story tracking reflects this work for later review

## 5. Proposed Tasks

- [x] Create an official triage and overlap analysis artifact
- [x] Absorb upstream `prfaq` into I-Wish naming and phase model
- [x] Review overlap with `socratic-review` and `idea-hardening`
- [x] Define trigger vocabulary for business-friendly and Vietnamese-friendly routing
- [x] Decide whether `unique-advantage-evaluator` starts as `skill-attachment` or `workflow-patch`
- [x] Define business output artifacts including `biz-stack`

## 6. Definition of Done

- [x] Triage outcome is explicit
- [x] Naming is fixed
- [x] Overlap decisions are documented
- [x] Story and sprint are updated
