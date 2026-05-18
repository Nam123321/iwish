---
story_id: "STORY-UIUX-1.4"
epic_id: "EPIC-UIUX-01"
title: "Define Conflict Resolution Procedure"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-UIUX-1.1", "STORY-UIUX-1.2", "STORY-UIUX-1.3"]
phase: "forge"

---
# Story UIUX-1.4: Define Conflict Resolution Procedure

## 1. Objective

Formalize a predictable conflict-resolution procedure so that competing UX signals from UI/UX Pro Max do not stall or dilute existing workflows that rely on UX Guardian or Design Consultation.

## 1.1 Context

Epic 1 sets up the UI/UX Pro Max Specialist wrapper. Story UIUX-1.2 established the authority hierarchy regarding Design Systems and Stitch screens. This story extends the conflict resolution to handle behavioral and consultative conflicts, ensuring the agent knows exactly how to proceed when UI/UX Pro Max gives advice that conflicts with I-Wish's UX behavioral tokens or Design Consultation's multi-lens review.

**Source artifacts:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `docs/ui-ux-pro-max-specialist-integration/epics.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.2-authority-hierarchy.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`

**Dependency state:**
- `STORY-UIUX-1.1` is done.
- `STORY-UIUX-1.2` is done.
- `STORY-UIUX-1.3` is done.
- Workflow invocation stories are out of scope for this epic.

## 2. User Story

As a reviewer,
I want a predictable conflict-resolution procedure,
So that competing UX signals do not stall or dilute the workflow.

## 3. Acceptance Criteria

### AC1: UX Guardian Precedence
**Given** UI/UX Pro Max conflicts with UX Guardian behavioral tokens  
**When** the conflict is detected  
**Then** UX Guardian wins  
**And** the agent may raise a `[NEW_UX_PATTERN_PROPOSAL]` only if the recommendation reveals a genuinely missing behavior pattern.

### AC2: Design Consultation Precedence
**Given** UI/UX Pro Max conflicts with Design Consultation findings  
**When** the conflict is detected  
**Then** Design Consultation's multi-lens review is treated as the stronger final review  
**And** UI/UX Pro Max evidence may be cited as supporting context.

### AC3: Scope Remains Governance-Only
**Given** this story belongs to Epic 1  
**When** Vegeta implements it  
**Then** only the specialist contract and related story documentation are updated  
**And** no workflow files are patched yet.

## 4. Tasks/Subtasks

- [x] **T1: Formalize Conflict Resolution in Specialist Skill**
  - [x] Update `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` with explicit UX Guardian conflict rules.
  - [x] Add explicit Design Consultation conflict rules to the documentation.
  - [x] Document the `[NEW_UX_PATTERN_PROPOSAL]` exception process.
- [x] **T2: Validate and Update Story Record**
  - [x] Confirm no workflow files were changed for this story.
  - [x] Update this story's Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | UX Guardian Precedence | T1 | Add UX Guardian rules and proposal exception | ✅ |
| AC2 | Design Consultation Precedence | T1 | Add Design Consultation rules | ✅ |
| AC3 | Scope remains governance-only | T2 | File check, story record update | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 3 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components | 0 |
| Cross-Domain | 1 bounded context: I-Wish specialist output governance | 0 |
| Flow Complexity | No async events, webhooks, or state machines | 0 |
| Test Burden | 0 E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- This story should modify only the specialist skill and this story record.
- Do not patch workflow files (`workflow-entry.md`, `step-08-visual-foundation.md`, `step-00b-design-system-gate.md`, `iwish-bmm-create-ui-spec.md`, `iwish-bmm-code-review.md`) in this story.
- Treat the conflict resolution procedure as a sub-section of the authority hierarchy defined in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.

## 8. Definition of Done

- [x] The specialist skill includes explicit UX Guardian conflict rules with `[NEW_UX_PATTERN_PROPOSAL]` exception.
- [x] The specialist skill includes explicit Design Consultation conflict rules with supporting-context provision.
- [x] User Simulation Guardian conflict rules are preserved and grouped.
- [x] No workflow patches are introduced.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | ACs map directly to resolving conflicts with UX Guardian and Design Consultation. |
| Data Integrity & State | 9 | No DB or app state is touched. |
| Security & Validation | 9 | Governance remains repo-local. |
| Performance & Scalability | 9 | Clear precedence rules prevent unbounded debate loops during agent execution. |
| Error Handling & Recovery | 9 | The `[NEW_UX_PATTERN_PROPOSAL]` provides a safe escape hatch. |
| Code Quality & Maintainability | 9 | Single source of truth in SKILL.md. |
| UX Empathy | 9 | Ensures UX consistency by prioritizing established behavioral tokens and design reviews. |

**Total Average:** 9.00 / 10 — PASS

## 10. File List

- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.4-conflict-resolution.md`
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `_iwish-output/stories/sprint-status.yaml`

## 11. Vegeta Agent Record

### Planned

- Formalize UX Guardian conflict rules with `[NEW_UX_PATTERN_PROPOSAL]` exception.
- Formalize Design Consultation conflict rules with supporting-context provision.
- Group User Simulation Guardian conflict rules explicitly.
- Validate KG and portability.
- Confirm no workflow files were patched.

### Implementation Status

- Expanded the `Non-override rule` section in `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` into a comprehensive `Non-override rule and Conflict Resolution Procedure` section.
- Added explicit `UX Guardian Conflict Rules` sub-section: UX Guardian wins on behavioral token conflicts; added the `[NEW_UX_PATTERN_PROPOSAL]` exception for genuinely missing behavior patterns.
- Added explicit `Design Consultation Conflict Rules` sub-section: Design Consultation's multi-lens review is the stronger final review; UI/UX Pro Max evidence may be cited as supporting context.
- Preserved and grouped `User Simulation Guardian Conflict Rules` into its own sub-section for clarity.
- Confirmed no workflow files (`workflow-entry.md`, `step-08-visual-foundation.md`, `step-00b-design-system-gate.md`, `iwish-bmm-create-ui-spec.md`, `iwish-bmm-code-review.md`) were changed.

### Code Review Fixes (2026-05-09)

- **F1 (P2):** Added structured shape for `[NEW_UX_PATTERN_PROPOSAL]` with 4 required fields (`Pattern Name`, `Missing Behavior`, `Evidence Source`, `Proposed Resolution`) and routing instructions for `ADOPT_INTO_UX_GUARDIAN` vs `LOG_FOR_FUTURE_REVIEW`.
- **F2 (P2):** Added Example C showing `CONFLICT_WITH_UX_GUARDIAN` conflict with an embedded `[NEW_UX_PATTERN_PROPOSAL]` block.
- **F3 (P2):** Added disposition rule to User Simulation Guardian and Design Consultation sub-sections: losing advice recorded as recommendation per non-override rule.
- **F4 (P3):** Acknowledged epic-level DoD verification in Decisions (below).
- **F5 (P3):** Promoted all conflict sub-sections from colon-terminated plain text to proper `###`/`####` markdown headings.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` → pass.
- Ran `./.agent/scripts/validate-portability.sh` → pass.
- Verified via `git diff --name-only` that only `SKILL.md`, story file, and `sprint-status.yaml` were modified.

### Decisions

- Structured the conflict rules as named sub-sections (`UX Guardian Conflict Rules`, `Design Consultation Conflict Rules`, `User Simulation Guardian Conflict Rules`) rather than a flat bullet list, to improve readability and make each authority's precedence rules independently scannable.
- Kept the `[NEW_UX_PATTERN_PROPOSAL]` exception narrow: it applies only when UI/UX Pro Max reveals a genuinely missing behavior pattern, not for style preferences or subjective differences.
- Verified Epic UIUX-01 DoD at story close: specialist wrapper exists, triggers/skips documented, authority hierarchy defined, output contract formalized, and conflict resolution procedure complete.

## 12. Change Log

| Date | Change |
|---|---|
| 2026-05-09 | Story created and implemented. Conflict resolution procedure formalized in SKILL.md. All ACs satisfied. Status → DONE. |
| 2026-05-09 | Code review fixes applied: structured shape for `[NEW_UX_PATTERN_PROPOSAL]` (F1), Example C added (F2), disposition rules for all conflict sub-sections (F3), epic DoD verified (F4), markdown headings promoted (F5). |
