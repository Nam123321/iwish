---
story_id: "STORY-UIUX-4.1"
epic_id: "EPIC-UIUX-04"
title: "Define Retrieval-Sandwich Architecture"
status: "DONE"
assignee: "Vegeta"
priority: "P2"
depends_on: ["STORY-UIUX-3.3"]
phase: "forge"

---
# Story UIUX-4.1: Define Retrieval-Sandwich Architecture

## 1. Objective

Define a governed retrieval architecture so I-Wish can use the original UI/UX Pro Max repo as controlled evidence input while keeping the current absorb as the final brand-safe and product-safe decision layer.

## 1.1 Context

Epic 3 validation showed a split result:

- the current I-Wish absorb is stronger at brand fit, product fit, and governance readiness
- the original UI/UX Pro Max repo is stronger at reusable UX patterns, interaction-system completeness, and broad first-pass system scaffolding

That means the next improvement should not directly replace the current absorb or trust raw original-repo `--design-system` synthesis as source of truth. It should add a governed retrieval sandwich that sequences brand truth, product retrieval, style/landing retrieval, archetype rejection, and final I-Wish recommendation.

This story is architecture-first. It should document the sequencing, responsibilities, and rejection points before any data import or contract expansion story begins.

**Source artifacts:**
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md`
- `_iwish-output/validation-runs/uiux-pro-max-distro-brand-id-validation.md`
- `_iwish-output/validation-runs/uiux-pro-max-original-v2-notes.md`
- `_iwish-output/validation-runs/distro-ux-case-study-comparison.md`
- `_iwish-output/validation-runs/distro-master-design-compare.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-3.3-rollback-tuning.md`

**Target integration surface:**
- `docs/ui-ux-pro-max-specialist-integration/retrieval-sandwich-architecture.md`
- any directly related specialist-architecture doc or narrow workflow-facing architecture note if required by the active I-Wish structure

**Dependency state:**
- `STORY-UIUX-3.3` is done.

## 2. User Story

As a I-Wish workflow owner,  
I want a governed retrieval architecture,  
So that original-repo evidence improves absorb quality without becoming unfiltered design authority.

## 3. Acceptance Criteria

### AC1: Retrieval Sandwich Sequence Is Explicit
**Given** the original repo is available as a sandbox reference  
**When** the next absorb phase is documented  
**Then** the architecture explicitly sequences:
- brand truth extraction
- product archetype retrieval
- style / landing / UX pattern retrieval
- archetype rejection
- final I-Wish recommendation
**And** each stage has a clear role in the final decision.

### AC2: Original-Repo Synthesis Is Downgraded to Evidence
**Given** raw original-repo `--design-system` synthesis can drift off-brand  
**When** the retrieval-sandwich architecture is defined  
**Then** the architecture states that raw synthesis output is evidence only  
**And** the current I-Wish absorb remains the final governed decision layer.

### AC3: Rejection Logic Is Positioned Before Final Contract Output
**Given** retrieved archetypes may conflict with approved brand or product truth  
**When** the architecture defines the flow  
**Then** it shows where off-brand or off-product archetypes are rejected  
**And** it prevents those archetypes from silently blending into the final recommendation contract.

### AC4: Architecture Stays Narrow and Documentation-First
**Given** this story defines architecture rather than importing data  
**When** Vegeta implements it  
**Then** only the retrieval-architecture documentation surface and directly necessary supporting copy are changed  
**And** the story does not yet patch runtime workflows, import datasets, or alter the specialist contract.

### AC5: Architecture Reuses Existing Validation Evidence
**Given** Epic 3 and Distro comparison artifacts already exist  
**When** the retrieval-sandwich architecture is documented  
**Then** it references those validation artifacts as its justification  
**And** it does not invent a disconnected rationale for why the new architecture is needed.

## 4. Tasks

### T1: Define the Retrieval-Sandwich Sequence
- Document each stage in order.
- Explain what each stage consumes and produces.
- Clarify why the sequence exists.

### T2: Define the Governance Boundary
- State clearly that original-repo synthesis is evidence, not authority.
- Preserve I-Wish absorb as the final governed decision layer.
- Explain where authority and evidence diverge.

### T3: Define Archetype Rejection Placement
- Show where off-brand/off-product results are rejected.
- Clarify that rejected archetypes must not silently shape the final recommendation.
- Connect rejection logic to future evidence-field work.

### T4: Anchor the Architecture to Validation Evidence
- Cite the Distro benchmark and Epic 3 outputs.
- Explain which strengths are being borrowed from the original repo.
- Explain which strengths remain with the current absorb.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended architecture-doc surface and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Retrieval sandwich sequence is explicit | T1 | Stage order, inputs/outputs, role per stage | ✅ |
| AC2 | Original-repo synthesis is downgraded to evidence | T2 | Evidence-only rule, final decision layer | ✅ |
| AC3 | Rejection logic is positioned before final contract output | T3 | Rejection point, anti-blending rule | ✅ |
| AC4 | Architecture stays narrow and documentation-first | T5 | Diff check, narrow scope, no runtime patch | ✅ |
| AC5 | Architecture reuses existing validation evidence | T4 | Distro benchmark and Epic 3 references | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 5 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; docs-only architecture definition | 0 |
| Cross-Domain | 1 bounded context: I-Wish specialist retrieval architecture | 0 |
| Flow Complexity | No async runtime or state-machine changes in this story | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story should produce an architecture artifact, not a runnable retrieval engine.
- The architecture should explicitly preserve the current I-Wish absorb as the final decision layer.
- Use the Distro validation artifacts as the strongest evidence for why this architecture is needed.
- Do not import data, patch workflows, or modify the specialist output contract in this story.

## 8. Definition of Done

- [x] Retrieval-sandwich sequence is documented.
- [x] Original-repo synthesis is explicitly downgraded to evidence.
- [x] Rejection logic position is documented.
- [x] Existing validation evidence is referenced.
- [x] No unrelated workflows or datasets are patched/imported.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story defines the missing architecture needed to borrow original-repo strengths without losing I-Wish governance. |
| Data Integrity & State | 9 | No runtime or persisted application state changes; architecture remains documentation-only at this stage. |
| Security & Validation | 9 | No external runtime import is introduced yet; the story just defines the future control boundary. |
| Performance & Scalability | 9 | The architecture should improve retrieval quality without blindly expanding context or importing the full repo. |
| Error Handling & Recovery | 9 | Explicit rejection placement reduces the chance of silent drift from off-brand archetypes. |
| Code Quality & Maintainability | 9 | A centralized architecture artifact will keep later stories aligned and reduce ad hoc retrieval patches. |
| UX Empathy | 9 | The architecture is motivated by concrete brand-fit and product-fit failures observed in validation. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-4.1-retrieval-sandwich-architecture.md`
- `docs/ui-ux-pro-max-specialist-integration/retrieval-sandwich-architecture.md`

## 11. Vegeta Agent Record

### Planned

- Create the retrieval-sandwich architecture artifact.
- Define the evidence-vs-authority boundary.
- Define rejection placement.
- Anchor the architecture to validation artifacts.
- Validate KG and portability.

### Implementation Status

- Created `docs/ui-ux-pro-max-specialist-integration/retrieval-sandwich-architecture.md` as the centralized architecture artifact for the next absorb-improvement phase.
- Defined the stage order: brand truth, product truth, original-repo retrieval, archetype rejection, and final I-Wish absorb recommendation.
- Explicitly downgraded raw original-repo synthesis to evidence-only status and preserved the current I-Wish absorb as the final governed decision layer.
- Positioned archetype rejection before final contract output and documented why rejected candidates must not silently blend into the final recommendation.
- Anchored the architecture to existing Distro validation and Epic 3 evidence rather than inventing a disconnected rationale.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- `UIUX-4.1` is a documentation-first architecture story and should remain narrow.
- Runtime data import, workflow patches, and contract extension belong to later Epic 4 stories.
