---
description: 'Navigate major mid-flight changes by classifying pivot severity, updating source-of-truth, and re-routing into the correct next workflow.'
---

# /pivot-project

## Purpose

Provide a canonical I-Wish flow for mid-flight change navigation when the project already has working context but the current direction is no longer safe or valid.

This workflow is the canonical successor to legacy `correct-course` and the previous canonical `course-correct`.

## When to Use

Use this when the team discovers:

- scope drift during implementation
- a review finding that invalidates the current story path
- a bug fix that expands into a story/epic/plan change
- design drift that requires story or implementation re-slicing
- external constraints that force re-routing during active delivery

## Do Not Use

Do not use this when the real issue is:

- a project that still lacks minimum context or source-of-truth
  Then use `bootstrap-existing-project`
- a new external repo or capability intake problem
  Then use `absorb-repo`
- a local isolated bug with no wider impact
  Then use `fix-bug` or `code`

## Pivot Severity Model

### 1. Local

The change stays within the current implementation slice.

Typical follow-up:

- `code`
- `review`
- `reconcile-change`

### 2. Story

The current story's scope, acceptance criteria, or UX contract must change.

Typical follow-up:

- `make-story`
- `make-ui-spec`
- `reconcile-change`

### 3. Epic

Multiple stories or a feature slice are affected.

Typical follow-up:

- `impact-analysis`
- `make-story`
- `plan`
- `reconcile-change`

### 4. Plan

The change invalidates the current roadmap, PRD assumptions, or architecture direction.

Typical follow-up:

- `plan`
- `research`
- `bootstrap-existing-project` if context is weak
- `reconcile-change`

## Required Sequence

1. Identify the trigger and affected execution surface.
2. Determine whether the issue is `local`, `story`, `epic`, or `plan`.
3. Determine whether current context is still strong enough:
   - if yes, stay in `pivot-project`
   - if no, route into `bootstrap-existing-project`
4. Determine whether outside repo/capability intake is needed:
   - if yes, route into `absorb-repo`
5. Record reconciliation and required source-of-truth updates.
6. Recommend the next canonical workflow instead of continuing blindly.

## Outputs

- pivot severity
- impacted source-of-truth layers
- required reconciliation scope
- recommended next workflow
- pause/continue guidance for implementation

## Notes

- `bootstrap-existing-project` fixes missing context.
- `pivot-project` fixes wrong direction after context already exists.
- `absorb-repo` fixes missing external capability/context.
