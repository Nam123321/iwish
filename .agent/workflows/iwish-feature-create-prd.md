---
name: create-prd
description: Use when starting a new product or feature that needs a formal PRD with
  functional requirements, success criteria, and user journeys. Triggers on requests
  for product specs, capability contracts, or feature documentation.
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/workflow-create-prd.md, READ its entire contents and follow its directions exactly!

**[CRITICAL COMPLIANCE REQUIREMENT]**
During PRD Generation, you are required to enforce Strategy Alignment, Socratic Review, and Simulator Guardian limits.
You MUST read and rigidly obey the rules defined in: [PRD Guardrails](file://{project-root}/.agent/workflows/references/create-prd-guardrails.md). Do NOT skip any validation gates.

**[CRITICAL ZERO-TRUST RULE]**
Codebase Interrogation: If this is a brownfield project (existing codebase), the Agent MUST use `list_dir` and `grep_search` to interrogate the existing codebase (components, APIs, database schema) BEFORE generating Functional Requirements (FRs). This ensures FRs align with the actual physical state of the app.

---

## 📘 NotebookLM Integration Hook (UKP)

> This hook is auto-triggered when this workflow executes. Agent MUST read `ae-notebook-orchestrator` skill before proceeding.
> **UKP Orchestrator**: The orchestrator handles all context enrichment and knowledge retrieval natively. Do not load legacy CENS fragments.
> Auto-triggered after PRD generation.

### PUSH + FOUNDATION + SYNC: Create PC-1 (Core-PRD-Context)

1. Invoke `ae-notebook-orchestrator` (Capture phase) to handle registry lifecycle and notebook creation.
2. The orchestrator will scan `_iwish-output/2. Product Planning/` for files matching `*prd*` or `*product-brief*` and push matched file(s) as sources to PC-1. **Do NOT hardcode filename**.
3. If domain research reveals regulations: Orchestrator handles creating PC-5 (Core-Compliance).
4. Cross-query PC-1 ↔ RL-2 via `/nlm-cross` (PRD covers domain constraints?).
5. Orchestrator automatically updates `foundation-checklist.yaml`.
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/verify-nlm-checked.py --target "project"`. If it fails, HALT immediately and do not proceed.
