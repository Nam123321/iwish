---
legacy_name: iwish-feature-refactor-story
description: |
  Triggered when:
  - User invokes `/refactor-story` or `/refactor-story <story_id>`
  - Items exist in `_iwish/runtime/refactoring-queue/` and user requests processing
  - A story that has progressed beyond backlog needs its ACs amended, added, or deprecated
disable-model-invocation: true
---

# /refactor-story — Implementation

Amend Acceptance Criteria on stories that have progressed beyond `backlog` status.
This workflow performs surgical edits to story files, maintains a change log,
transitions status to `refactored`, and optionally routes to `/flow` with
Inherited Spec Mode.

> [!IMPORTANT]
> **Story Overwrite Protection**: Using `write_to_file` with `Overwrite: true` on
> any `story.md` file is a **HARD BLOCK** in this workflow. All story edits MUST
> use `replace_file_content` or `multi_replace_file_content`.

> [!WARNING]
> **Backlog Guard**: Stories with `status: backlog` cannot be refactored. They have
> not yet entered flow — use `/flow` instead to begin normal development.

---

<steps CRITICAL="TRUE">

## Step 0 — WORKSPACE AUTO-SAFETY COMMIT (MANDATORY PRE-FLIGHT)

Before making any changes, ensure the workspace is clean.

```bash
cd "$(git rev-parse --show-toplevel)"
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Dirty workspace detected — creating auto-safety commit..."
  git add -A
  git commit -m "chore(iwish): auto-safety commit before /refactor-story [$(date -u +%Y-%m-%dT%H:%M:%SZ)]"
  echo "✅ Auto-safety commit created."
else
  echo "✅ Workspace is clean — no safety commit needed."
fi
```

> [!NOTE]
> This follows the same pre-flight pattern used by `/reconcile-change`. The safety
> commit ensures all prior work is preserved before we begin surgical story edits.

---

## Step 1 — QUEUE CHECK & TARGET RESOLUTION

### 1a. Determine the target story

- **If a story ID was provided** (e.g., `/refactor-story 8.1`):
  1. Resolve the story directory under `_iwish/epics/` by matching the story ID.
  2. Locate `story.md` within that directory.
  3. Load the story file and parse its YAML frontmatter.

- **If no story ID was provided**:
  1. Check `_iwish/runtime/refactoring-queue/` for pending items.
  2. If the queue contains items, list them and present to the user for selection.
  3. If the queue is empty, prompt the user for a story ID.

### 1b. Backlog guard

```
Parse the `status` field from story.md YAML frontmatter.

IF status == "backlog" THEN
  ❌ ERROR: Story is in backlog status.
     Stories in backlog have not entered flow yet.
     Use `/flow <story_id>` to begin development instead.
  HALT — do not proceed.
END IF
```

> [!IMPORTANT]
> The backlog guard is an **inverse check** — we reject only `backlog`. All other
> statuses (`in-progress`, `done`, `validated`, `shipped`, etc.) are eligible for
> refactoring.

Record for later use:
- `STORY_ID` — the resolved story identifier (e.g., `8.1`)
- `STORY_DIR` — absolute path to the story directory
- `STORY_FILE` — absolute path to `story.md`
- `CURRENT_STATUS` — the status value before refactoring

---

## Step 2 — DRIFT DETECTION (OPTIONAL BUT RECOMMENDED)

If `completion-snapshot.json` exists in the story directory, run drift detection
to provide context on what may have changed since the story was last completed:

```bash
python3 .agent/scripts/detect-story-drift.py --story <STORY_ID>
```

- Present the drift report to the user as context for what might need changing.
- This is advisory only — drift detection failure does NOT block the workflow.

> [!NOTE]
> The drift report helps the user understand which ACs may be stale and which
> implementation files have diverged from the original spec. This is especially
> useful when refactoring stories that were completed weeks ago.

---

## Step 3 — AC AMENDMENT INTAKE

Receive the AC amendments from the user. Supported change types:

| Change Type       | Description                                      | Format                          |
|-------------------|--------------------------------------------------|---------------------------------|
| `ac_addition`     | New ACs to append to the story                   | Full AC text with ID            |
| `ac_modification` | Existing ACs that need updating                  | AC ID + revised text            |
| `ac_removal`      | ACs to mark as deprecated (never hard-delete)    | AC ID + `[DEPRECATED]` prefix   |

### Mandatory: Change Reason

> [!WARNING]
> The user **MUST** provide a reason/justification for the change. This is
> recorded in the Change Log and is essential for traceability. If no reason is
> provided, prompt the user and do not proceed until one is given.

Collect and confirm:
1. **Changes** — list of additions, modifications, and deprecations.
2. **Reason** — why these changes are being made (e.g., "Party Mode finding UF-08-01",
   "User feedback from demo", "Regulatory requirement change").
3. **Source** — `/refactor-story` (auto-set).

Present a summary of proposed changes to the user and get explicit confirmation
before proceeding to Step 4.

---

## Step 4 — SURGICAL STORY EDIT

> [!IMPORTANT]
> **HARD BLOCK**: Do NOT use `write_to_file` with `Overwrite: true` on `story.md`.
> All edits MUST use `replace_file_content` or `multi_replace_file_content`.

### 4a. Load the existing story

Read the complete contents of `STORY_FILE` to understand current structure,
AC numbering, and existing Change Log (if any).

### 4b. Apply AC changes

Using `multi_replace_file_content` or `replace_file_content`:

- **Additions** (`ac_addition`):
  - Append new ACs under the appropriate Acceptance Criteria section.
  - Follow the existing numbering convention (e.g., `AC-7`, `AC-8`).
  - **MANDATORY**: Do NOT generate the AC-to-Task matrix manually using LLM logic. Instead, after making all changes to the ACs, you MUST run `OOB_SIGNING_KEY=dummy python3 .agent/scripts/auto-traceability-linker.py --story <path_to_story>` directly on the markdown file to enforce strict format compliance and auto-number missing ACs. **If the script fails (exit code > 0), you MUST HALT immediately, do not proceed, and report the error to the user for manual resolution.**

- **Modifications** (`ac_modification`):
  - Locate the target AC by its ID.
  - Replace the AC text in-place, preserving the AC ID prefix.

- **Deprecations** (`ac_removal`):
  - Prefix the AC line with `[DEPRECATED]`.
  - Do NOT delete the AC text — it must remain for audit trail.

### 4c. Append Change Log entry

If a `## Change Log` section does not exist at the bottom of `story.md`, create one.
Append a row to the Change Log table:

```markdown
## Change Log

| Date | Change Type | Description | Reason | Source |
|---|---|---|---|---|
| <TODAY_DATE> | <change_type> | <description> | <reason> | /refactor-story |
```

Where `<TODAY_DATE>` is in `YYYY-MM-DD` format.

If multiple changes are being made, add one row per change.

---

## Step 5 — STATUS TRANSITION

Update the YAML frontmatter `status` field from its current value to `refactored`.

```
Use replace_file_content to change:
  status: <CURRENT_STATUS>
to:
  status: refactored
```

> [!IMPORTANT]
> This MUST be done via `replace_file_content` targeting only the status line —
> not by rewriting the entire frontmatter or file.

---

## Step 6 — EPIC SYNC

### 6a. Update the Epic Stories table

1. Load the parent `epic.md` file.
2. Locate the Stories table row for `STORY_ID`.
3. Update the status column from `<CURRENT_STATUS>` to `refactored`.

### 6b. Epic Change Log (if applicable)

If `epic.md` contains a `## Change Log` section, append an entry:

```markdown
| <TODAY_DATE> | story_refactored | Story <STORY_ID> refactored — ACs amended | <reason> | /refactor-story |
```

---

## Step 7 — SPRINT-STATUS SYNC

Run the status sync script to propagate the new `refactored` status across all
index files and sprint dashboards:

```bash
python3 .agent/scripts/sync_all_statuses.py
```

> [!NOTE]
> **Sprint-Status Immutability Rule**: We update the source of truth (`story.md`)
> and then rebuild the indexes. We never directly edit sprint-status index files —
> they are always derived from story files.

---

## Step 7.5 — NotebookLM Layer 3 Sync (MANDATORY)

Because ACs have been amended, the old story content in the Layer 3 notebook is now stale.

Execute NLM Upsert Protocol (see `.agent/fragments/nlm-upsert-protocol.md`):

1. Resolve the target Layer 3 notebook via `resolve-notebook-targets.py --context-type story --context-id <STORY_ID>`.
2. Call `source_list_drive` → save evidence to `nlm_evidence_list.json`.
3. If source exists: call `source_delete` → save evidence to `nlm_evidence_delete.json` → inline assert success.
4. Call `source_add` with the updated file content → save evidence to `nlm_evidence_add.json`.
5. Call `registry_crud_manager.py upsert_source` to update the registry MD5 and `last_synced`.
**[ZERO-TRUST GATE]** Aggregate all evidence files and run:
```bash
python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery --mode aggregate _iwish-output/adhoc-workspace/scratch/
```
If fails → HALT.

---

## Step 7.6 — CDI RECOMPILE

Because ACs have been amended and dependencies may have shifted, you MUST update the Dependency Index.

Run the following command:
```bash
python3 .agent/scripts/compile-dependency-index.py
```
Ensure it completes successfully.

## Step 8 — VALIDATION

Run both validators and ensure they pass:

```bash
# Story structure validation
python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase pre-code

# Cross-reference link validation
python3 .agent/scripts/validate-links.py
```

- **Both must PASS** for the workflow to be considered complete.
- If either fails, diagnose the issue and fix before proceeding.

---

## Step 9 — DOWNSTREAM ROUTING

> [!NOTE]
> **Proactive Sync Verification Rule**: After refactoring, any previously loaded
> story context in other workflows is now stale. If the user proceeds to `/flow`,
> it will automatically reload the story — but other open contexts should be
> treated as potentially drifted.

Present the user with routing options:

```
✅ Story <STORY_ID> has been refactored successfully.

   Changes applied: <summary_of_changes>
   Status: <CURRENT_STATUS> → refactored

   What would you like to do next?

   [A] Run /flow <STORY_ID> now
       → Enters Inherited Spec Mode automatically.
       → Will pick up the amended ACs for implementation.

   [B] Done for now — will run /flow later
       → Story remains in refactored status.
       → Run /flow <STORY_ID> when ready to implement changes.
```

- If user chooses **[A]**: Hand off to `/flow <STORY_ID>`.
- If user chooses **[B]**: Workflow ends. Remind user that the story is in
  `refactored` status and will enter Inherited Spec Mode when `/flow` is invoked.

</steps>
