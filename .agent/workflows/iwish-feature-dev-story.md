---
legacy_name: 'dev-agent-story'
description: 'Execute a story by implementing tasks/subtasks, writing tests, validating, and updating the story file per acceptance criteria'
disable-model-invocation: true
---


> [!IMPORTANT]
> **STANDARDS INJECTION (MANDATORY):**
> During coding and testing phases, you MUST use `view_file` to load `/.agent/fragments/test-bootstrap.md` and `/.agent/fragments/ux-principles.md` to adhere to core quality guidelines.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/code/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.


# Code Execution Orchestrator
This workflow executes:
1. step-cd-01-setup
2. step-cd-02-implementation
3. step-cd-03-testing
4. step-cd-04-pre-review-gap-scan
