# Story 13.2: 3-Layer Progressive Disclosure

## Goal
Update the `create-skill` / `step-w-03-forge` workflow to enforce Progressive Disclosure when generating new skills, preventing context window bloat.

## Acceptance Criteria
- [x] `.agent/workflows/step-w-03-forge.md` (or equivalent workflow) is modified.
- [x] It enforces breaking down skills into: 1. Metadata (name/desc), 2. Main `SKILL.md` (< 500 lines), 3. External `references/` for heavy contextual docs.
- [x] It emphasizes "Pushy Descriptions" (active triggers with explicit "use this when X, Y, Z").

## Implementation Tasks
- **Task 1:** Modify `.agent/workflows/step-w-03-forge.md` specifically under the `#### If Type = SKILL` section.
- **Task 2:** Enforce the creation of the `references/` directory for heavy context: `${IWISH_HOME}/generated-skills/<skill-name>/references/`.
- **Task 3:** Update the `SKILL.md` markdown template to explicitly cap length (< 500 lines) and enforce the "Pushy Descriptions" rule in the YAML `description` field.
- **Task 4:** Add instructions so the generating agent moves any large boilerplate, API schemas, or large code blocks into markdown files inside the `references/` directory, and adds links from `SKILL.md` pointing to those reference files.
- **Task 5:** Modify `.agent/workflows/step-e-03-upgrade.md` (`/enhance-skill` pipeline) to enforce that when an existing skill is rewritten or patched, the < 500 lines constraint and the `references/` extraction rule are strictly maintained.
- **Task 6:** Modify `.agent/skills/repo-absorption/SKILL.md` (`/absorb-repo` engine) at **Phase 5 (Compare & Contrast)**. Ensure that the "Actionable Integration Spec" enforces the 3-Layer Progressive Disclosure rules (Metadata + <500 line `SKILL.md` + `references/`) when advising how to ADOPT or MERGE external code into `SYSTEM_SKILL`s.
