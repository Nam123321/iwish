---
epic: epic-uiux-pro-max-specialist
story_id: STORY-UIUX-4.4
title: "Add Reusable UX Pattern and Interaction-System Layer"
status: done
complexity_score: 3
phase: "forge"

---
# Story UIUX-4.4: Add Reusable UX Pattern and Interaction-System Layer

## 1. Context & Objective
As defined in **Epic 4 (Controlled Retrieval and Interaction-System Absorption)**, I-Wish must selectively import the original repository's stronger reusable UX patterns and interaction-system completeness rules. This allows the UI/UX Pro Max Specialist to provide richer guidance for `MASTER.md` generation and UI component reviews without surrendering brand-fit or governance safety.

## 2. Acceptance Criteria (AC)
- **AC1 (Pattern Extraction):** The integration must define a mechanism to extract and store high-value reusable UX patterns (e.g., sticky filters, dense data tables) from the original repo's design data, making them accessible to the specialist.
- **AC2 (Interaction-System Scaffolding):** The integration must absorb interaction-system rules (e.g., hover states, transition timing, focus rings) to ensure complete component definitions.
- **AC3 (Governed MASTER.md Generation):** The SKILL.md must instruct the specialist to utilize these UX patterns and interaction systems when proposing design systems (e.g., `MASTER.md`), while strictly obeying the Retrieval-Sandwich constraints.
- **AC4 (UX Guardian Compliance):** The SKILL.md must mandate that any recommended UX pattern or interaction rule is cross-checked against existing `UX Guardian` rules to prevent friction violations or behavioral regressions.

## 3. Implementation Tasks
- **Task 1:** Create an interaction-system and UX patterns resource file (e.g., `.agent/skills/ui-ux-pro-max-specialist/resources/interaction-system-patterns.md`) to curate the selectively imported patterns.
- **Task 2:** Extract key behavioral patterns from the `ui-ux-pro-max-skill-dna.md` and define them in the new resource file.
- **Task 3:** Update `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` to reference this new resource file as a primary source for generating design systems and evaluating UI specs.
- **Task 4:** Add explicit validation instructions in `SKILL.md` requiring the specialist to check recommended interaction patterns against `UX_GUARDIAN` rules before outputting them.

## 4. Traceability Matrix
| AC | Mapped Tasks | Status |
|---|---|---|
| AC1 | Task 1, Task 2 | ✅ DONE |
| AC2 | Task 1, Task 2 | ✅ DONE |
| AC3 | Task 3 | ✅ DONE |
| AC4 | Task 4 | ✅ DONE |

## 5. Dev Notes (Project Memory)
- **Retrieval-Sandwich:** All data inside `resources/interaction-system-patterns.md` should be treated as "evidence" and "recommendations", not absolute authority. `UX_GUARDIAN` retains override power.
- **Concision:** Ensure the imported patterns in the resource file are concise and organized logically so they don't consume excessive token context when loaded by the specialist.

---
### 🛡️ QA Simulator Guardian Scorecard (Pre-Execution Audit)

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | The tasks cleanly map to the FR10 requirements to absorb interaction systems without overriding I-Wish rules. |
| Data Integrity & State | 10 | Creating a dedicated resource file isolates the imported patterns from core agent behavior logic. |
| Security & Validation | 10 | Retrieval-sandwich ensures patterns are evaluated, not executed or assumed valid by default. |
| Performance & Scalability | 10 | Token footprint is managed by selectively curating patterns rather than bulk-importing the original CSVs. |
| Error Handling & Recovery | 10 | N/A - Pattern ingestion is a static data mapping process. |
| Code Quality & Maintainability | 9 | `SKILL.md` reference to a separate resource file keeps the main contract clean and maintainable. |
| UX Empathy | 10 | Explicitly importing interaction details (hover, focus, transitions) significantly elevates UI polish. |
| **TOTAL AVERAGE** | **9.7 / 10** | **PASS** |

---

## Vegeta Agent Record
- **Date:** 2026-05-11
- **Tasks Completed:**
  - Created `.agent/skills/ui-ux-pro-max-specialist/resources/interaction-system-patterns.md` to define interaction rules (Hover, Touch Targets, Transitions) and UX patterns (Sticky Contexts, Batch Actions, Data Density).
  - Updated `SKILL.md` to reference the new patterns file.
  - Added strict `Interaction System & UX Patterns Validation` instructions in `SKILL.md` to ensure imported patterns do not override `UX_GUARDIAN` behavioral rules.
- **Verification:**
  - Ran `validate-kg.sh` (Passed).
  - Ran `validate-portability.sh` (Passed).
  - Document syntax manually verified to ensure correct reference paths and markdown table formatting.
