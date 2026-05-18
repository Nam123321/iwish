---
story_id: "STORY-UIUX-2.4"
epic_id: "EPIC-UIUX-02"
title: "Add Review Invocation for Design and Code Review"
status: "DONE"
assignee: "Vegeta"
priority: "P2"
depends_on: ["STORY-UIUX-2.3", "STORY-UIUX-1.2", "STORY-UIUX-1.3", "STORY-UIUX-1.4"]
phase: "forge"

---
# Story UIUX-2.4: Add Review Invocation for Design and Code Review

## 1. Objective

Patch I-Wish's design review and frontend code review surfaces so UI/UX Pro Max can contribute review evidence under controlled governance, while keeping Design Consultation and I-Wish code review as the final owners of severity and disposition.

## 1.1 Context

Epic 1 established the specialist wrapper, authority hierarchy, output contract, and conflict procedure. Stories `UIUX-2.1`, `2.2`, and `2.3` integrated the specialist into visual foundation, Design System Gate, and story UI spec generation. This story extends the integration into the review layer.

The key constraint is authority. Review workflows may benefit from product-aware design evidence, accessibility concerns, and stack/domain-specific UI guidance, but the specialist must not silently become a second reviewer with equal authority. Design Consultation remains the stronger final design review. I-Wish code review remains responsible for grounding findings in actual code, DOM structure, screenshots, or approved visual artifacts.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `.agent/skills/design-consultation/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.3-story-ui-spec-invocation.md`

**Target integration surface:**
- `.agent/skills/design-consultation/SKILL.md`
- `.agent/workflows/iwish-bmm-code-review.md`
- any directly related review wrapper only if required by the active I-Wish structure

**Dependency state:**
- `STORY-UIUX-2.3` is done.
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- `STORY-UIUX-1.4` is done.

## 2. User Story

As a reviewer,  
I want UI/UX Pro Max to support design and frontend code review,  
So that common accessibility, interaction, responsive, and stack-specific issues are caught earlier.

## 3. Acceptance Criteria

### AC1: Design Consultation Can Cite Specialist Evidence
**Given** Design Consultation reviews a UI spec or mockup  
**When** `ui-ux-pro-max-specialist` is available  
**Then** the review may cite specialist findings under typography, color, layout, interaction, IA, accessibility, and anti-patterns  
**And** Design Consultation remains the final owner of review severity and disposition.

### AC2: Frontend Code Review Can Invoke Specialist Guidance
**Given** `.agent/workflows/iwish-bmm-code-review.md` reviews frontend UI changes  
**When** the change affects layout, styling, interaction, animation, accessibility, or charts  
**Then** the reviewer may invoke UI/UX Pro Max stack/domain guidance  
**And** the workflow still requires findings to be grounded in actual code or visual artifacts.

### AC3: Review Evidence Stays Subordinate to Existing I-Wish Authorities
**Given** the specialist contributes review evidence  
**When** that evidence conflicts with Design Consultation findings, UX Guardian, User Simulation Guardian, approved Design System, or approved Stitch visual contract  
**Then** the stronger I-Wish authority wins  
**And** the specialist evidence is retained only as supporting context or downgraded recommendation.

### AC4: Code Review Scope Is Explicitly Limited to Relevant UI Changes
**Given** a code review is being performed  
**When** the changes are not related to layout, styling, interaction, animation, accessibility, charts, or other user-facing UI behavior  
**Then** the workflow does not force unnecessary UI/UX Pro Max invocation  
**And** the review stays proportionate to the actual UI surface affected.

### AC5: Review Output Preserves Grounding and Governance
**Given** UI/UX Pro Max is cited during design review or code review  
**When** the final review is written  
**Then** the output makes clear whether the specialist evidence is accepted, constrained, rejected, or downgraded  
**And** the final review does not present UI/UX Pro Max as the sole authority for severity or acceptance.

### AC6: Workflow Patch Stays Narrow
**Given** this story targets review invocation only  
**When** Vegeta implements it  
**Then** only the design-review and code-review integration surfaces and directly necessary supporting copy are changed  
**And** the story does not patch Design System Gate, story UI spec generation, or unrelated portal-generation workflows.

## 4. Tasks

### T1: Patch the Design Consultation Review Surface
- Update `.agent/skills/design-consultation/SKILL.md`.
- Add governed usage guidance for citing `ui-ux-pro-max-specialist` evidence during design review.
- Keep Design Consultation as the final owner of severity and review disposition.

### T2: Patch the Frontend Code Review Surface
- Update `.agent/workflows/iwish-bmm-code-review.md`.
- Add invocation rules for frontend UI changes affecting layout, styling, interaction, animation, accessibility, charts, or comparable user-facing behavior.
- Keep findings grounded in code, DOM, screenshots, or approved visual artifacts.

### T3: Preserve I-Wish Review Authority and Conflict Handling
- Carry forward the authority order and conflict procedure from `STORY-UIUX-1.2` and `STORY-UIUX-1.4`.
- Make clear that specialist evidence is supporting context, not final review authority.
- Require accepted vs constrained vs downgraded review positioning to stay explicit.

### T4: Keep Invocation Proportionate
- Limit the code-review invocation guidance to relevant frontend/UI changes.
- Avoid turning every code review into a mandatory UI/UX review when no meaningful UI surface is affected.
- Keep the patch narrow and review-oriented.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm only the intended review surfaces and story record changed.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Design Consultation can cite specialist evidence | T1 | Design-review invocation, authority ownership, cited domains | ✅ |
| AC2 | Frontend code review can invoke specialist guidance | T2 | Frontend-trigger rules, grounding requirement, UI-surface scope | ✅ |
| AC3 | Review evidence stays subordinate to existing I-Wish authorities | T3 | Conflict handling, authority carry-forward, downgraded evidence | ✅ |
| AC4 | Code review scope is explicitly limited to relevant UI changes | T4 | Proportionate invocation, non-UI skip behavior | ✅ |
| AC5 | Review output preserves grounding and governance | T3 | Accepted/constrained/rejected framing, severity ownership clarity | ✅ |
| AC6 | Workflow patch stays narrow | T5 | Diff check, validation, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; review workflow integration only | 0 |
| Cross-Domain | 1 bounded context: I-Wish design/code review workflow integration | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story is the review-layer invocation point for the UI/UX Pro Max specialist.
- Treat `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the source of truth for authority and contract behavior.
- Patch the design review and code review surfaces only; do not alter generation workflows in this story.
- Keep the integration reversible and document-oriented; do not add unnecessary scripts.
- Preserve existing I-Wish review posture, including skepticism, grounding, and visual-contract enforcement.

## 8. Definition of Done

- [x] Design Consultation integration language is added.
- [x] Code review integration language is added.
- [x] Final severity remains owned by I-Wish review workflows.
- [x] Specialist evidence remains subordinate to stronger I-Wish authorities.
- [x] Non-UI code reviews are not forced through unnecessary UI/UX invocation.
- [x] No unrelated workflows are patched.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story integrates the specialist into review surfaces without changing who owns review decisions. |
| Data Integrity & State | 9 | No schema or application-state changes are involved; only review-governance behavior changes. |
| Security & Validation | 9 | No new executable or network surface is introduced; validation remains repo-local. |
| Performance & Scalability | 9 | UI/UX review evidence is scoped to relevant design/front-end review cases instead of becoming mandatory everywhere. |
| Error Handling & Recovery | 9 | Authority and conflict rules reduce the risk of contradictory review signals being treated as equal. |
| Code Quality & Maintainability | 9 | The story isolates two review touchpoints and reuses the established I-Wish governance model. |
| UX Empathy | 9 | Review quality improves for real user-facing concerns without eroding the team's ability to ground decisions in approved artifacts. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-2.4-review-invocation.md`
- `.agent/skills/design-consultation/SKILL.md`
- `.agent/workflows/iwish-bmm-code-review.md`

## 11. Vegeta Agent Record

### Planned

- Patch the Design Consultation review surface.
- Patch the frontend code review surface.
- Preserve review authority and grounding.
- Validate KG and portability.

### Implementation Status

- Patched `.agent/skills/design-consultation/SKILL.md` so Design Consultation may cite UI/UX Pro Max evidence under governed review rules while retaining ownership of severity and disposition.
- Added a structured `UI/UX Pro Max Supporting Evidence` subsection template to the Design Consultation report format, including grounded evidence domains plus `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`.
- Patched `.agent/workflows/iwish-bmm-code-review.md` with explicit frontend UI invocation rules for `ui-ux-pro-max-specialist` covering layout, styling, interaction, motion, accessibility, charts, and other meaningful user-facing UI behavior.
- Added proportional-review rules so non-UI changes do not force unnecessary UI/UX Pro Max invocation.
- Added explicit grounding and authority language so any specialist-driven finding must still be tied to code, DOM, screenshots, or approved visual artifacts and cannot override stronger I-Wish authorities.
- Confirmed this story did not patch Design System Gate, story UI spec generation, or unrelated portal-generation workflows.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Kept the design-review integration inside `design-consultation` and the frontend-review integration inside `iwish-bmm-code-review.md`, because those are the narrowest active review surfaces in the current I-Wish structure.
- Chose supporting-evidence wording and structured conflict fields so UI/UX Pro Max can enrich review quality without silently becoming a parallel authority channel.
