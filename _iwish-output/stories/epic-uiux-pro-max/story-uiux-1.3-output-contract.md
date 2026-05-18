---
story_id: "STORY-UIUX-1.3"
epic_id: "EPIC-UIUX-01"
title: "Define Recommendation Output Contract"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-UIUX-1.1", "STORY-UIUX-1.2"]
phase: "forge"

---
# Story UIUX-1.3: Define Recommendation Output Contract

## 1. Objective

Formalize the compact I-Wish-facing output contract for `ui-ux-pro-max-specialist` so downstream UX workflows and reviewers consume a stable, machine-readable recommendation shape instead of free-form design prose.

## 1.1 Context

Story UIUX-1.1 created the specialist wrapper. Story UIUX-1.2 established authority hierarchy, non-override rules, page-override semantics, and conflict-status requirements. This story turns that governance into a reusable output contract that future workflow patches can call consistently.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `_iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md`
- `docs/ui-ux-pro-max-specialist-integration/gap-analysis.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`

**Dependency state:**
- `STORY-UIUX-1.1` is done.
- `STORY-UIUX-1.2` is done.
- Workflow invocation stories are still out of scope.

## 2. User Story

As a Vegeta or UX workflow agent,  
I want UI/UX Pro Max output in a compact standard format,  
So that I can consume it without adding noisy design advice to every story.

## 3. Acceptance Criteria

### AC1: Standard Output Sections Are Explicit
**Given** UI/UX Pro Max is invoked for a design task  
**When** the specialist returns its recommendation  
**Then** the output includes exactly these sections unless the user asks for more:
- `Product Type`
- `Recommended Direction`
- `Alternatives`
- `Color/Tone`
- `Typography`
- `Interaction Notes`
- `Anti-Patterns`
- `Implementation Checklist`
- `Conflict Status`
- `Winning Authority`
- `I-Wish Conflict Check`
- `Next Workflow Use`

### AC2: Conflict Fields Are Machine-Readable
**Given** the specialist returns a conflict-sensitive recommendation  
**When** `Conflict Status` is emitted  
**Then** it must use one of these exact enum values:
- `NO_CONFLICT`
- `CONFLICT_WITH_DESIGN_SYSTEM`
- `CONFLICT_WITH_STITCH`
- `CONFLICT_WITH_USER_SIMULATION`
- `CONFLICT_WITH_DESIGN_CONSULTATION`
- `CONFLICT_WITH_UX_GUARDIAN`
**And** `Winning Authority` must use one of these exact values:
- `N/A`
- `USER_APPROVAL`
- `I-Wish_WORKFLOW_GATE`
- `DESIGN_SYSTEM_MASTER`
- `STITCH_VISUAL_CONTRACT`
- `PAGE_OVERRIDE`
- `USER_SIMULATION_GUARDIAN`
- `DESIGN_CONSULTATION`
- `UX_GUARDIAN`
**And** `Winning Authority` must be `N/A` only when `Conflict Status` is `NO_CONFLICT`.

### AC3: Concision Limits Are Defined
**Given** the specialist has many possible styles or design directions  
**When** it formats output for I-Wish  
**Then** it selects one primary direction and at most two alternatives  
**And** it stores those alternates only inside the `Alternatives` section  
**And** includes no more than five anti-patterns and ten checklist items unless the user asks for more depth.

### AC4: I-Wish Conflict Check Is Interpretable
**Given** the specialist returns a recommendation  
**When** `I-Wish Conflict Check` is filled  
**Then** it summarizes whether the recommendation is accepted, constrained, or downgraded to advisory only  
**And** it references the authority hierarchy from `STORY-UIUX-1.2` rather than inventing a new precedence rule.

### AC5: Example Block Is Included
**Given** a I-Wish agent author reads the specialist skill  
**When** they look up the output contract  
**Then** the skill includes one concise example contract block  
**And** that single block demonstrates both a `NO_CONFLICT` case and a constrained/conflict case in minimal form.

### AC6: Scope Remains Governance-Only
**Given** this story belongs to Epic 1  
**When** Vegeta implements it  
**Then** only the specialist contract and related story documentation are updated  
**And** no workflow files are patched yet.

## 4. Tasks

### T1: Formalize Output Sections in Specialist Skill
- Update `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- Replace the current transitional wording with the finalized Story UIUX-1.3 contract.
- Keep the section names exact and stable.

### T2: Lock Machine-Readable Conflict Fields
- Preserve the exact `Conflict Status` enum list.
- Define the `Winning Authority` enum and rule clearly.
- Ensure `I-Wish Conflict Check` is positioned as the human-readable explanation of the structured status.

### T3: Add Concision Rules
- Document the one-primary-direction rule.
- Document the at-most-two-alternatives limit under the `Alternatives` field.
- Document limits for anti-patterns and checklist items under the `Implementation Checklist` field.

### T4: Add Example Contract Block
- Add one compact example contract block.
- Demonstrate both a `NO_CONFLICT` response and a constrained/conflict response inside that single block.
- Keep examples short enough for story/spec usage.

### T5: Validate and Update Story Record
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Confirm no workflow files were changed for this story.
- Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Standard output sections are explicit | T1 | Exact section list, stable field names | ✅ |
| AC2 | Conflict fields are machine-readable | T2 | Enum list, `Winning Authority` enum, structured vs prose role | ✅ |
| AC3 | Concision limits are defined | T3 | Primary direction, `Alternatives`, anti-pattern/checklist caps | ✅ |
| AC4 | I-Wish Conflict Check is interpretable | T2 | Human-readable explanation tied to authority hierarchy | ✅ |
| AC5 | Example block is included | T4 | Single block, `NO_CONFLICT` example, constrained example | ✅ |
| AC6 | Scope remains governance-only | T5 | Validators, diff check, story record | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components | 0 |
| Cross-Domain | 1 bounded context: I-Wish specialist output governance | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story should modify only the specialist skill and this story record.
- Do not patch `workflow-entry.md`, `step-08-visual-foundation.md`, `step-00b-design-system-gate.md`, `iwish-bmm-create-ui-spec.md`, or `iwish-bmm-code-review.md` in this story.
- Do not change the Knowledge Graph unless the specialist metadata itself changes.
- Treat the contract in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as the single source of truth for future Epic 2 workflow integration.
- Keep examples compact and production-friendly; avoid long narrative prose.

## 8. Definition of Done

- [x] The specialist skill includes the finalized output contract with exact field names.
- [x] `Conflict Status` and `Winning Authority` rules are explicit and machine-readable.
- [x] Concision limits are documented.
- [x] At least one minimal `NO_CONFLICT` example and one constrained/conflict example are included.
- [x] No workflow patches are introduced.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | ACs convert the governance rules from UIUX-1.2 into a deterministic output contract with little ambiguity. |
| Data Integrity & State | 9 | No database or runtime app state is touched; the work is pure contract formalization. |
| Security & Validation | 9 | No external execution paths or installer imports are added; validation remains repo-local. |
| Performance & Scalability | 9 | A compact contract reduces prompt bloat and helps future workflow integrations stay bounded. |
| Error Handling & Recovery | 9 | Structured conflict fields reduce ambiguity and make downstream fallback behavior easier to implement. |
| Code Quality & Maintainability | 9 | Keeps the source of truth in one skill file and defers runtime invocation logic to later stories. |
| UX Empathy | 9 | The contract keeps recommendations usable and concise for implementers instead of flooding stories with generic design prose. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`

## 11. Vegeta Agent Record

### Planned

- Finalize the specialist output contract fields.
- Lock machine-readable conflict fields.
- Add compact example blocks.
- Validate KG and portability.

### Implementation Status

- Finalized the specialist output contract in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` with the exact field list required by the story.
- Preserved and formalized the machine-readable `Conflict Status` enum and upgraded `Winning Authority` into a machine-readable enum.
- Added explicit `Alternatives` and `Implementation Checklist` fields so the concision rules have a stable home in the contract.
- Documented the one-primary-direction rule, `Alternatives` limit, anti-pattern cap, and `Implementation Checklist` cap.
- Added one concise example contract block that demonstrates both a `NO_CONFLICT` case and a constrained/conflict case.
- Confirmed this story did not patch any I-Wish workflow files.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Promoted the previously transitional output-shape section to the formal source-of-truth contract rather than creating a second competing contract section.
- Kept the examples compact and markdown-only so future workflow integrations can embed them without adding prompt bloat.
- Added explicit fields rather than leaving alternatives and checklist content implicit inside prose, so Epic 2 workflows can consume the contract deterministically.
