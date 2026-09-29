---
name: 'sprint-planning'
description: 'Generate and manage the sprint status tracking file for Phase 4 implementation, extracting all epics and stories from epic files and tracking their status through the development lifecycle'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/sprint-planning/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Check if `sprint-status.yaml` exists. If it DOES NOT exist (first run), you MUST run `python3 .agent/scripts/compile-sprint-status.py` to generate the baseline tracking board from the existing physical backlog stubs, then initialize the graph (if graph index is available).
2. Load the compiled `sprint-status.yaml` to scan the current backlog.
3. Interactively query the user to select which Epics or Stories to activate for the current sprint.
4. Update the `status: ready-for-dev` (or appropriate status) directly within the `story.md` physical files of the selected stories to ensure SSOT integrity. Do NOT manually edit `sprint-status.yaml`.
5. Run the terminal command `python3 .agent/scripts/compile-sprint-status.py` to auto-update the `sprint-status.yaml` reflecting the new physical file statuses.
6. Run terminal command `bash .agent/scripts/navigator-guardian.sh`.
7. Inform user that planning is complete and list the activated stories.
</steps>
