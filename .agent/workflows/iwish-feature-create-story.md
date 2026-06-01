---
legacy_name: 'create-story'
description: 'Create the next user story from epics+stories with enhanced context analysis and direct ready-for-dev-agent marking'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
5.3. **IDENTIFY TRACER BULLET (Vertical Slice):** Before generating the story, you MUST explicitly identify the **Tracer Bullet** for this story. A story MUST represent a complete vertical slice of behavior (UI -> API -> DB). If the story is only a horizontal layer (e.g., "Implement DB only"), you MUST halt and propose a vertical merge or slice.
5.3b. **CHECK PROJECT EXPANSION (PER):** Analyze if the story introduces a completely new feature, feature group, or significant project expansion. If so, you MUST HALT and prompt the user to load `/.agent/fragments/project-expansion-review.md` or run `/pivot-project` first to perform the **Project Expansion Review (PER)**. This ensures alignment with previous market/tech research and evaluates pivot risks, routing back to the planning or discovery phases if needed.
5.4. CRITICAL — SOCRATIC REVIEW GATE 1. Before generating any story output, you MUST execute the Socratic Review Mode (Gate 1: `business`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the UX flow, Acceptance Criteria (AC), **Tracer Bullet integrity**, and edge cases. You are FORBIDDEN from generating the story text until the user has completed the Socratic loop and explicitly approved the Synthesis.
5.5. CRITICAL — PLAN TUNE COMPLEXITY CHECK. After generating ACs, load `@{project-root}/.agent/fragments/plan-tune-heuristic.md` and calculate the Complexity Score (CS). If CS ≥ 7, HALT and present a split proposal. If CS 4-6, WARN the user and recommend splitting.
5.6. CRITICAL — AC-TO-TASK TRACEABILITY GATE. Before finalizing, generate the AC-Task Traceability Matrix (see `plan-tune-heuristic.md` Part D). Every AC MUST map to at least 1 Task. If any AC has `⚠️ MISSING TASK`, HALT the workflow until a task is assigned.
5.7. CRITICAL — PROJECT MEMORY GATE. Before drafting story context or Dev Notes, check for `@{project-root}/.agent/memory/PROJECT.md`. If present, load only the sections relevant to the current epic/story and treat them as the primary persistent project memory. Check `@{project-root}/.agent/memory/USER.md` only for stable collaboration preferences. `USER.md` MUST NOT override project constraints, approved architecture, story ACs, workflow instructions, or the current user request. If memory conflicts, resolve in this order: system/safety rules → project instructions/artifacts → workflow/story instructions → current user request → user preferences → historical session notes.
5.8. CRITICAL — CONTEXT BUDGET FOR MEMORY. Do not paste full memory files into the story by default. Summarize only the relevant project memory as citable Dev Notes, and prefer fresh PRD/architecture/epic artifacts over stale memory.
6. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before finalizing the user story, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Embed the Scorecard directly at the bottom of the story document. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If it fails, HALT workflow and rewrite the story to fix logic gaps.
7. SMART NAVIGATION MENU (OPTION B). At the very end of story creation, analyze the generated story content. If the story is tagged with `[UI]` (Frontend) or `[DATA]` (Database/Schema), print a clear Next Steps Navigation Menu in the chat:
   - Explain what design files are needed based on the story tags.
   - Present clickable shortcuts for the user to trigger: `/make-ui-spec` (if UI tagged), `/make-data-spec` (if DATA tagged), or `/code` to skip design and proceed directly to coding.
   - Emphasize that resolving these specifications first ensures synchronicity between Frontend and Backend.
</steps>
