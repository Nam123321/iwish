---
description: Evaluate pipeline fragmentation and propose refactoring to close gaps.
---

# 🔍 Evaluate Pipeline Workflow

This workflow evaluates an existing story or epic for pipeline fragmentation (e.g. orphaned consumers, missing event triggers) against its data specifications and the broader cross-dependency graph. It identifies structural gaps and proposes a standard `/refactor-story` + `/flow` path to remediate them in a Zero-Trust, SDLC-compliant manner.

## Phase 1: Context Loading & UADRG Extraction
1. The orchestrator must parse the `target` parameter (story or epic ID).
2. **File Management (Workspace Hygiene):** Ensure the directory `_iwish-output/pipeline-evaluations/<target_id>/` exists. All output files MUST be saved here.
3. Load the relevant `data-spec.md` and `story.md`.
4. Run the underlying graph scanner and output to the dedicated directory:
   ```bash
   python3 .agent/scripts/uadrg/graph-builder.py --output _iwish-output/pipeline-evaluations/<target_id>/uadrg.json
   ```

## Phase 2: Code vs Contract Validation (AST Scan)
1. Execute the Pipeline Continuity Scanner and output to the dedicated directory:
   ```bash
   python3 .agent/scripts/validate-data-flow-contracts.py --output _iwish-output/pipeline-evaluations/<target_id>/ast.json
   ```
2. **Concurrency Safety:** Ensure no codebase modifications happen concurrently while this scan is running. The scanner includes fallback handling for dynamically resolved paths to avoid false positives.

## Phase 3: Reporting & Watchmen Signing
1. Generate the **Pipeline Fragmentation Report** compiling all discrepancies found (missing consumers, missing producers, orphaned records).
2. **File Management:** Save this report as `_iwish-output/pipeline-evaluations/<target_id>/fragmentation-report.md`.
3. **Watchmen Mode 1 (Zero-Trust):** You MUST pass this report to the Out-of-Band signing daemon before presenting it to the user.
   ```bash
   python3 .agent/scripts/mcp-signing-daemon.py _iwish-output/pipeline-evaluations/<target_id>/fragmentation-report.md
   ```
   *(Note: Pass the file path directly; `--sign-artifact` is not a valid flag)*
4. Append the cryptographic signature block to the bottom of the report.

## Phase 4: Refactoring Proposal
1. Analyze the signed report and construct an **Implementation Plan**.
2. The Implementation Plan MUST propose the precise new Acceptance Criteria (ACs) and edge cases to add to the story.
3. Suggest the user run `/refactor-story` to formally append the new ACs to the `story.md`.
4. Suggest running `/flow` on the refactored story to initiate human PR review and implementation.

> [!CAUTION]
> **SDLC & Zero-Trust Compliance**
> You MUST NOT suggest using `/flow-auto-approve` or automatically writing code to fix architectural pipelines. Pipeline data-flow changes require human QA validation. Always route the user through `/refactor-story` and standard `/flow`.
