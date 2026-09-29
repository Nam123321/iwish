# Story 13.3: "With vs Without" Validation

## Goal
Introduce the "With vs Without" parallel testing mechanism to I-Wish's validation pipelines (`step-w-04-validate.md` or `/tournament`) to empirically measure a skill's delta.

## Acceptance Criteria
- [x] `.agent/workflows/step-w-04-validate.md` (or equivalent) is modified.
- [x] The validation protocol explicitly spawns two execution paths for the test queries: one using the skill, one without.
- [x] The results must be compared, and if the baseline performs equally well, the skill is rejected or refined to reduce bloat.

## Implementation Tasks
- **Task 1:** Modify `.agent/workflows/step-w-04-validate.md` to insert a new section `3b. Empirical Baseline Testing ("With vs Without" Validation)` immediately after `3. Integration Smoke Test`.
- **Task 2:** Add instructions forcing the orchestrator to run a test query in two modes: **Path A (Without Skill)** and **Path B (With Skill)**.
- **Task 3:** Define strict rejection criteria: if Path B does not empirically outperform Path A (in speed, accuracy, or quality), the draft is rejected or sent back for refinement.
