---
story_id: "STORY-UIUX-2.1"
epic_id: "EPIC-UIUX-02"
title: "Add Visual Foundation Invocation"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-UIUX-1.2", "STORY-UIUX-1.3", "STORY-UIUX-1.4"]
phase: "forge"

---
# Story UIUX-2.1: Add Visual Foundation Invocation

## 1. Objective

Patch the visual-foundation stage so I-Wish can invoke `ui-ux-pro-max-specialist` at the right moment, turning product, audience, and emotional-direction inputs into a seed design recommendation before Stitch work begins.

## 1.1 Context

Epic 1 has already established the specialist wrapper, authority hierarchy, output contract, and conflict resolution rules. This story is the first workflow-level integration point in Epic 2. It should introduce a narrow invocation into the visual-foundation workflow without changing any later Design System Gate or Stitch authority.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`

**Target integration surface:**
- `step-08-visual-foundation.md`
- any directly related wrapper or calling workflow if required by existing I-Wish structure

**Dependency state:**
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- `STORY-UIUX-1.4` is marked done in sprint status.

## 2. User Story

As a UX facilitator,  
I want UI/UX Pro Max to inform early visual direction,  
So that color, typography, style, and anti-pattern decisions are product-aware before Stitch work begins.

## 3. Acceptance Criteria

### AC1: Visual Foundation Invokes Specialist at the Right Time
**Given** `step-08-visual-foundation.md` or its equivalent visual foundation workflow is running  
**When** product type, target users, and desired emotional response are already known  
**Then** the workflow invokes `ui-ux-pro-max-specialist` for a design recommendation  
**And** the invocation happens before any Stitch-specific generation step.

### AC2: Output Uses the Standard Contract
**Given** the specialist is invoked from visual foundation  
**When** it returns a recommendation  
**Then** the workflow captures the result using the output contract from `STORY-UIUX-1.3`  
**And** the summary includes `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`.

### AC3: Result Is Seed Direction, Not Source of Truth
**Given** the specialist recommendation has been generated  
**When** the visual foundation step records the result  
**Then** it is labeled as seed direction only  
**And** it does not become the final visual source of truth ahead of the Design System Gate or approved Stitch artifacts.

### AC4: Brand Conflict Handling Is Explicit
**Given** the user already has approved brand guidelines  
**When** UI/UX Pro Max recommends conflicting brand choices  
**Then** brand guidelines win  
**And** the specialist output is constrained to implementation advice, anti-patterns, or optional review notes rather than replacing brand decisions.

### AC5: Skip Conditions Remain Intact
**Given** the workflow lacks enough context to produce a meaningful visual recommendation  
**When** product type, target users, or desired emotional response are missing  
**Then** the specialist is not invoked yet  
**And** the workflow continues gathering required context first rather than fabricating style direction.

### AC6: Workflow Patch Stays Narrow
**Given** this is the first Epic 2 integration story  
**When** Vegeta implements it  
**Then** only the visual-foundation touchpoint and directly necessary supporting copy are changed  
**And** the story does not patch Design System Gate, story UI spec generation, or review workflows.

## 4. Tasks

### T1: Locate and Patch the Visual Foundation Touchpoint
- Update `step-08-visual-foundation.md` or the exact active visual-foundation workflow file.
- Add an invocation point after product type, target users, and emotional-response context are known.
- Keep the patch surgical and limited to this workflow surface.

### T2: Inject the Specialist Contract
- Capture the specialist output using the contract defined in `STORY-UIUX-1.3`.
- Ensure the workflow requests or records `Product Type`, `Recommended Direction`, `Alternatives`, `Color/Tone`, `Typography`, `Interaction Notes`, `Anti-Patterns`, `Implementation Checklist`, `Conflict Status`, `Winning Authority`, `I-Wish Conflict Check`, and `Next Workflow Use`.

### T3: Enforce Seed-Only Positioning
- Label the specialist result as seed direction.
- State that the recommendation is advisory until Design System Gate approval and later Stitch approval.
- Prevent the workflow text from implying that UI/UX Pro Max becomes source of truth.

### T4: Add Brand and Missing-Context Guards
- Add brand-guideline precedence rules to the workflow.
- Add a missing-context guard so the workflow does not invoke the specialist too early.
- Ensure conflicts are routed through the authority hierarchy from `STORY-UIUX-1.2`.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended workflow surface and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Visual foundation invokes specialist at the right time | T1 | Touchpoint location, invocation placement, pre-Stitch timing | ✅ |
| AC2 | Output uses the standard contract | T2 | Contract field capture, conflict fields included | ✅ |
| AC3 | Result is seed direction, not source of truth | T3 | Seed labeling, authority statement, no source-of-truth leak | ✅ |
| AC4 | Brand conflict handling is explicit | T4 | Brand precedence, constrained output behavior | ✅ |
| AC5 | Skip conditions remain intact | T4 | Missing-context guard, no fabricated design direction | ✅ |
| AC6 | Workflow patch stays narrow | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; workflow integration only | 0 |
| Cross-Domain | 1 bounded context: I-Wish UX workflow integration | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story is the first workflow patch for the UI/UX Pro Max specialist.
- Treat `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the source of truth for authority and contract behavior.
- Do not patch `step-00b-design-system-gate.md`, `workflow-entry.md`, `iwish-bmm-create-ui-spec.md`, or review workflows in this story.
- Preserve existing I-Wish workflow tone and structure wherever possible.
- Keep the integration reversible and document-oriented; do not add unnecessary scripts.

## 8. Definition of Done

- [x] The visual-foundation workflow invokes `ui-ux-pro-max-specialist` at the correct point.
- [x] The workflow records or requests the standard specialist contract fields.
- [x] The output is explicitly framed as seed direction only.
- [x] Brand-guideline precedence is documented.
- [x] Missing-context skip behavior is documented.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story places the specialist at a precise pre-Stitch point and constrains it with the existing contract and hierarchy. |
| Data Integrity & State | 9 | No application data or schema changes are involved; state changes are workflow-document only. |
| Security & Validation | 9 | No new executable surface or external installer path is introduced; validation stays repo-local. |
| Performance & Scalability | 9 | A narrow invocation point reduces prompt bloat and keeps later integrations modular. |
| Error Handling & Recovery | 9 | Brand-conflict and missing-context guards prevent low-signal or misleading recommendations. |
| Code Quality & Maintainability | 9 | The story isolates one workflow touchpoint and avoids coupling multiple Epic 2 integrations together. |
| UX Empathy | 9 | Early visual direction becomes more product-aware without bypassing Design System Gate or Stitch approval. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.1-visual-foundation-invocation.md`
- `.agent/workflows/step-08-visual-foundation.md`

## 11. Vegeta Agent Record

### Planned

- Patch the visual-foundation touchpoint.
- Inject the standard specialist contract.
- Add seed-only positioning and brand/missing-context guards.
- Validate KG and portability.

### Implementation Status

- Patched `.agent/workflows/step-08-visual-foundation.md` with a dedicated UI/UX Pro Max seed-direction gate before any Stitch-specific generation work.
- Added the missing-context guard so the specialist is invoked only after product type, target users, and emotional response are known.
- Added brand-guideline precedence handling and explicit seed-only positioning so the specialist cannot become source of truth at this stage.
- Injected the full Story UIUX-1.3 output contract into the workflow's advisory capture and saved-document structure.
- Refined the saved-document structure so it has an explicit `Not Invoked Yet` variant and never requires fabricated specialist fields when context is incomplete.
- Refined the brand-conflict save structure so downstream steps can distinguish active brand-led choices from constrained specialist advisory notes.
- Confirmed this story did not patch Design System Gate, story UI spec generation, or review workflows.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the integration inside `step-08-visual-foundation.md` instead of adding a new wrapper workflow, because the story requires a narrow patch at the existing touchpoint.
- Recorded the specialist output in the visual foundation document itself as advisory seed direction so later steps can inherit context without mistaking it for approved design truth.
- Added two explicit save variants so the workflow remains operational in both invoked and not-yet-invoked branches without forcing placeholder specialist content.
