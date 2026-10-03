# NLM Context Enrichment Gate (CENS Protocol)

> **NOTICE**: As of UKP V3, the CENS Protocol has been fully absorbed into the `ae-notebook-orchestrator`.
> This fragment is auto-loaded by any workflow with a NotebookLM Integration Hook for backward compatibility, but its logic now delegates entirely to the Orchestrator's internal modes.

## Gate Execution

1. **Calculate CENS Score (Optional for Analytics):**
   Run: `python3 .agent/scripts/calculate-cens.py --context-type <type> --context-file <file> --output-json _iwish-output/adhoc-workspace/scratch/cens-score.json`
   
2. **UKP Delegation:**
   - Instead of routing manually, ALL queries pass through the `ae-notebook-orchestrator`.
   - The Orchestrator automatically selects Mode 1 (Quick-Check), Mode 2 (General), or Mode 3 (Deep AE) based on the input context and `evaluate-source-enrichment.py` gaps.

3. **Zero-Trust Validation:**
   Save ALL MCP JSON outputs to `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`.
   Run: `python3 .agent/scripts/verify-nlm-checked.py --receipt-file _iwish-output/adhoc-workspace/scratch/nlm_evidence.json`
   If fails → HALT.

## Mandatory Override Workflows
The following workflows ALWAYS force the Orchestrator into Mode 3 (Deep AE / Scatter-Gather) regardless of context:
- `/evaluate-epic`
- `/create-prd`
- `/create-architecture`
- `/product-strategy`

## 🧠 Dual-Oracle Knowledge Consultant Parallel Hook
Whenever CENS triggers Mode 2 or Mode 3 for AI/ML domains, workflows MUST invoke `ai-engineering-knowledge-consultant` in parallel as Source B to ground enterprise synthesis with scratch-built code patterns from `ai-engineering-from-scratch` (523 lessons). Evidence must be validated using `validate-knowledge-consultant-evidence.py`.
