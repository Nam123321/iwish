---
story_id: "STORY-UIUX-2.3"
epic_id: "EPIC-UIUX-02"
title: "Add Story UI Spec Invocation"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-UIUX-2.2", "STORY-UIUX-1.2", "STORY-UIUX-1.3", "STORY-UIUX-1.4"]
phase: "forge"

---
# Story UIUX-2.3: Add Story UI Spec Invocation

## 1. Objective

Patch the story UI spec workflow so I-Wish can invoke `ui-ux-pro-max-specialist` after the Design System Gate and User Simulation Gate pass, producing story-specific design guidance that respects the approved portal Design System and Stitch visual contract.

## 1.1 Context

Epic 1 established the specialist wrapper, authority hierarchy, output contract, and conflict rules. Story `UIUX-2.1` added the early visual-foundation invocation. Story `UIUX-2.2` added Design System Gate seed guidance for Stitch. This story moves one step closer to feature execution by integrating the specialist into per-story UI spec generation.

The goal here is not to let UI/UX Pro Max redesign the portal from scratch. The goal is to help each story UI spec account for its local domain, persona, interaction risk, and implementation nuance while staying under I-Wish governance. That means the specialist can enrich the story-level recommendation layer, but it must not outrank the approved portal `MASTER.md`, approved Stitch screens, extracted visual contract, or User Simulation Guardian findings.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.1-visual-foundation-invocation.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.2-design-system-gate-invocation.md`

**Target integration surface:**
- `workflow-entry.md`
- `iwish-bmm-create-ui-spec.md`
- any directly related per-story UI spec wrapper if required by existing I-Wish structure

**Dependency state:**
- `STORY-UIUX-2.2` is done.
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- `STORY-UIUX-1.4` is marked done in sprint status.

## 2. User Story

As a story UI spec author,  
I want story-specific UI/UX Pro Max guidance,  
So that per-story screens inherit the portal design system while accounting for the story's domain and UI risks.

## 3. Acceptance Criteria

### AC1: Story UI Spec Invokes Specialist Only After Existing I-Wish Gates Pass
**Given** `workflow-entry.md` or its active equivalent is creating a per-story UI spec  
**When** the Design System Gate and User Simulation Gate pass  
**Then** the workflow invokes `ui-ux-pro-max-specialist` with story-specific context  
**And** the invocation happens only after those gates are satisfied.

### AC2: Story-Level Specialist Input Uses the Right Context Bundle
**Given** the specialist is invoked for a story UI spec  
**When** the request is prepared  
**Then** it includes product, portal, story title, acceptance criteria, persona, and Design System summary  
**And** it carries forward any relevant portal-level authority context needed to avoid conflicts.

### AC3: UI Spec Includes a Dedicated Specialist Notes Section
**Given** the specialist returns a recommendation  
**When** the story UI spec is finalized  
**Then** the UI spec includes a `UI/UX Pro Max Specialist Notes` section  
**And** that section uses the governed I-Wish output contract rather than loose design prose.

### AC4: Approved Stitch Visual Contract Remains Authoritative
**Given** UI/UX Pro Max recommends a layout or interaction pattern inconsistent with approved Stitch screens or extracted visual contract  
**When** the UI spec is finalized  
**Then** the recommendation is rejected or reframed as a checklist or advisory note  
**And** the approved Stitch visual contract remains authoritative.

### AC5: Story-Level Guidance Stays Bounded and Non-Overriding
**Given** the specialist is used inside story UI spec generation  
**When** the UI spec captures its output  
**Then** the guidance must remain subordinate to the portal Design System, approved Stitch artifacts, User Simulation Guardian, Design Consultation, and UX Guardian  
**And** any conflict must be framed through the established I-Wish conflict-status contract.

### AC6: Workflow Patch Stays Narrow
**Given** this story targets story UI spec generation only  
**When** Vegeta implements it  
**Then** only the story UI spec integration surface and directly necessary supporting copy are changed  
**And** the story does not patch Design System Gate logic, review workflows, or unrelated portal-level workflows.

## 4. Tasks

### T1: Locate and Patch the Story UI Spec Touchpoint
- Update `workflow-entry.md`, `iwish-bmm-create-ui-spec.md`, or the exact active per-story UI spec workflow surface.
- Add the specialist invocation after the Design System Gate and User Simulation Gate are satisfied.
- Keep the patch surgical and limited to story UI spec generation.

### T2: Define the Story-Specific Specialist Request
- Ensure the specialist request includes product, portal, story title, acceptance criteria, persona, and Design System summary.
- Carry forward any relevant approved portal-level authority context needed to avoid story-level drift.
- Keep the request specific to the story rather than re-running portal-wide design discovery.

### T3: Add the Specialist Notes Section
- Add a `UI/UX Pro Max Specialist Notes` section to the story UI spec output shape.
- Ensure the section uses the governed I-Wish contract from `STORY-UIUX-1.3`.
- Preserve `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`.

### T4: Protect the Stitch Visual Contract and Existing Governance
- Add explicit wording that approved Stitch screens and extracted visual contract remain authoritative when conflicts appear.
- Reframe conflicting specialist recommendations as advisory notes or checklist items rather than source-of-truth changes.
- Keep alignment with the authority hierarchy and conflict procedure from `STORY-UIUX-1.2` and `STORY-UIUX-1.4`.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended story UI spec surface and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Story UI spec invokes specialist only after existing I-Wish gates pass | T1 | Touchpoint location, invocation placement, gate ordering | ✅ |
| AC2 | Story-level specialist input uses the right context bundle | T2 | Context payload, authority carry-forward, story specificity | ✅ |
| AC3 | UI spec includes a dedicated specialist notes section | T3 | Section structure, contract usage, conflict fields | ✅ |
| AC4 | Approved Stitch visual contract remains authoritative | T4 | Conflict rejection or downgrade, Stitch authority wording | ✅ |
| AC5 | Story-level guidance stays bounded and non-overriding | T3 | Contract framing, hierarchy carry-forward, conflict-status behavior | ✅ |
| AC6 | Workflow patch stays narrow | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; workflow integration only | 0 |
| Cross-Domain | 1 bounded context: I-Wish story UI spec workflow integration | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story is the story-level invocation point for the UI/UX Pro Max specialist.
- Treat `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the source of truth for authority and contract behavior.
- Reuse the language and contract patterns established in `UIUX-2.1` and `UIUX-2.2` where possible, but adapt them to per-story UI specs rather than portal-wide workflow artifacts.
- Do not patch `step-00b-design-system-gate.md`, review workflows, or unrelated portal-level generation logic in this story.
- Preserve existing I-Wish workflow tone and structure wherever possible.
- Keep the integration reversible and document-oriented; do not add unnecessary scripts.

## 8. Definition of Done

- [x] The story UI spec workflow invokes `ui-ux-pro-max-specialist` only after the Design System Gate and User Simulation Gate pass.
- [x] The specialist request includes the required story-specific context bundle.
- [x] The UI spec includes a `UI/UX Pro Max Specialist Notes` section using the governed contract.
- [x] Approved Stitch visual contract remains authoritative when conflicts occur.
- [x] Story-level guidance remains bounded by existing I-Wish governance.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story places the specialist at the right story-level moment and preserves upstream gate ordering and visual authority. |
| Data Integrity & State | 9 | No application data or schema changes are involved; state changes are workflow-document only. |
| Security & Validation | 9 | No new executable surface or external installer path is introduced; validation stays repo-local. |
| Performance & Scalability | 9 | Story-level invocation keeps specialist usage targeted to high-value per-story context instead of broad repeated portal-wide generation. |
| Error Handling & Recovery | 9 | The story explicitly contains conflict handling so contradictory guidance degrades to advisory notes rather than mutating approved contract truth. |
| Code Quality & Maintainability | 9 | The story isolates one workflow touchpoint and reuses existing I-Wish authority rules instead of inventing a parallel design-governance layer. |
| UX Empathy | 9 | Per-story UI specs become more domain-aware without bypassing Design System Gate, User Simulation Guardian, or Stitch approval. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.3-story-ui-spec-invocation.md`
- `.agent/workflows/workflow-entry.md`

## 11. Vegeta Agent Record

### Planned

- Patch the story UI spec touchpoint.
- Add the story-specific specialist request.
- Add the governed specialist notes section.
- Validate KG and portability.

### Implementation Status

- Patched `.agent/workflows/workflow-entry.md` with a dedicated story-spec specialist gate that runs only after Design System Gate and User Simulation Gate pass.
- Added the required story-specific context bundle for the specialist request: product, portal, story key/title, acceptance criteria, persona/device, Design System summary, and relevant I-Wish authority constraints.
- Added a required `UI/UX Pro Max Specialist Notes` section to the final UI spec output shape using the governed I-Wish contract.
- Added explicit conflict handling so approved Stitch screens and extracted visual contract remain authoritative when specialist guidance disagrees.
- Added handoff authority reminders so downgraded recommendations remain advisory and do not leak into implementation as source-of-truth changes.
- Added a post-approval reconciliation pass so `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check` are re-checked against the final approved story-level Stitch screen(s) before the UI spec and handoff are considered final.
- Replaced the loose notes guidance with an exact `UI/UX Pro Max Specialist Notes` section template so agents must emit the governed I-Wish contract fields in a stable shape.
- Confirmed this story did not patch Design System Gate logic, review workflows, or unrelated portal-level workflows.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the implementation inside `.agent/workflows/workflow-entry.md` because the active wrapper already delegates directly to that file, so no wrapper patch was needed.
- Bound the specialist notes tightly to the UI spec output contract so downstream handoff can consume one governed artifact without re-parsing free-form design prose.
- Required post-approval conflict reconciliation in the workflow itself so specialist notes cannot silently drift away from the final approved Stitch visual contract.
