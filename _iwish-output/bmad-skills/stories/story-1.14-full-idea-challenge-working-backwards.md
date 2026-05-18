---
story_id: "STORY-SIM-1.14"
epic_id: "EPIC-SIM-01"
title: "Full Idea Challenge Working Backwards Workflow"
status: "COMPLETED"
assignee: "pm-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.14: Full Idea Challenge Working Backwards Workflow

## 1. Objective

Develop `idea-challenge` from a canonical routing surface into a complete Discover-phase workflow with explicit Working Backwards stages, artifact templates, and downstream planning handoff.

## 2. Problem Statement

`idea-challenge` currently exists as the right canonical surface, but it still needs:

- explicit stage choreography
- structured outputs
- add-on invocation rules
- proper handoff into planning

Without that, Orch can route users into the right place but the workflow itself is still too thin for repeated operational use.

## 3. Scope

### In scope

- full stage design for `idea-challenge`
- working artifacts and distillate templates
- integration rules for:
  - `socratic-review`
  - `idea-hardening`
  - `unique-advantage-evaluator`
  - `research`
- explicit next-step routing guidance into `plan`, `research`, or `pivot-project`

### Out of scope

- automatic web browsing inside the workflow body
- automatic PRD generation from final outputs
- retrofitting all legacy ideation workflows in one pass

## 4. Acceptance Criteria

- `idea-challenge` has a documented multi-stage flow
- stage files exist for repeated execution
- output templates exist for the main artifact and distillate
- the role boundaries of `idea-hardening`, `socratic-review`, and `unique-advantage-evaluator` are explicit
- source-of-truth is updated

## 5. Definition of Done

- [x] Workflow expanded from wrapper to full flow
- [x] Step files added
- [x] Output templates added
- [x] Story and sprint updated
