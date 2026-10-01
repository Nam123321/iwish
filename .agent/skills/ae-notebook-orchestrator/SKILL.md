---
name: ae-notebook-orchestrator
description: UKP Orchestrator for Advanced Elicitation, Quick-Checks, and Deep Research with NotebookLM - manages Registry lookup, Pull, Capture, Scatter/Gather/Synthesize loops
inputs: ['ae_trigger', 'workflow_context', 'topic', 'mode', 'target_notebooks']
outputs: ['research_enhanced_ae_output', 'captured_knowledge', 'ukp_response']
mcp_tools_required: []
subagent_triggers: ['notebook-retrieval-engine', 'notebook-cross-query-engine', 'knowledge-collector']
---

# AE Notebook Orchestrator (Unified Knowledge Pipeline - UKP)

## Purpose
The AE Notebook Orchestrator is the central controller for the **Unified Knowledge Pipeline (UKP)**. It integrates NotebookLM's capabilities into I-Wish workflows. It operates in multiple modes: from lightweight `quick-check` queries to deep `scatter-gather` AE research, ensuring all questions and solutions are grounded in verified research.

## Prerequisites
- Notebooks (e.g., PC-1, PC-2) must be available in the registry.
- File lock support must be active when modifying the notebook registry.

## Core Modes

### Mode 1: Quick Check Mode
Triggered via `/nlm-check` for fast, immediate queries.
1. **Bypass Deep Enrichment**: Skips `evaluate-source-enrichment.py`.
2. **Direct Query**: Runs a single `notebook_query` against the target notebooks.
3. **Verification**: Validates the MCP receipt using `verify-nlm-checked.py`.
4. **Synthesis**: Returns the direct answer. If a gap is detected, prompts the user to escalate to `/nlm-research`.

### Mode 2: General UKP Mode (Standard)
Triggered by general research tasks and standard workflows.
1. **Registry Lookup**: Identify target notebooks via `resolve-notebook-targets.py`.
2. **Staleness Check**: Check if the notebook content is up to date.
3. **Evaluate Enrichment**: Run `evaluate-source-enrichment.py`. If gaps exist, perform `source_add` to enrich the notebook before querying.
4. **Query & Synthesize**: Query the notebook and synthesize the response.
5. **Capture**: If new knowledge was generated, save it back to the UKP.

### Mode 3: Advanced Elicitation (Deep Mode)
Triggered by AE workflows (e.g., `step-04-decisions.md`).
1. **Pre-Elicitation Hooks**: Pull relevant domain knowledge and cross-query with Backbone PC-2 (Architecture). Use this to formulate highly targeted, constraint-aware AE questions.
2. **Scatter/Gather/Synthesize (Recursive)**: For highly complex topics (>= 4 dimensions):
   - **Phase 1 (Scatter)**: Query NotebookLM separately for individual dimensions.
   - **Phase 2 (Gather)**: Convert into a single Distilled Topic Source.
   - **Phase 3 (Synthesize)**: Run a synthesis query to generate holistic options.
3. **AE → Party-Mode Chain**: If the user selects a "High Risk" option or a CRITICAL_GAP is found, initiate `/party-mode` using the `AE-R{N}.md` output.
4. **Post-Elicitation Hooks**: Analyze decisions in `AE-R{N}.md` and inject them back into PC-2 or the relevant Research Library notebook.

## Concurrency and Integrity
- **Registry Locking**: All modifications to `notebook-registry.yaml` MUST use file-level locking (`fcntl` or equivalent) to prevent race conditions during concurrent `source_add` operations.
- **State Locks**: Notebook state changes must use `status: syncing` locks to prevent duplicate pushes.

## Error Handling
- **MCP Auth Failure**: Invoke `notebooklm-mcp/refresh_auth` (Iron Rule #13). Retry once.
- **Verification Failure**: If `verify-nlm-checked.py` fails on the MCP receipt, degrade to fallback LLM search and flag the error.
- **Timeout**: If MCP calls timeout after 2 retries, save output to `_iwish-output/notebooks/pending-sync-queue.yaml` and proceed. Do NOT halt the workflow.

## Integration Points
- **Notebook Retrieval Engine**: Used heavily for deep research.
- **Knowledge Collector**: Used for capturing results.
- **Party-Mode**: Escalation path for risky decisions.
