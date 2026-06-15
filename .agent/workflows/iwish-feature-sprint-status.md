---
name: 'sprint-status'
description: 'Summarize sprint-status.yaml, surface risks, and route to the right implementation workflow.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **DEPLOYMENT READINESS GATE (CONDITIONAL):**
> When stories are marked `done` and ready to ship, you MUST use `view_file` to load `/.agent/skills/canary/SKILL.md` and `/.agent/skills/land-and-deploy/SKILL.md`. Apply the Landing Protocol to validate merge readiness and the Canary Protocol for production deployments.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/status/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/status/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
</steps>
