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
0. **WORKSPACE AUTO-SAFETY COMMIT (MANDATORY PRE-FLIGHT):**
   - Check workspace status via `git status --porcelain`.
   - If there are uncommitted changes, you MUST automatically run:
     `git add . && git commit -m "chore: save progress before running reconcile"`
   - This prevents `process-reconcile-queue.py` from failing with "Workspace is dirty. Aborting" and guarantees zero data loss.

0.5. **PHYSICAL FILE STANDARDIZATION & SSOT GUARDIAN:**
   - First, run `python3 .agent/scripts/standardize_titles.py` to ensure all `epic.md` and `story.md` H1 titles and YAML frontmatters match the standard naming convention.
   - Then, run `python3 .agent/skills/epic-story-sync-guardian/scripts/validate-sprint-status.py`.
   - If it returns an error (exit code 1), it means physical folders drifted from the YAML index. You MUST immediately run `python3 .agent/scripts/rebuild_sprint_status.py` to rebuild the index from scratch and fix the drift before proceeding to Step 1.

1. **CHECK RECONCILIATION STATUS & INGEST CHANGE REQUEST:**
   - Run the Atomic Engine: `python3 .agent/scripts/process-reconcile-queue.py`.
   - Analyze the engine's output to read the `Calculated Blast Radius`. If the engine fails or aborts the branch, stop immediately.
   - Alternatively, receive direct instructions from the user regarding a manual structural change (e.g., "Merge Story 1.1 and 1.2", "Rename Story 15.2").

2. **PHASE 1: PRE-FLIGHT IMPACT ANALYSIS:**
   - Query all frontmatter dependencies (`dependencies:`, `links_to:`) and perform a codebase-wide grep search for references to the Story ID / Epic ID being modified.
   - Generate a temporary `impact-report.md` detailing:
     - All files (PRD, Architecture, other Story files, UI Specs) that refer to the target story/epic.
     - Potential broken references if the story is deleted or renamed.
   - **[USER GATE]** Present this Impact Report to the user and halt until they confirm the proposed plan.

3. **PHASE 2: QUEUE PROCESSING & SPECIFICATION SYNCHRONIZATION:**
   - Once approved, systematically update the affected files identified in the Impact Report:
     - **[ZERO-TRUST GATE - SPEC SYNC]**: If the Impact Report dictates that `architecture.md` or `product-brief-or-prd.md` (or similar SSOT spec files) must change, you MUST explicitly use the `multi_replace_file_content` tool to edit them. Do NOT rely solely on automated status scripts.
     - Update the PRD requirements, Architecture references, and Epic index tables.
     - **[CRITICAL RENAMING RULE]** If a story is renamed or moved (e.g., `story-11.1.md` -> `story-12.3.md`):
       1. Rename the physical file on disk.
       2. Update the H1 header *inside* the file (e.g., `# Story 12.3: ...`).
       3. Update the YAML frontmatter ID or attributes inside the file.
       4. Find and replace all occurrences of the old ID/link with the new ID/link in all files referencing it.

4. **PHASE 3: INTEGRITY GATE (VALIDATION):**
   - Run the validation command:
     `python3 .agent/scripts/validate-links.py`
4.5. **PHASE 3.5: TDR SYNC GATE (Architecture SSOT — Zero-Trust):**
   - If `architecture.md` (or any file in `_iwish-output/2. Product Planning/ADRs/`) was modified in the Impact Report (Step 2):
     1. **TDR Staleness Detection:** Check if `tech-decision-registry.yaml` is older than `architecture.md`:
        ```bash
        if [ "_iwish-output/2. Product Planning/2.5. architecture.md" -nt "_iwish-output/2. Product Planning/tech-decision-registry.yaml" ]; then
          echo "⚠️ TDR is STALE — needs regeneration"
        fi
        ```
     2. **TDR Rebuild:** Re-extract ALL technology decisions from `architecture.md` into `tech-decision-registry.yaml`. The agent MUST:
        - Read the full `architecture.md` (all ADR sections 2.1 through 2.38+)
        - Extract: `adr_ref`, `category`, `chosen`, `status`, `phase`, `alternatives_rejected`, `rationale`
        - **PRESERVE** existing `ae_references` from the old TDR entries by mapping them back to the newly extracted entries if the `adr_ref` and `chosen` tech still match.
        - Write the result as YAML to `_iwish-output/2. Product Planning/tech-decision-registry.yaml`
        - Ensure minimum 30+ decisions (if fewer found, HALT with warning)
        - **[ZERO-TRUST GATE - TDR]**: If `architecture.md` was updated, you MUST rebuild the TDR. If you skip extracting and writing the updated YAML decisions to `tech-decision-registry.yaml`, you are violating Zero-Trust and MUST HALT.
     3. **Post-Rebuild Validation:** Run:
        `python3 .agent/scripts/architecture-coherence-checker.py --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" --sprint-wide --output-json "_iwish-output/adhoc-workspace/scratch/coherence-post-reconcile.json"`
        If CRITICAL/HIGH conflicts are found, WARN the user — existing stories may now conflict with the updated ADRs.
   - If `architecture.md` was NOT modified, skip this step.
5. **PHASE 4: SSOT INDEX, CROSS-DEPENDENCY & HIERARCHY REBUILD:**
   - Once validation passes, you MUST mechanically synchronize the tracking indexes with the physical file status. You are NOT allowed to skip this step or manually execute the python scripts.
   - **[ZERO-TRUST EXECUTION]**: You MUST run the following command and wait for its output:
     `bash .agent/scripts/reconcile-all.sh`
   - This script mechanically enforces:
     1. `sprint-status.yaml` rebuild.
     2. Epic status table synchronization.
     3. Cross-dependency (CDI) compilation and validation.
     4. Dashboard synchronization.
   - **[ZERO-TRUST GATE - FEATURE HIERARCHY]**: If a story or epic was added/moved/removed, you MUST physically regenerate the hierarchy document by running the `/feature-hierarchy` workflow rules, updating `_iwish-output/2. Product Planning/2.4. epics-and-stories.md`. You must verify the file timestamp has changed.
   - Once completely synchronized, delete the processed work items from `_iwish/runtime/reconciliation-workitems/` and `_iwish/runtime/reconciliation-queue/` (if any exist).
   - Summarize the updated files, IDs, and links to the user. Confirm that the validation passed and context remains fully aligned. You MUST embed the output logs of `reconcile-all.sh` in your response.
</steps>
