---
name: 'Vegeta-story'
description: 'Execute a story by implementing tasks/subtasks, writing tests, validating, and updating the story file per acceptance criteria'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **BMAD RUNTIME FALLBACK:** First run `./.agent/scripts/check-bmad-runtime.sh --mode project` or verify `_bmad/core/tasks/workflow.xml` and `_bmad/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-bmad-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_bmad/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml
3. Pass the yaml path @{project-root}/_bmad/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL: STITCH-TO-CODE ENFORCEMENT. If implementing UI from a Stitch output, you MUST rigidly map React components using DOM-Driven Layout (following the visual DOM structure of the approved Stitch HTML), NOT Schema-Driven Layout. The generated HTML/CSS from Stitch is the Absolute Source of Truth. You MUST download and reference these Stitch artifacts natively.
7. CRITICAL: VISUAL ENFORCEMENT GATE. Before finalizing any UI task or handing off, invoke the UX Guardian or 'stitch-design-taste' skill to visually validate the implementation against the CSS/HTML visual contract. DO NOT assume functional logic replaces visual validation.
8. CRITICAL: BMAD Master decrees that all future /dev-story executions must conclude with a deterministic compiler check. The agent must be instructed to run a terminal command to verify project compilation (e.g., `pnpm build`, `nest build`, or `tsc --noEmit`) before finalizing the review and updating the walkthrough.
</steps>
