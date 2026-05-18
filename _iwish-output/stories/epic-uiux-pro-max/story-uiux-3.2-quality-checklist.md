---
story_id: "STORY-UIUX-3.2"
epic_id: "EPIC-UIUX-03"
title: "Add Specialist Quality Checklist"
status: "DONE"
assignee: "Vegeta"
priority: "P2"
depends_on: ["STORY-UIUX-3.1"]
phase: "forge"

---
# Story UIUX-3.2: Add Specialist Quality Checklist

## 1. Objective

Define a compact quality checklist so reviewers can decide whether a UI/UX Pro Max recommendation actually helped, stayed neutral, or should be discarded under I-Wish governance.

## 1.1 Context

Story `UIUX-3.1` produced the scenario pack for validation runs. The next step is to define how reviewers judge recommendation quality itself. I-Wish now has multiple surfaces where `ui-ux-pro-max-specialist` may appear: visual foundation, Design System Gate, story UI specs, design review, and code review. Without a shared checklist, reviewers may make inconsistent decisions about whether the specialist was specific, governance-compliant, or useful.

This story should produce a small reviewer-facing checklist with explicit disposition options. It should help reviewers decide whether a recommendation should be discarded, used only as critique, or promoted into a more durable I-Wish rule. The checklist must stay practical and must not create a heavyweight approval bureaucracy.

**Source artifacts:**
- `docs/ui-ux-pro-max-specialist-integration/validation-scenarios.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-3.1-validation-scenarios.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.4-review-invocation.md`

**Target integration surface:**
- `docs/ui-ux-pro-max-specialist-integration/quality-checklist.md`
- `.agent/workflows/iwish-bmm-code-review.md`
- any directly related reviewer-facing artifact only if required by the active I-Wish structure

**Dependency state:**
- `STORY-UIUX-3.1` is done.

## 2. User Story

As a reviewer,  
I want a checklist for deciding whether UI/UX Pro Max helped,  
So that the team can tune or rollback the integration.

## 3. Acceptance Criteria

### AC1: Checklist Covers the Required Quality Dimensions
**Given** a UI/UX Pro Max recommendation is included in a workflow artifact  
**When** a reviewer assesses it  
**Then** the checklist asks whether the recommendation was specific, source-of-truth compliant, persona-aware, implementable, accessible, and concise.

### AC2: Disposition Options Are Explicit
**Given** a recommendation is generic or conflicts with approved artifacts  
**When** the checklist is applied  
**Then** the reviewer can mark it as `Discard`, `Use as critique`, or `Promote to I-Wish rule`.

### AC3: Checklist Is Reusable Across Review Surfaces
**Given** the specialist may appear in planning artifacts, UI specs, design review, or code review  
**When** the checklist is used  
**Then** it stays generic enough to reuse across those surfaces  
**And** it does not depend on one specific workflow only.

### AC4: Checklist Supports Tuning Decisions
**Given** a team is reviewing repeated specialist behavior over time  
**When** checklist outcomes are collected  
**Then** the checklist helps distinguish useful guidance from noisy or conflicting guidance  
**And** it supports later tuning or rollback decisions.

### AC5: Workflow Patch Stays Narrow
**Given** this story is checklist-first  
**When** Vegeta implements it  
**Then** only the checklist documentation surface and directly necessary reviewer-facing supporting copy are changed  
**And** the story does not patch unrelated generation workflows.

## 4. Tasks

### T1: Create the Specialist Quality Checklist Artifact
- Create a reviewer-facing checklist document.
- Include the required dimensions: specific, source-of-truth compliant, persona-aware, implementable, accessible, concise.
- Keep the checklist compact and reusable.

### T2: Define Disposition Guidance
- Add explicit disposition options: `Discard`, `Use as critique`, `Promote to I-Wish rule`.
- Explain when each disposition should be used.
- Keep the guidance practical rather than bureaucratic.

### T3: Add Narrow Reviewer-Facing Workflow Guidance
- Add a small pointer in the review surface so reviewers know the checklist exists.
- Do not over-expand workflow behavior.
- Keep the patch reviewer-facing and proportionate.

### T4: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended checklist/reviewer-facing surfaces and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Checklist covers the required quality dimensions | T1 | Checklist dimensions, compact reusable format | ✅ |
| AC2 | Disposition options are explicit | T2 | Disposition definitions and usage guidance | ✅ |
| AC3 | Checklist is reusable across review surfaces | T1 | Surface-agnostic artifact wording | ✅ |
| AC4 | Checklist supports tuning decisions | T2 | Outcome interpretation for tuning/rollback | ✅ |
| AC5 | Workflow patch stays narrow | T4 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 5 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; docs + small reviewer guidance only | 0 |
| Cross-Domain | 1 bounded context: I-Wish review governance documentation | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story should produce a reviewer-facing checklist artifact, not a heavy scoring framework.
- Reuse the validation language from `UIUX-3.1` where useful.
- A narrow pointer from an existing review surface is acceptable; broad workflow rewrites are not.
- Do not patch generation workflows in this story.

## 8. Definition of Done

- [x] Quality checklist is documented.
- [x] Disposition options are documented.
- [x] Checklist is reusable across review surfaces.
- [x] Reviewer-facing guidance stays narrow.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story gives reviewers a concrete way to assess whether specialist guidance is actually valuable or just noisy. |
| Data Integrity & State | 9 | No application or schema state is changed; only review-governance documentation is added. |
| Security & Validation | 9 | No new executable or external install surface is introduced; validation remains repo-local. |
| Performance & Scalability | 9 | A small checklist scales better than ad hoc reviewer memory and avoids heavy governance overhead. |
| Error Handling & Recovery | 9 | Clear dispositions support later rollback/tuning decisions by distinguishing weak advice from promotable patterns. |
| Code Quality & Maintainability | 9 | The story isolates one checklist artifact with only narrow reviewer-facing integration. |
| UX Empathy | 9 | The checklist helps the team evaluate whether recommendations were actually useful for real user-facing work. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-3.2-quality-checklist.md`
- `docs/ui-ux-pro-max-specialist-integration/quality-checklist.md`
- `.agent/workflows/iwish-bmm-code-review.md`

## 11. Vegeta Agent Record

### Planned

- Create the specialist quality checklist artifact.
- Add disposition guidance.
- Add narrow reviewer-facing guidance.
- Validate KG and portability.

### Implementation Status

- Created `docs/ui-ux-pro-max-specialist-integration/quality-checklist.md` as a reusable reviewer-facing checklist artifact.
- Added the required dimensions: specific, source-of-truth compliant, persona-aware, implementable, accessible, and concise.
- Added explicit dispositions: `Discard`, `Use as critique`, and `Promote to I-Wish rule`, plus lightweight guidance for when to use each.
- Patched `.agent/workflows/iwish-bmm-code-review.md` with a narrow reviewer-facing pointer to the checklist and its disposition options.
- Confirmed this story did not patch generation workflows or unrelated review surfaces.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the checklist as a reusable documentation artifact and added only a narrow pointer in code review, avoiding broad workflow expansion.
