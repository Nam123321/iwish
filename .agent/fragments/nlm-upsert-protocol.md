# NLM Upsert Protocol

> Shared protocol for pushing updated content to NotebookLM without creating duplicates.
> All Tier 1 triggers MUST use this protocol instead of raw `source_add`.
> **Applicable to**: Layer 3 Notebooks (type: epic) only.

## Prerequisites

- Target notebook must be registered in `notebook-registry.yaml`.
- The `upsert_source` sub-action must be available in `registry_crud_manager.py` (D7).
- The `validate-nlm-hook-execution.py` must support `--mode aggregate` (D12).

## Steps

### 1. Resolve Target Notebook
Run: `python3 .agent/scripts/resolve-notebook-targets.py --context-type <type> --context-id <id>`
Extract the primary Layer 3 notebook ID from the output.

### 2. Check Existing Source (Dedup Gate)
Call `notebooklm-mcp/source_list_drive` with `notebook_id`.
**[ZT-EVIDENCE]** Save raw MCP JSON response to:
`_iwish-output/adhoc-workspace/scratch/nlm_evidence_list.json`
Search the returned list for a source whose title matches the target filename
(e.g., `story-72.1.md`, `ui-spec.md`).

### 3. Delete Stale Source (if exists)
If a matching source is found, call `notebooklm-mcp/source_delete` with
`notebook_id` and `source_id` to remove the outdated version.
**[ZT-EVIDENCE]** Save raw MCP JSON response to:
`_iwish-output/adhoc-workspace/scratch/nlm_evidence_delete.json`
**[ZT-INLINE ASSERTION]** Verify the response JSON contains a success status
or the source no longer appears in a subsequent `source_list_drive` check.
If delete failed silently → **HALT**. Do NOT proceed to Step 4.

### 4. Add Fresh Source
Call `notebooklm-mcp/source_add` with `notebook_id` and the full text content
of the updated file.
**[ZT-EVIDENCE]** Save raw MCP JSON response to:
`_iwish-output/adhoc-workspace/scratch/nlm_evidence_add.json`

### 5. Update Registry Tracking
Compute MD5 hash of the local file.
Call: `echo '{"notebook_id": "...", "path": "/abs/path/to/file", "md5": "..."}' | python3 .agent/scripts/registry_crud_manager.py upsert_source -`
(Uses the `upsert_source` sub-action — NOT `update` — to surgically
add/update a single entry in `sync_sources` without corrupting other entries.)

### 6. Zero-Trust Validation (Aggregate)
Aggregate all evidence files in the scratch directory.
Run: `python3 .agent/scripts/validate-nlm-hook-execution.py --mode aggregate _iwish-output/adhoc-workspace/scratch/`
If fails → **HALT**.

## Error Handling

- **Layer 3 Upsert HALT Exception**: The existing non-blocking policy ("MCP sync
  MUST NOT halt the primary SDLC workflow") applies ONLY to Layer 1/2 `source_add`
  operations. For Layer 3 Upsert Protocol operations, validation failure in Step 6
  IS a blocking error — because silent failure leads to SSOT corruption (duplicate
  or stale sources in the Epic Context notebook). **HALT is mandatory.**
