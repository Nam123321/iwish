---
name: reject-qa
description: Reject a manual test, enforce constraint, and loop back
category: implementation
roles:
  - orch-agent
steps:
  - id: step-01-read-state
    description: "Read `.agent/cache/qa-loop.json` to identify the pending story."
  - id: step-02-prompt-reason
    description: "Prompt user for the explicit rejection reason."
  - id: step-03-update-spec
    description: "Append rejection constraint into `manual-test-spec-{id}.md`."
  - id: step-04-reset-loop
    description: "Reset loop attempts and trigger `/fix-bug`."
---

# Reject QA Human Cross-Check

This workflow is executed when a human explicitly rejects a QA test that is in the `Pending_Approval` state (Human Cross-Check Gate), preventing the agent from proceeding with hallucinations or flawed logic.

## Step 1: Read Loop State
- Agent reads `.agent/cache/qa-loop.json`.
- Verify that `status` is `Pending_Approval` or `Exhausted`.
- Extract the `story_id`.

## Step 2: Prompt for Reason
- The Agent MUST prompt the user: *"Please provide the exact reason for rejecting this QA result, and describe what the QA agent or developer missed."*
- Wait for user input.

## Step 3: Update Test Spec
- Once the user provides the reason, the Agent edits the `manual-test-spec-{id}.md` file for this story.
- Find or create the `### Human Cross-Check Rejections` section within the Constraints area.
- Append the user's rejection reason as a new strict negative constraint (e.g., `- [REJECTED ON {DATE}]: {User Reason}`).

## Step 4: Reset Loop & Trigger Fix
- Agent resets `.agent/cache/qa-loop.json`:
  - Set `attempts: 0`.
  - Set `status: fixing`.
- Agent invokes `/fix-bug` (SBRP workflow) and passes the context of the rejection so the developer agent can fix the implementation.
- Notify the user: *"Rejection constraint added to spec. `/fix-bug` has been triggered."*
