---
story_id: "STORY-UIUX-2.2"
epic_id: "EPIC-UIUX-02"
title: "Add Design System Gate Invocation"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-UIUX-2.1", "STORY-UIUX-1.2", "STORY-UIUX-1.3", "STORY-UIUX-1.4"]
phase: "forge"

---
# Story UIUX-2.2: Add Design System Gate Invocation

## 1. Objective

Patch the Design System Gate so I-Wish can pass a concise, governed UI/UX Pro Max seed block into Stitch design-system generation, while keeping the approved Stitch and saved Design System outputs as the final source of truth.

## 1.1 Context

Epic 1 already defined the specialist wrapper, authority hierarchy, output contract, and conflict handling. Story `UIUX-2.1` introduced the first workflow invocation in visual foundation. This story moves one step later in the pipeline and integrates the specialist into `step-00b-design-system-gate.md`, specifically at the point where Stitch context is prepared for 9-category design-system generation.

This integration must remain narrow. It should strengthen Stitch prompt quality with product-aware visual seed direction, but it must not re-open already approved authority rules or allow UI/UX Pro Max to outrank the approved Stitch result once a Design System is selected and saved.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.1-visual-foundation-invocation.md`

**Target integration surface:**
- `step-00b-design-system-gate.md`
- any directly related Stitch context-preparation wrapper if required by existing I-Wish structure

**Dependency state:**
- `STORY-UIUX-2.1` is done.
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- `STORY-UIUX-1.4` is marked done in sprint status.

## 2. User Story

As a design-system workflow agent,  
I want UI/UX Pro Max to seed Stitch prompts,  
So that the 9-category design-system generation starts from a coherent product-aware direction.

## 3. Acceptance Criteria

### AC1: Design System Gate Invokes Specialist at Stitch Context Preparation Time
**Given** `step-00b-design-system-gate.md` is creating a portal Design System  
**When** the Stitch context template is prepared  
**Then** the workflow includes a concise UI/UX Pro Max recommendation block  
**And** the invocation happens before Stitch-specific generation starts.

### AC2: Seed Block Covers the Required Design Signals
**Given** the specialist is invoked from the Design System Gate  
**When** it returns a recommendation  
**Then** the Stitch seed block covers style direction, palette mood, typography mood, key effects, and anti-patterns  
**And** the block remains concise enough to guide Stitch without bloating the prompt.

### AC3: Standard Contract and Authority Fields Stay Visible
**Given** the specialist recommendation is captured for Design System Gate use  
**When** the workflow records or summarizes it  
**Then** the recommendation still preserves the I-Wish authority framing from `STORY-UIUX-1.3`  
**And** it includes `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check` in the saved or referenced recommendation structure.

### AC4: Approved Stitch and Final Design System Supersede the Seed
**Given** Stitch variants are generated and the user approves one  
**When** the final Design System is saved  
**Then** the approved Stitch/Design System values supersede the UI/UX Pro Max seed recommendation  
**And** the workflow explicitly prevents the seed block from remaining source of truth after approval.

### AC5: Existing Brand and I-Wish Constraints Still Win
**Given** approved brand guidance, I-Wish authority rules, or upstream visual-foundation constraints already exist  
**When** the Design System Gate prepares the specialist seed block  
**Then** the seed respects those constraints  
**And** any conflict is framed as advisory input rather than an override.

### AC6: Workflow Patch Stays Narrow
**Given** this story only targets the Design System Gate touchpoint  
**When** Vegeta implements it  
**Then** only `step-00b-design-system-gate.md` and directly necessary supporting copy are changed  
**And** the story does not patch story UI spec generation, review workflows, or downstream Stitch approval behavior beyond documenting supersession.

## 4. Tasks

### T1: Locate and Patch the Design System Gate Touchpoint
- Update `step-00b-design-system-gate.md` or the exact active Design System Gate workflow file.
- Add the specialist recommendation block at the Stitch context-preparation stage.
- Keep the patch surgical and limited to this workflow surface.

### T2: Define the Concise Stitch Seed Block
- Specify how the Design System Gate requests or records the seed recommendation.
- Ensure the block covers style direction, palette mood, typography mood, key effects, and anti-patterns.
- Keep the prompt payload concise and Stitch-oriented rather than verbose free-form analysis.

### T3: Preserve Contract and Authority Framing
- Ensure the recommendation still carries the I-Wish contract framing from `STORY-UIUX-1.3`.
- Require or preserve `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`.
- Make clear that the block is advisory seed context, not the Design System source of truth.

### T4: Enforce Post-Approval Supersession
- Add explicit wording that approved Stitch output and the saved Design System supersede the UI/UX Pro Max seed.
- Prevent later workflow text from treating the seed block as active authority after approval.
- Keep alignment with the non-override rules from `STORY-UIUX-1.2`.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended Design System Gate surface and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Design System Gate invokes specialist at Stitch context preparation time | T1 | Touchpoint location, invocation placement, pre-Stitch timing | ✅ |
| AC2 | Seed block covers the required design signals | T2 | Concise style, palette, typography, effects, anti-pattern capture | ✅ |
| AC3 | Standard contract and authority fields stay visible | T3 | Contract framing, conflict fields, authority preservation | ✅ |
| AC4 | Approved Stitch and final Design System supersede the seed | T4 | Post-approval supersession wording, source-of-truth protection | ✅ |
| AC5 | Existing brand and I-Wish constraints still win | T3 | Constraint carry-forward, advisory-only conflict framing | ✅ |
| AC6 | Workflow patch stays narrow | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; workflow integration only | 0 |
| Cross-Domain | 1 bounded context: I-Wish design-system workflow integration | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story is the second workflow-level invocation for the UI/UX Pro Max specialist.
- Treat `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the source of truth for authority and contract behavior.
- Reuse the design language established in `UIUX-2.1` where possible, but adapt it to Stitch prompt seeding rather than visual-foundation documentation.
- Do not patch `workflow-entry.md`, `iwish-bmm-create-ui-spec.md`, review workflows, or downstream approval logic in this story.
- Preserve existing I-Wish workflow tone and structure wherever possible.
- Keep the integration reversible and document-oriented; do not add unnecessary scripts.

## 8. Definition of Done

- [x] The Design System Gate invokes `ui-ux-pro-max-specialist` at the correct Stitch context-preparation point.
- [x] The Stitch seed block covers style, palette, typography mood, key effects, and anti-patterns.
- [x] The recommendation keeps I-Wish contract framing and conflict fields visible.
- [x] Approved Stitch and saved Design System values explicitly supersede the seed block.
- [x] Existing brand and I-Wish constraints are preserved.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story places the specialist at a precise Design System Gate touchpoint and preserves pre-approval vs post-approval authority boundaries. |
| Data Integrity & State | 9 | No application data or schema changes are involved; state changes are workflow-document only. |
| Security & Validation | 9 | No new executable surface or external installer path is introduced; validation stays repo-local. |
| Performance & Scalability | 9 | A concise seed block improves Stitch prompt quality without expanding the workflow into a broad design-analysis phase. |
| Error Handling & Recovery | 9 | Constraint carry-forward and post-approval supersession reduce the chance of stale advisory output becoming accidental truth. |
| Code Quality & Maintainability | 9 | The story isolates one workflow touchpoint and reuses the authority model already established in Epic 1. |
| UX Empathy | 9 | The Design System generation starts from more product-aware visual context while preserving user-approved Stitch outcomes. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.2-design-system-gate-invocation.md`
- `.agent/workflows/step-00b-design-system-gate.md`

## 11. Vegeta Agent Record

### Planned

- Patch the Design System Gate touchpoint.
- Add the concise Stitch seed block.
- Preserve contract framing and authority boundaries.
- Validate KG and portability.

### Implementation Status

- Patched `.agent/workflows/step-00b-design-system-gate.md` at the Stitch context-preparation stage, adding a dedicated UI/UX Pro Max Stitch Seed Gate before any Stitch-specific generation begins.
- Added a concise seed-block contract for Stitch prompts covering style direction, palette mood, typography mood, key effects, and anti-patterns.
- Preserved I-Wish contract framing by requiring `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check` in the referenced or saved recommendation structure.
- Added context-boundary and authority-guard language so approved brand guidance, upstream visual-foundation constraints, and I-Wish authority rules remain active.
- Added explicit supersession language in both the workflow and compiled Design System document so approved Stitch selections and the saved portal Design System outrank the advisory seed block.
- Added explicit Variant A / Variant B Stitch template behavior so missing seed context now blocks Stitch generation instead of forcing empty or fabricated `uiux_*` placeholders.
- Replaced the hard-coded style stack line with active-direction and active-constraint fields so the specialist seed block can actually influence Stitch prompt direction without fighting a fixed default style instruction.
- Confirmed this story did not patch story UI spec generation, review workflows, or unrelated downstream approval behavior.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the integration inside `step-00b-design-system-gate.md` instead of adding a wrapper workflow, because the story requires a narrow Design System Gate patch.
- Saved the UI/UX Pro Max advisory block as a Stitch seed record in `MASTER.md` so the workflow retains traceable context without confusing it for active post-approval authority.
- Made the “missing context” path operational by blocking Stitch generation outright until required seed inputs are present, which keeps the workflow aligned with the no-fabrication rule.
