---
description: Research and determine which BMAD Library modules to install for this project
---

# `research-project-modules` Workflow

**Persona:** Grand-Priest (Master Orchestrator)

## 1. Goal
After defining the Product Requirements and Architecture (Tech Stack), the next vital step before implementation is deciding whether the project needs specialized AI workflows or skills from the **BMAD-DragonBall Library**.

## 2. Steps

1. **Review Context**: Read the `task.md`, PRD, and Architecture document.
2. **Library Scan**: Identify if the project fits any of the following profiles:
   - **AI Integration**: Requires `ai-pack` (Songoku).
   - **Heavy Marketing**: Requires `marketing-pack` (Hercule / Majin-Buu).
   - **Complex UX/UI**: Requires `frontend-pack` (Android-18 / Whis).
   - **Strict Data Integrity**: Requires `backend-pack` (Shenron).
   - **Performance/Scaling**: Requires `devops-pack`.
3. **Execution**: If a Library pack is needed, instruct the AI or User to run the global CLI tool:
   ```bash
   npx bmad-db add <pack-name>
   ```
4. **Update Context**: Update `task.md` or context to reflect that new modules (like `Songoku` or `Shenron`) are now available in the workspace.
