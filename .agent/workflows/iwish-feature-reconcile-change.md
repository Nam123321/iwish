---
name: 'reconcile-change'
description: 'Process the reconciliation queue to synchronize requirement changes back to source specifications (PRD, UI Specs, Stories)'
disable-model-invocation: true
---

# /reconcile-change

> [!IMPORTANT]
> **PURPOSE:** This workflow is responsible for reading the I-Wish reconciliation queue and explicitly updating the requirement specification files (PRD, UI Specs, Epic/Story files) to reflect changes that occurred during implementation or course correction.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded.

<steps CRITICAL="TRUE">
1. **CHECK RECONCILIATION STATUS:** 
   Run the CLI command `iwish reconcile-status` to check for pending work items in the queue.
   
2. **READ THE QUEUE:**
   Read all `.md` work item files located in `_iwish/runtime/reconciliation-workitems/` (or run `ls _iwish/runtime/reconciliation-workitems/` to list them, then `view_file` to read them).

3. **LOCATE SOURCE DOCUMENTS:**
   Identify the Epic, Story, PRD, and UI Spec files related to each pending work item. The work item will list the `Story ID` or `Epic ID` and a `Summary` of what changed.

4. **SYNCHRONIZE SPECIFICATIONS:**
   For each work item:
   - Load the relevant PRD or Story file using `view_file`.
   - Update the Scope, Requirements, or Acceptance Criteria to align with the changes described in the reconciliation work item.
   - You MUST ensure the updated text is clearly marked as a post-implementation scope change if applicable.
   - Save the changes to the specification files.

5. **UPDATE FEATURE GRAPH & KNOWLEDGE (Optional but Recommended):**
   If the changes impact core features, instruct the user to run `/code-graph` or update the `FeatureGraph` after your edits.

6. **CLEAR WORK ITEMS:**
   Once a work item is completely synced, you MUST delete its `.md` file from `_iwish/runtime/reconciliation-workitems/` and delete its corresponding `.json` file from `_iwish/runtime/reconciliation-queue/`.

7. **REPORT COMPLETION:**
   Inform the user which documents were successfully updated and confirm that the queue has been cleared.
</steps>
