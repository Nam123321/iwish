---
name: 'sprint-planning'
description: 'Generate and manage the sprint status tracking file for Phase 4 implementation, extracting all epics and stories from epic files and tracking their status through the development lifecycle'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/sprint-planning/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Load `_iwish-output/epics.md` or `_iwish-output/2. Product Planning/2.4. epics-and-stories.md` to scan backlog.
2. Interactively query the user to select which Epics to activate for the current sprint.
3. Check if `_iwish-output/3. Development/sprint-status.yaml` already exists. If not, create folder `_iwish-output/3. Development/` and write the initial `sprint-status.yaml` from `sprint-status-template.yaml` (set selected stories to `ready`). If yes, read it, parse YAML, merge the selected stories while preserving the statuses of existing stories. Ask user if there is a conflict.
4. Save the updated `sprint-status.yaml`.
5. Run terminal command `bash .agent/scripts/navigator-guardian.sh`.
6. Inform user that planning is complete and list stories.
</steps>
