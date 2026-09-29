---
name: 'workflow-rollback'
description: 'Manages step execution history and performs reverse-order topological rollback on task failure.'
inputs:
  - action: 'Operation to perform: register_step, execute_rollback, or clear_stack'
  - step_id: 'Unique identifier of the executed task step'
  - rollback_command: 'Specific CLI command or script hook to undo side effects'
outputs:
  - rollback_completed: 'Boolean indicating if rollback completed successfully'
  - rollback_log: 'Detailed log of executed rollback actions'
mcp_tools_required: []
subagent_triggers: []
---

# 🌀 Topological Rollback Engine
> Nhóm phân loại / Classification: `WORKFLOW_PATCH / SUPPORTIVE`

## 📌 Overview
This skill implements the **Topological Rollback Engine** to manage workflow state integrity in case of failure. It logs completed tasks and runs their rollback hooks in reverse order of completion (`completed_stack.reverse()`) when intermediate story builds or tests fail.

---

## 🛠️ Usage Guidelines

### Execution Flow
1. **Register Step:** When starting a sub-task, log the step with its reverse operation:
   ```javascript
   // Register command to revert git edits or mocks
   rollback.register("story-1.1", "git checkout path/to/file.ts");
   ```
2. **Execute Rollback:** If the workflow runner crashes or fails validation, trigger:
   ```bash
   node _iwish-output/iwish-skills/workflow-rollback/scripts/rollback-manager.js execute_rollback
   ```
3. **Fail-Safe Mechanism:** If a rollback command itself fails, abort execution immediately, throw a critical error, write a detailed diagnostics report, and transfer control to the user. Do not attempt further automated rollbacks to prevent state corruption.

---

## 🚦 Verification Checklist
- [ ] Run mock pipeline with 3 stages. Fail the third stage.
- [ ] Verify the rollback hooks for stage 2 and stage 1 execute in correct reverse order.
- [ ] Inject an error into stage 1's rollback command; verify the engine aborts immediately and escapes the execution loop.
