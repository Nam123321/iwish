---
story_id: "STORY-UIUX-2.5"
epic_id: "EPIC-UIUX-02"
title: "Add Master + Page Override Guidance"
status: "DONE"
assignee: "Vegeta"
priority: "P2"
depends_on: ["STORY-UIUX-2.3", "STORY-UIUX-1.2", "STORY-UIUX-1.3", "STORY-UIUX-1.4"]
phase: "forge"

---
# Story UIUX-2.5: Add Master + Page Override Guidance

## 1. Objective

Patch I-Wish's Design System persistence and story UI spec retrieval rules so project-wide design rules remain stable in `MASTER.md`, while justified page-specific deviations are stored explicitly under a stable page slug and applied only to the relevant page/story context.

## 1.1 Context

Epic 1 established that page overrides are subordinate to the approved portal Design System but still stronger than raw specialist recommendations when they apply to the active page. Story `UIUX-2.2` integrated Design System Gate persistence into `MASTER.md`, and story `UIUX-2.3` wired story UI spec generation to respect approved Design System and Stitch authority. This story closes the loop by defining where page-specific overrides live and how they are read.

The main risk here is precedence drift. A page override should not quietly become a second master design system, and it must not override an already approved Stitch screen for that same page state. The workflow therefore needs explicit persistence location, read order, scope limits, and a clear statement that approved Stitch remains authoritative until a newer page-state screen is approved.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.2-design-system-gate-invocation.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.3-story-ui-spec-invocation.md`

**Target integration surface:**
- `.agent/workflows/step-00b-design-system-gate.md`
- `.agent/workflows/workflow-entry.md`
- any directly related Design System persistence or story UI spec retrieval wrapper if required by existing I-Wish structure

**Dependency state:**
- `STORY-UIUX-2.3` is done.
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- `STORY-UIUX-1.4` is done.

## 2. User Story

As a I-Wish UX workflow owner,  
I want Master + page override rules,  
So that project-wide design rules are stable but page-specific exceptions are explicit.

## 3. Acceptance Criteria

### AC1: Page Override Persistence Location Is Explicit
**Given** a portal Design System exists  
**When** a page needs a justified deviation  
**Then** the workflow records it under `design-system/{portal-slug}/pages/{page-slug}.md`  
**And** the page override explains what changes, why, and which master rules still apply.

### AC2: Story UI Spec Reads Page Override After MASTER.md
**Given** a story UI spec is generated for a page  
**When** a page override exists  
**Then** the workflow reads the page override after `MASTER.md`  
**And** the override applies only to that page/story context.

### AC3: Approved Stitch Screen Still Wins for the Same Page State
**Given** a page override exists for a page  
**When** an approved Stitch screen already exists for that same page state  
**Then** the Stitch visual contract remains authoritative until a newer screen is approved  
**And** the override may shape only future generation work, not replace the already approved page-state artifact.

### AC4: Override Scope Remains Narrow and Traceable
**Given** a page override is created or consumed  
**When** the workflow records or reads it  
**Then** the override documents which master rules change, which rules still apply, and why the exception is justified  
**And** it does not behave like a second portal-wide master file.

### AC5: Retrieval Order and Authority Are Machine-Clear
**Given** page-specific design guidance is needed  
**When** the workflow resolves active design authority  
**Then** the order is explicit: `MASTER.md` first, then page override, then approved Stitch visual contract for the active page state  
**And** the workflow makes clear which layer is currently authoritative.

### AC6: Workflow Patch Stays Narrow
**Given** this story targets persistence and retrieval guidance only  
**When** Vegeta implements it  
**Then** only the Design System persistence surface and story UI spec retrieval surface and directly necessary supporting copy are changed  
**And** the story does not patch review workflows or unrelated generation logic.

## 4. Tasks

### T1: Patch Design System Persistence Guidance
- Update `.agent/workflows/step-00b-design-system-gate.md`.
- Document the page override persistence path under `design-system/{portal-slug}/pages/{page-slug}.md`.
- Define what a page override must record: changed rules, rationale, and inherited rules.

### T2: Patch Story UI Spec Retrieval Guidance
- Update `.agent/workflows/workflow-entry.md`.
- Add explicit read order: `MASTER.md` first, then page override for the active page/story context.
- Limit override scope to the relevant page/story only.

### T3: Preserve Stitch Precedence for Approved Page States
- Add explicit wording that an approved Stitch screen for the same page state remains authoritative.
- Allow page overrides to shape future generation only when no approved page-state Stitch artifact already exists.
- Keep alignment with the authority order from `STORY-UIUX-1.2`.

### T4: Keep Override Governance Traceable
- Define a stable page override document shape or checklist.
- Make clear that page overrides are child rules of the portal Design System, not peer masters.
- Preserve clear traceability for what changed and why.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended persistence/retrieval surfaces and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Page override persistence location is explicit | T1 | Override path, content requirements, rationale/inheritance | ✅ |
| AC2 | Story UI spec reads page override after MASTER.md | T2 | Retrieval order, page/story scoping | ✅ |
| AC3 | Approved Stitch screen still wins for the same page state | T3 | Stitch precedence, future-generation-only rule | ✅ |
| AC4 | Override scope remains narrow and traceable | T4 | Stable override shape, traceability, no second master | ✅ |
| AC5 | Retrieval order and authority are machine-clear | T2 | Authority resolution order, current-authority wording | ✅ |
| AC6 | Workflow patch stays narrow | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; workflow integration only | 0 |
| Cross-Domain | 1 bounded context: I-Wish design-system persistence and retrieval guidance | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story formalizes page override persistence and retrieval around the existing `MASTER.md` pattern.
- Treat `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the source of truth for authority interpretation.
- Patch the Design System persistence surface and story UI spec retrieval surface only.
- Keep the integration reversible and document-oriented; do not add unnecessary scripts.
- Preserve the rule that approved Stitch visual contract still wins for already approved page states.

## 8. Definition of Done

- [x] Page override persistence convention is documented under `design-system/{portal-slug}/pages/{page-slug}.md`.
- [x] Retrieval order is documented as `MASTER.md` then page override for the active page/story context.
- [x] Approved Stitch page-state precedence is explicit.
- [x] Override scope and inherited-rule traceability are documented.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story formalizes where overrides live and how they are applied without breaking existing authority order. |
| Data Integrity & State | 9 | No schema or app-state changes are involved; state changes are workflow-document only. |
| Security & Validation | 9 | No new executable or external install surface is introduced; validation remains repo-local. |
| Performance & Scalability | 9 | Retrieval order becomes explicit and stable, reducing future branching ambiguity in story UI spec generation. |
| Error Handling & Recovery | 9 | Stitch-precedence wording reduces the risk of page overrides overwriting already approved visual artifacts. |
| Code Quality & Maintainability | 9 | The story isolates two workflow touchpoints and reuses the authority model already established in Epic 1. |
| UX Empathy | 9 | Teams can support justified page-level deviations without destabilizing portal-wide design consistency. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.5-master-page-overrides.md`
- `.agent/workflows/step-00b-design-system-gate.md`
- `.agent/workflows/workflow-entry.md`

## 11. Vegeta Agent Record

### Planned

- Patch the Design System persistence surface.
- Patch the story UI spec retrieval surface.
- Preserve Stitch precedence and override traceability.
- Validate KG and portability.

### Implementation Status

- Patched `.agent/workflows/step-00b-design-system-gate.md` to document the page override persistence path under `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md`.
- Added a stable page override document shape covering changed rules, justification, inherited master rules, and Stitch precedence note.
- Patched `.agent/workflows/workflow-entry.md` to read `MASTER.md` first, then the page override for the active page/story context.
- Added explicit authority resolution language so approved Stitch screens for the same page state remain authoritative until a newer screen is approved.
- Added page-override-aware context loading for story-level specialist requests and UI spec output protection.
- Added explicit `page` / `page-slug` derivation rules so persistence and retrieval use a stable filesystem-safe identifier rather than an ambiguous raw page label.
- Confirmed this story did not patch review workflows or unrelated portal-generation logic.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept persistence guidance inside `step-00b-design-system-gate.md` and retrieval guidance inside `workflow-entry.md`, because those are the narrowest active surfaces for `MASTER.md` creation and story-level authority resolution.
- Chose a child-rule model for page overrides so they remain explicit and traceable without behaving like a second portal-wide design master.
