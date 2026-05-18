---
story_id: "STORY-UIUX-1.2"
epic_id: "EPIC-UIUX-01"
title: "Define Authority Hierarchy and Non-Override Rule"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-UIUX-1.1"]
phase: "forge"

---
# Story UIUX-1.2: Define Authority Hierarchy and Non-Override Rule

## 1. Objective

Strengthen the `ui-ux-pro-max-specialist` skill with an explicit I-Wish design authority hierarchy, non-override rule, and no-design-system mode so UI/UX Pro Max remains a recommendation engine under I-Wish governance.

## 1.1 Context

Story UIUX-1.1 created the initial specialist wrapper and registered it in the Knowledge Graph. This story tightens the governance layer before any workflow patches are added in later stories.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `_iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md`
- `docs/ui-ux-pro-max-specialist-integration/gap-analysis.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`

**Dependency state:**
- `STORY-UIUX-1.1` is done.
- The specialist exists as a `SKILL_ATTACHMENT`.
- Workflow patch stories remain out of scope for this story.

## 2. User Story

As a I-Wish workflow owner,  
I want explicit authority rules for design decisions,  
So that UI/UX Pro Max cannot conflict with approved I-Wish Design System or Stitch screens.

## 3. Acceptance Criteria

### AC1: Authority Hierarchy Is Explicit
**Given** `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` exists  
**When** this story is complete  
**Then** it documents the authority order from highest to lowest:
1. I-Wish workflow gates and user approvals
2. Approved portal Design System `MASTER.md`
3. Approved Stitch screens and extracted HTML/CSS visual contract
4. Page-specific design-system overrides, when present
5. User Simulation Guardian findings
6. Design Consultation and UX Guardian decisions
7. UI/UX Pro Max Specialist recommendations

### AC2: Approved I-Wish Artifacts Win Conflicts
**Given** an approved portal Design System or Stitch screen exists  
**When** UI/UX Pro Max recommends a conflicting color, typography, layout, interaction, animation, component structure, or accessibility tradeoff  
**Then** the approved I-Wish artifact wins  
**And** the UI/UX Pro Max output is recorded only as a recommendation, critique note, or future improvement candidate.

### AC3: No-Design-System Mode Is Bounded
**Given** no Design System exists for the portal  
**When** a visual foundation or design-system gate is run  
**Then** UI/UX Pro Max can provide seed recommendations for style, palette, typography mood, interaction tone, effects, and anti-patterns  
**And** those recommendations must still be approved through I-Wish's Design System Gate before they become source of truth.

### AC4: Specialist Output Must Include Conflict Status
**Given** a I-Wish agent invokes UI/UX Pro Max after this story  
**When** the specialist returns advice  
**Then** it must state one of these conflict statuses:
- `NO_CONFLICT`
- `CONFLICT_WITH_DESIGN_SYSTEM`
- `CONFLICT_WITH_STITCH`
- `CONFLICT_WITH_USER_SIMULATION`
- `CONFLICT_WITH_DESIGN_CONSULTATION`
- `CONFLICT_WITH_UX_GUARDIAN`
**And** any conflict status must name the winning I-Wish authority.

### AC5: No Workflow Patches Are Introduced
**Given** this story is part of Epic 1 governance work  
**When** Vegeta implements it  
**Then** no I-Wish workflow files are patched  
**And** later workflow invocation changes remain assigned to Epic 2 stories.

## 4. Tasks

### T1: Expand Authority Hierarchy in Specialist Skill
- Update `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- Replace the current short authority order with the full ordered hierarchy from AC1.
- Explicitly include user approval, Design System `MASTER.md`, Stitch visual contract, and page overrides.

### T2: Strengthen Non-Override Rules
- Add rules covering visual tokens, layout, interaction, animation, component structure, and accessibility tradeoffs.
- State that conflicting UI/UX Pro Max advice becomes a recommendation, critique note, or future improvement candidate only.
- Preserve existing references to UX Guardian and Design Consultation authority.

### T3: Add No-Design-System Mode
- Document when UI/UX Pro Max can seed recommendations.
- State that seed recommendations are not source of truth until approved by I-Wish's Design System Gate.
- Keep the guidance scoped to style, palette, typography mood, interaction tone, effects, and anti-patterns.

### T4: Add Conflict Status Output Requirement
- Add the required conflict status values to the specialist skill.
- Require the specialist to name the winning I-Wish authority whenever there is a conflict.
- Keep this compatible with the more complete output contract planned for `STORY-UIUX-1.3`.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm no workflow files were changed for this story.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Authority hierarchy is explicit | T1 | Full order, user approval, MASTER, Stitch, page overrides | ✅ |
| AC2 | Approved I-Wish artifacts win conflicts | T2 | Visual tokens, layout, interaction, animation, accessibility | ✅ |
| AC3 | No-design-system mode is bounded | T3 | Seed recommendation rules, Design System Gate approval | ✅ |
| AC4 | Specialist output includes conflict status | T4 | Status enum, winning authority requirement | ✅ |
| AC5 | No workflow patches introduced | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 5 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components | 0 |
| Cross-Domain | 1 bounded context: I-Wish design governance | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story should modify only the specialist skill and this story record.
- Do not patch `step-08-visual-foundation.md`, `step-00b-design-system-gate.md`, `workflow-entry.md`, `iwish-bmm-create-ui-spec.md`, or `iwish-bmm-code-review.md`.
- Do not change the Knowledge Graph unless the skill path or metadata changes.
- Do not introduce executable scripts, external repo copies, or large data assets.
- Keep the output-contract changes minimal; Story UIUX-1.3 will formalize the full recommendation format.

## 8. Definition of Done

- [x] Authority hierarchy is documented in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- [x] Non-override rules cover approved Design System, Stitch screens, page overrides, User Simulation Guardian, Design Consultation, and UX Guardian.
- [x] No-design-system mode is documented as seed-only and approval-gated.
- [x] Conflict status values are documented.
- [x] No workflow patches are introduced.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | ACs map directly to the required governance behavior and avoid implementation ambiguity. |
| Data Integrity & State | 9 | No database or app state touched; design authority state is represented as documented hierarchy only. |
| Security & Validation | 9 | No external code, installer, or network execution introduced; validation is limited to repo safety checks. |
| Performance & Scalability | 9 | Markdown-only governance update adds negligible runtime or context overhead. |
| Error Handling & Recovery | 9 | Conflict statuses and winning-authority rules make ambiguous recommendation failures recoverable. |
| Code Quality & Maintainability | 9 | Keeps governance in the specialist skill and defers workflow patches to dedicated stories. |
| UX Empathy | 9 | Protects approved user-facing design artifacts while still allowing specialist advice before approval. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`

## 11. Vegeta Agent Record

### Planned

- Expand the UI/UX Pro Max Specialist authority hierarchy.
- Add bounded no-design-system mode.
- Add conflict status guidance.
- Validate KG and portability.

### Implementation Status

- Expanded the authority hierarchy in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` to include user approvals, Design System `MASTER.md`, Stitch visual contract, and page overrides.
- Strengthened the non-override rules to cover tokens, layout, interaction, animation, component structure, accessibility tradeoffs, User Simulation Guardian, and review authority.
- Added a bounded no-design-system mode that allows seed recommendations only until I-Wish Design System approval.
- Added required conflict status values and the rule that conflicting output must name the winning I-Wish authority.
- Refined the conflict status taxonomy so `Design Consultation` and `UX Guardian` each have their own machine-readable status.
- Added the missing structured output fields `Conflict Status` and `Winning Authority` so downstream agents do not need to infer the enum from prose.
- Confirmed this story did not patch any I-Wish workflow files.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the new conflict-status requirement inside the specialist skill instead of introducing a workflow patch, because Story UIUX-1.2 is governance-only.
- Treated page overrides as subordinate to the approved portal Design System but still higher priority than specialist recommendations when they apply to the active page.
- Clarified that page overrides may shape future Stitch generation, but an already approved page-specific Stitch screen still wins as the active visual contract.
