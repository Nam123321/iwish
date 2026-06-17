# Story 13.5: Review and Re-validate Current Skill System

## Goal
Conduct a comprehensive review and re-validation of all existing I-Wish system skills against the newly absorbed Harness paradigms (3-Layer Progressive Disclosure and "With vs Without" testing).

## Acceptance Criteria
- [ ] Audit all current skills in `.agent/skills/` to identify monolithic prompts that exceed the 500-line recommended limit.
- [ ] Refactor identified legacy skills to adopt the 3-Layer pattern (Metadata, `SKILL.md`, `references/`).
- [ ] Run the "With vs Without" tournament testing on at least 3 heavily-used existing skills to establish a baseline performance delta.
- [ ] Document the before-and-after token efficiency and execution accuracy for the refactored skills.

## Implementation Tasks
- **Task 1: Audit Script Generation.** Create a script (e.g., `.agent/scripts/audit-skills.sh`) to automatically scan `.agent/skills/` and flag any `SKILL.md` exceeding the 500-line constraint.
- **Task 2: Targeted Refactoring.** Run the newly updated `/enhance-skill` workflow on the flagged monolithic skills to break them down into the 3-Layer Progressive Disclosure structure (Metadata + Core `SKILL.md` + `references/`).
- **Task 3: Empirical Testing.** Select 3 heavy skills (e.g., `repo-absorption`, `white-hacker`, `ux-pro-max`). Generate test queries and run the `step-w-04-validate` "With vs Without" tournament mechanism to prove their capability delta.
- **Task 4: Metrics Documentation.** Compile the results of the tournament into an artifact report (`skill-refactor-report.md`) detailing token savings and accuracy improvements.
