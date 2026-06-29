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
- A valid `manual-test-spec.md` exists in the target story directory.
- `_iwish-output/qa-evidence/Epic-{id}/Story-{id}/` directory exists.

## Step 1: Intake & Parse Spec
1. Agent locates `manual-test-spec.md` for the given Epic/Story.
   - **Multi-Portal Check:** If the Epic/Story impacts multiple portals (e.g., Customer App and Admin Dashboard), the Agent MUST generate/read separate spec files for each portal (e.g., `manual-test-spec-{id}-customer.md` and `manual-test-spec-{id}-admin.md`).
2. Extract the `Preferred Engine` and `Target Portal` metadata.
3. Extract the Required Evidence Constraints (which of the 7 methods must be collected).
4. **Mock Account Constraint:** Before testing, the Agent MUST use `code-search` or investigate `seed` files to find existing mock test accounts. The Agent MUST NOT create new junk accounts to test (unless the test case is explicitly about the Registration flow).

## Step 2: 4-Layer Engine Routing
Determine whether to use **Engine A (Playwright)** or **Engine B (Agentic MCP)**:
1. **Flag Override:** Did the user specify `--engine=playwright` or `--engine=mcp`? If yes, force it.
2. **File Check:** Does `tests/e2e/Epic-{id}/Story-{id}.spec.ts` exist? If yes, force Engine A to reuse it.
3. **Spec Preferred:** Does the spec explicitly define Playwright or MCP? If yes, respect it.
4. **Auto-Heuristic:** If `Auto`:
   - If test requires visual verification, dragging, or live OAuth: Route to Engine B.
   - If test is a standard CRUD or form submission: Route to Engine A.

## Step 3: Execution & Evidence Collection
### 3A: Engine A (Persistent Playwright)
- Invoke `/qa-agent-automate` to run the existing script or generate a new one.
- The Playwright script must output the required evidence (e.g., DOM snapshot, HAR log) into the `qa-evidence` folder.

### 3B: Engine B (Agentic Ephemeral MCP)
- QA Agent uses `chrome-devtools-mcp` tools (e.g. `take_screenshot`, `evaluate_script` for DOM tree, `get_network_request`).
- Agent actively follows the Happy Path and Edge Cases.
- Agent manually writes the collected evidence to files in the `qa-evidence` folder.

### 3C: DoD Audit (Claude Kit Standard)
- **If the story involves a UI Portal:** The Agent MUST load the `a11y-debugging` and `debug-optimize-lcp` skills.
- Execute Lighthouse and Axe checks via the Chrome DevTools MCP on the local environment.
- Audit results MUST be captured and appended to the `qa-evidence` folder (e.g., `accessibility-report.md`, `performance-vitals.md`).
- **Graceful Failure:** If the Lighthouse MCP audit fails (e.g., local port issues), log the failure as a warning and proceed. Do not crash the workflow during early UI iteration.

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
