---
legacy_name: 'retrospective'
description: 'Run after epic completion to review overall success, extract lessons learned, and explore if new information emerged that might impact the next epic'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/retro/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/retro/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
5b. **Unknowns Analyst Sync:**
   - Invoke `Unknowns Analyst` subagent
   - Request generation of sprint unknowns report based on ledger trends
   - Review analyst report and include in retro summary
6. After completing the retrospective, execute the /gen-dashboard workflow to update the user-guide-dashboard.html.
</steps>
