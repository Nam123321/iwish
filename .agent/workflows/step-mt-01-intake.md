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
1. Agent locates `manual-test-guide.md` for the given Epic/Story.
   - **Multi-Portal Check:** If the Epic/Story impacts multiple portals (e.g., Customer App and Admin Dashboard), the Agent MUST generate/read separate spec files for each portal (e.g., `manual-test-guide-{id}-customer.md` and `manual-test-guide-{id}-admin.md`).
2. Extract the `Preferred Engine` and `Target Portal` metadata.
3. Extract the Required Evidence Constraints (which of the 7 methods must be collected).
4. **Mock Account Constraint:** Before testing, the Agent MUST use `code-search` or investigate `seed` files to find existing mock test accounts. The Agent MUST NOT create new junk accounts to test (unless the test case is explicitly about the Registration flow).


## Step 1.4: Graph-Context Resolution (MANDATORY)
Before searching blindly for code files, the Agent MUST consult the knowledge graphs to pinpoint exact dependencies and edge cases:
1. **FeatureGraph & Data Spec:** Read the `FeatureGraph` or `data-spec.md` for this Epic/Story to extract the EXACT names of UI components, API endpoints, and Data Models involved.
2. **KnowledgeGraph & Risk Matrix:** Read `Epic-{id}-risk-matrix.md` or consult the Edge Case Guardian output to extract documented edge cases, negative flows, and potential failure points. Incorporate these into the test scenarios automatically.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
