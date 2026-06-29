---
name: manual-test
description: Dual-Engine Zero-Trust Manual Testing Workflow Orchestrator
category: implementation
roles:
  - qa-agent
  - review-agent
steps:
  - id: step-01-intake
    description: "Read `manual-test-spec.md` and parse Zero-Trust constraints."
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
- A valid `manual-test-spec.md` exists in the target story directory (e.g. `Story-{id}/qa/manual-test-spec.md`).
- `_iwish-output/.../Epic-{id}/Story-{id}/qa/evidence/` directory exists (or equivalent depending on flat/hierarchical layout).

## Step 1: Intake & Parse Spec
1. Agent locates `manual-test-spec.md` for the given Epic/Story.
   - **Multi-Portal Check:** If the Epic/Story impacts multiple portals (e.g., Customer App and Admin Dashboard), the Agent MUST generate/read separate spec files for each portal (e.g., `manual-test-spec-{id}-customer.md` and `manual-test-spec-{id}-admin.md`).
2. Extract the `Preferred Engine` and `Target Portal` metadata.
3. Extract the Required Evidence Constraints (which of the 7 methods must be collected).
4. **Mock Account Constraint:** Before testing, the Agent MUST use `code-search` or investigate `seed` files to find existing mock test accounts. The Agent MUST NOT create new junk accounts to test (unless the test case is explicitly about the Registration flow).

## Step 2: Liveness Probe & Engine Routing
Before executing tests, the Agent MUST verify environment readiness.
1. **Liveness Check:** Ping the target URL. The Agent MUST collect the exact target URL or port from the user (e.g., `http://localhost:3004`) instead of assuming a default like `3000`. If unreachable or returning a server error, the Agent MUST capture the failure (e.g., connection error log) as evidence and abort the test immediately with status `FAILS`. **Graceful Failure/Mocking of evidence is STRICTLY FORBIDDEN.**

Determine whether to use **Engine A (Playwright)** or **Engine B (Agentic MCP)** under **Strict Mutual Exclusion**:
1. **Default Execution:** Engine A (Playwright) running in **headless mode** is the mandatory default for all test executions to prevent macOS GUI constraints.
2. **Interactive Debugging:** Engine B (`chrome-devtools-mcp`) is ONLY permitted for post-failure triage and exploratory debugging. It must NEVER run concurrently with Engine A.

## Step 3: Execution & Evidence Collection
### 3A: Engine A (Headless Playwright) - MANDATORY EXECUTION
- The Agent MUST use the `webwright-qa-generator` skill to write a deterministic Playwright script or reuse an existing one.
- The Playwright script MUST be executed in headless mode.
- The script MUST output the required physical evidence (e.g., DOM snapshot, HAR log, screenshots) into the `qa/evidence` folder inside the Story directory.
- *Requirement:* The Agent MUST have `enable_write_tools=true` to write and execute the test scripts natively.

### 3B: Engine B (Agentic Ephemeral MCP) - POST-FAILURE TRIAGE ONLY
- If Engine A fails, the QA Agent may use `chrome-devtools-mcp` tools attached to a separate debugging instance to inspect the DOM, identify missing selectors, or triage the failure.
- Agent proposes script fixes based on triage and loops back to 3A.

### 3C: DoD Audit (Claude Kit Standard)
- Execute Lighthouse and Axe checks programmatically (via CLI or Playwright integration) rather than relying on GUI MCP tools.
- Audit results MUST be captured and appended to the `qa/evidence` folder inside the Story directory.

## Step 4: Validation Gate
- Execute `python3 .agent/scripts/validate-qa-evidence.py "<Epic_ID>" "<Story_ID>"`.
- The validator ensures the required physical files exist and match the spec constraints.
- For UI stories, ensure the existence of `accessibility-report.md` or `performance-vitals.md` (or a logged warning if failed gracefully).
- If missing, the agent is caught "hallucinating" or being lazy, and the test fails.

## Step 5: Triaging & Guided Loop Engineering
To prevent infinite loops and track state across execution turns, the agent MUST read and write to a persistent loop tracking state file: `.agent/cache/qa-loop.json`.

- **If Test FAILS:**
  - Read `.agent/cache/qa-loop.json` (create it with `attempts: 1` if it doesn't exist for this story/portal).
  - If `attempts < 3`: 
    - Increment `attempts` in `qa-loop.json`.
    - Classify bug (SBRP-Lite vs Critical).
    - If SBRP-Lite: Automatically invoke `/fix-bug`. 
  - If `attempts >= 3`: 
    - Update `qa-loop.json` status to `Exhausted`.
    - **HALT** the workflow and notify the user: *"Maximum retries (3) reached. Test still failing. Manual intervention required."*
  - Upon successful fix, trigger `iwish inject-node` to document the bug (Auto-Immune RCA).
- **If Test PASSES:**
  - Update `qa-loop.json` status to `Pending_Approval`.
  - Transition the story state to `Pending_Approval` in both `sprint-status.yaml` and `story.md`.
  - **HALT** the workflow and notify the user: *"Test passed. Awaiting `/approve-qa` or `/reject-qa` human cross-check."*
