---
description: 'Step MT-01: Intake — Executed by manual-test.md'
---

# Step MT-01: Intake

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

---
name: manual-test
description: Dual-Engine Zero-Trust Manual Testing Workflow Orchestrator
category: implementation
roles:
  - qa-agent
  - review-agent
steps:
  - id: step-01-intake
    description: "Read `manual-test-guide.md` and parse Zero-Trust constraints."
  - id: step-02-engine-routing
    description: "Determine execution engine (A vs B) using the 4-layer heuristic."
  - id: step-03-execution
    description: "Run test via chosen engine and collect physical evidence."
  - id: step-04-validation
    description: "Call `validate-qa-evidence.py` to audit the evidence."
  - id: step-05-guided-loop
    description: "If failed, loop to `/fix-bug` (max 3 retries). If passed, wait for Human Cross-Check."
---

# Dual-Engine Zero-Trust Manual Testing Workflow

This workflow orchestrates the QA testing phase by strictly enforcing Zero-Trust physical evidence generation using either Playwright automation or MCP agentic ephemeral testing.

## Prerequisites
- A valid `manual-test-guide.md` exists in the target story directory (e.g. `Story-{id}/qa/manual-test-guide.md`).
- `_iwish-output/.../Epic-{id}/Story-{id}/qa/evidence/` directory exists (or equivalent depending on flat/hierarchical layout).


## Step 1: Intake & Parse Spec
1. Agent checks if `manual-test-guide.md` exists for the target Epic/Story:
   - **Auto-Generation Fallback (MANDATORY):** If `manual-test-guide.md` does NOT exist, the Agent MUST NOT halt. It MUST execute:
     ```bash
     python3 .agent/scripts/generate-qa-scenario.py --epic-id "<epic_id>" --story-id "<story_id>" --story-dir "<story_dir>" --output "<story_dir>/qa/manual-test-guide.md"
     ```
2. **Gate ZT-01A: Cryptographic Sealing of QA Spec (MANDATORY ZERO-TRUST GATE):**
   - Calculate checksum and provenance:
     ```bash
     python3 .agent/scripts/verify-zero-trust-integrity.py --file "<story_dir>/qa/manual-test-guide.md" --conversation-id "<CONVERSATION_ID>" --output "_iwish-output/adhoc-workspace/scratch/{story_id}-spec-integrity.json"
     ```
   - Request Out-of-Band HMAC Cryptographic Signature from Watchmen MCP:
     `call_mcp_tool("watchmen-mcp", "sign_pipeline_gate", {"artifact_path": "<story_dir>/qa/manual-test-guide.md", "gate_name": "qa-scenario-spec"})`
   - **Physical TOCTOU Lock (EC-P2-02):**
     Immediately lock the file to Read-Only to prevent post-seal tampering:
     ```bash
     chmod 444 "<story_dir>/qa/manual-test-guide.md"
     ```
3. Extract `Preferred Engine` and `Target Portal` metadata.
4. Extract Required Evidence Constraints (Live Port, DOM hydration root, Hash Delta $\Delta > 0$).
5. **Mock Account Constraint:** Before testing, use existing mock test accounts or generate ephemeral accounts using UUID dynamic prefixes (`qa-test-<uuid>@cowok.ai`).

## Step 1.4: Graph-Context Resolution & FMEA Enforcement (MANDATORY)
Before searching blindly for code files, consult the knowledge graphs:
1. **FeatureGraph & Data Spec:** Read the `FeatureGraph` or `data-spec.md` to extract exact component names, routes, and API endpoints.
2. **KnowledgeGraph & Risk Matrix:** Read `Epic-{id}-risk-matrix.md` and verify that 100% of risk items with $RPN \ge 25$ are mapped to explicit test cases (`TC-*`) in the FMEA Traceability Matrix.

## Exit Criteria
- [ ] `manual-test-guide.md` exists, verified, and sealed with `.sig` file.
- [ ] File permissions locked to read-only (`chmod 444`).
