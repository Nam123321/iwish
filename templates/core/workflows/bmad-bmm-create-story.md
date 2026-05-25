---
name: 'create-story'
description: 'Create the next user story from epics+stories with enhanced context analysis and direct ready-for-Vegeta marking'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **BMAD RUNTIME FALLBACK:** First run `./.agent/scripts/check-bmad-runtime.sh --mode project` or verify `_bmad/core/tasks/workflow.xml` and `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-bmad-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml
3. Pass the yaml path @{project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before finalizing the user story, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Embed the Scorecard directly at the bottom of the story document. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If it fails, HALT workflow and rewrite the story to fix logic gaps.
</steps>
