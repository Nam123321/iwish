# NotebookLM Health & Sync Audit Implementation

This document defines the implementation specifications for the `/nlm-audit` workflow. Execute these steps sequentially to verify the integrity and health of the NotebookLM integration.

---

## Step 1: Registry Integrity
- Read `_iwish-output/notebooks/notebook-registry.yaml`.
- Call the `notebook_list()` tool from `notebooklm-mcp` to get the actual list of remote notebooks.
- **Comparison:** Cross-reference the local registry against the remote list.
- **Flagging:** Identify any "orphans" (remote notebooks not in the local registry that should be) or "missing" (notebooks in the registry that no longer exist remotely).

## Step 2 & Step 3: Staleness Scan and Hash Audit (Tier 2 & 3)
- **[ZERO-TRUST GATE]** You MUST execute the audit script to check staleness and MD5 hashes:
  `python3 .agent/scripts/audit_notebook_staleness.py`
- If the script returns Exit Code 1, it will print exactly which notebooks and files have drifted.
- **Flagging:** Record any notebooks flagged by the script as "Stale" or "Drifted" (requires synchronization). Do NOT attempt to manually calculate MD5 hashes or compare timestamps.

## Step 4: Source Count Check
- For each active notebook, query or inspect its current source count.
- **Evaluation:**
  - *Optimal:* < 50 sources.
  - *Warning:* > 80 sources.
  - *Action Required:* > 100 sources.
- **Flagging:** If a notebook exceeds 100 sources, flag it for a "force-split" to maintain retrieval quality and prevent context dilution.

## Step 5: Foundation Gate Report
- Load and parse `_iwish-output/notebooks/foundation-checklist.yaml`.
- Re-verify the status of the 14 standard foundation notebooks based on the results from Step 1.
- Update the checklist if any statuses have changed (e.g., a foundation notebook was accidentally deleted).

## Step 6: Final Report Generation
- Generate a comprehensive markdown audit report containing:
  1. **Integrity Issues:** List of orphans and missing notebooks.
  2. **Staleness Report:** List of notebooks requiring sync (with specific file paths).
  3. **Capacity Warnings:** Notebooks approaching or exceeding the source count limit, proposing split strategies.
  4. **Foundation Status:** Summary of the 14 standard nodes.
  5. **Auto-fix Recommendations:** Actionable commands the user can run (e.g., `/nlm sync`) to resolve the flagged issues.
- Present this report to the user.
