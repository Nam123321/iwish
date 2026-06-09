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
- *Note: Evaluate if these PRD/Epic changes necessitate updates to `product-strategy.md` or `project-context.md`.*
- **MANDATORY:** Regenerate `feature-hierarchy.md` after PRD/Epic updates to keep navigation source-of-truth synchronized.

### 4. Plan

The change invalidates the current roadmap, PRD assumptions, architecture direction, **Product Strategy**, or **Project Context**.

Typical follow-up:

- `plan`
- `research`
- `/product-strategy` (to regenerate Go/No-Go and Product Strategy)
- `/generate-project-context`
- `bootstrap-existing-project` if context is weak
- `reconcile-change`
- **MANDATORY:** Regenerate `feature-hierarchy.md` after PRD/roadmap updates to keep navigation source-of-truth synchronized.

> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> If the pivot or rescope is triggered by a **new feature, feature group, or project expansion**, you MUST load and read `/.agent/fragments/project-expansion-review.md` and conduct the full **Project Expansion Review (PER)** before deciding severity or updating source-of-truth.

## Required Sequence

1. Identify the trigger and affected execution surface.
   - *Check:* If it is a new feature or feature group, perform the **Project Expansion Review (PER)** using `/.agent/fragments/project-expansion-review.md` first.
2. Determine whether the issue is `local`, `story`, `epic`, or `plan`.
   - *Note:* If PER indicates a medium or high impact (Medium/High Pivot Risk), escalate severity to `epic` or `plan` and follow the Funnel Routing Protocol to update the PRD/research first.
3. Determine whether current context is still strong enough:
   - if yes, stay in `pivot-project`
   - if no, route into `bootstrap-existing-project`
4. Determine whether outside repo/capability intake is needed:
   - if yes, route into `absorb-repo`
5. Generate Pivot Audit Log.
   - You MUST create a persistent audit document detailing the pivot context, severity, root cause, and the required scope changes.
   - Save this file to `_iwish-output/3. Development/pivot-project/PIVOT-[YYYYMMDD-HHMM]-[summary].md`.
   - This ensures traceability and provides context for the subsequent reconciliation.
6. Regenerate Feature Hierarchy (MANDATORY for `epic` and `plan` severity).
   - If pivot severity is `epic` or `plan`, you MUST add `feature-hierarchy.md` to the reconciliation targets.
   - After PRD/Epic updates are complete, regenerate `{planning_artifacts}/feature-hierarchy.md` to reflect the new feature structure, sidebar positions, and cross-portal navigation changes.
   - Log: "✅ Feature Hierarchy regenerated after [epic|plan] pivot to synchronize navigation source-of-truth."
   - If `feature-hierarchy.md` does not yet exist, note that it will be created when `/create-epics-and-stories` runs.
7. Record reconciliation and required source-of-truth updates.
   - **MANDATORY ENFORCEMENT:** You MUST run the `iwish reconcile-change` CLI command to queue the drift record. Example: `iwish reconcile-change --type feature-tweak --summary "Changed scope to X" --story "1-1-abc" --log "path/to/PIVOT-log.md"`. This ensures the development agent will be blocked from implementation until the specs are updated.
8. Recommend the next canonical workflow instead of continuing blindly.

## Outputs

- 📄 `_iwish-output/3. Development/pivot-project/PIVOT-*.md` (Pivot Audit Log)
- pivot severity
- impacted source-of-truth layers
- required reconciliation scope
- recommended next workflow
- pause/continue guidance for implementation

## Notes

- `bootstrap-existing-project` fixes missing context.
- `pivot-project` fixes wrong direction after context already exists.
- `absorb-repo` fixes missing external capability/context.
