---
description: Research and determine which I-Wish Library modules to install for this project
---

# `research-project-modules` Workflow

**Persona:** orch-agent (Master Orchestrator)

## 1. Goal
After defining the Product Requirements and Architecture (Tech Stack), the next vital step before implementation is deciding whether the project needs specialized AI workflows or skills from the **I-Wish Library**.

If the question is broader than project-pack selection and includes finding external repos, third-party skills, or comparing internal-vs-external capability options, hand off to `research-solution-sources.md`.

## 2. Steps

1. **Review Context**: Read the story-specific or session artifact `task.md`, PRD, and Architecture document.
2. **Library Scan**: Identify if the project fits any of the following profiles:
   - **AI Integration**: Requires `ai-pack` (ai-engineer-agent).
   - **Heavy Marketing**: Requires `marketing-pack` (Hercule / Majin-Buu).
   - **Complex UX/UI**: Requires `frontend-pack` (ux-agent / capability-agent).
   - **Strict Data Integrity**: Requires `backend-pack` (data-architect-agent).
   - **Performance/Scaling**: Requires `devops-pack`.
3. **Execution**: If a Library pack is needed, instruct the AI or User to run the global CLI tool:
   ```bash
   npx iwish-db add <pack-name>
   ```
4. **Update Context**: Update the story-specific or session artifact `task.md` or context to reflect that new modules (like `ai-engineer-agent` or `data-architect-agent`) are now available in the workspace.
