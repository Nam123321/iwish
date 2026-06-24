---
legacy_name: 'reconcile-change-legacy'
description: 'Process requirement and structure changes (add, remove, merge, move epic, rename) in Epics and Stories, ensuring 100% synchronized context across PRD, Architecture, and sprint-status.'
disable-model-invocation: true
---

# /reconcile-change

> [!IMPORTANT]
> **PURPOSE:** This workflow is the centralized gateway to handle any structural or content changes in Epics and Stories (including adding, removing, merging, renaming, or moving stories between epics). It guarantees that PRD, Architecture documents, Story files, and tracking indexes are kept 100% in sync to prevent context fragmentation.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS SEQUENTIALLY - while staying in character as the current agent persona.

<steps CRITICAL="TRUE">
1. **CHECK RECONCILIATION STATUS & INGEST CHANGE REQUEST:**
   - Run the CLI command `iwish reconcile-status` to inspect the queue, or receive direct instructions from the user regarding the story/epic structural change (e.g., "Merge Story 1.1 and 1.2", "Rename Story 15.2", "Move Story 12.3 to Epic 14").

2. **PHASE 1: PRE-FLIGHT IMPACT ANALYSIS:**
   - Query all frontmatter dependencies (`dependencies:`, `links_to:`) and perform a codebase-wide grep search for references to the Story ID / Epic ID being modified.
   - Generate a temporary `impact-report.md` detailing:
     - All files (PRD, Architecture, other Story files, UI Specs) that refer to the target story/epic.
     - Potential broken references if the story is deleted or renamed.
   - **[USER GATE]** Present this Impact Report to the user and halt until they confirm the proposed plan.

3. **PHASE 2: QUEUE PROCESSING & SPECIFICATION SYNCHRONIZATION:**
   - Once approved, systematically update the affected files identified in the Impact Report:
     - Update the PRD requirements, Architecture references, and Epic index tables.
     - **[CRITICAL RENAMING RULE]** If a story is renamed or moved (e.g., `story-11.1.md` -> `story-12.3.md`):
       1. Rename the physical file on disk.
       2. Update the H1 header *inside* the file (e.g., `# Story 12.3: ...`).
       3. Update the YAML frontmatter ID or attributes inside the file.
       4. Find and replace all occurrences of the old ID/link with the new ID/link in all files referencing it.

4. **PHASE 3: INTEGRITY GATE (VALIDATION):**
   - Run the validation command:
     `python3 .agent/scripts/validate-links.py`
   - This script checks all markdown links, YAML references, and matches physical filenames against internal IDs.
   - If the script fails, you **MUST NOT** complete the workflow. Analyze the output, fix the broken references/mismatches, and re-run the validation until it passes cleanly.

5. **PHASE 4: SSOT INDEX & STATUS REBUILD:**
   - Once validation passes, synchronize the tracking indexes with the physical file status:
     - Force a rebuild/update of `_iwish-output/3. Development/sprint-status.yaml` and the Epic index in `_iwish-output/epics.md` based *only* on the current physical `.md` files present in the directory.
     - Run `bash .agent/scripts/navigator-guardian.sh` to compile/sync the Idea Navigator dashboard.
     - Regenerate `_iwish-output/2. Product Planning/2.4. epics-and-stories.md` or `{planning_artifacts}/feature-hierarchy.md` if the change impacts the feature structure.

6. **CLEAR QUEUE & REPORT COMPLETION:**
   - Once completely synchronized, delete the processed work items from `_iwish/runtime/reconciliation-workitems/` and `_iwish/runtime/reconciliation-queue/` (if any exist).
   - Summarize the updated files, IDs, and links to the user. Confirm that the validation passed and context remains fully aligned.
</steps>
