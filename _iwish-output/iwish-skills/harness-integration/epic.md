# Epic 13: Harness Protocol Integration

## 1. Overview
Integrate 4 major architectural and procedural patterns from the Harness repository into I-Wish's canonical `SYSTEM_SKILL`s.

## 2. Stories
- **Story 13.1 (Architecture):** Integrate the 6-Pattern Architecture matrix into `/create-architecture` to support complex multi-agent topology design.
- **Story 13.2 (Skill Forging):** Upgrade `/create-skill` to enforce 3-Layer Progressive Disclosure, splitting heavy prompts into `references/`.
- **Story 13.3 (Validation):** Introduce "With vs Without" empirical testing into the skill validation pipeline (e.g., `/tournament` or `step-w-04`).
- **Story 13.4 (QA):** Upgrade the `qa-agent` guide to require Incremental Boundary Cross-Checks.
- **Story 13.5 (Refactoring & Auditing):** Review and re-validate the current I-Wish skill system using the newly adopted Harness Layer mechanisms to reduce token bloat and establish empirical deltas.
