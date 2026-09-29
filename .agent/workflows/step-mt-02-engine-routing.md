---
description: 'Step MT-02: Engine Routing — Executed by manual-test.md'
---

# Step MT-02: Engine Routing

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

## Step 1.5: Implementation-Aware Testing (MANDATORY)
Before generating any test scripts, the Agent MUST physically inspect the implementation source code to prevent hallucinations.
1. **Targeted Inspection:** Using the precise file names extracted from Step 1.4, the Agent MUST use `code-search` or `view_file` to read the actual React/Vue components (e.g. `.tsx`), `schema.prisma`, `api-routes.ts`, and backend controllers.
2. **Extraction:** Identify exact `data-testid`, class names, DOM structure, payload schema, and data types (UUID vs Int).
3. **Mock/Seed Data Check:** The Agent MUST read `seed-accounts.js` or equivalent mock data files to retrieve existing valid test accounts (e.g. `admin@cowok.ai`) instead of making up fake data. Test scripts MUST use data that actually exists in the local DB.


## Step 2: Liveness Probe & Engine Routing
Before executing tests, the Agent MUST verify environment readiness.
1. **Liveness Check:** Ping the target URL. The Agent MUST collect the exact target URL or port from the user (e.g., `http://localhost:3004`) instead of assuming a default like `3000`. If unreachable or returning a server error, the Agent MUST capture the failure (e.g., connection error log) as evidence and abort the test immediately with status `FAILS`. **Graceful Failure/Mocking of evidence is STRICTLY FORBIDDEN.**

Determine whether to use **Engine A (Playwright)** or **Engine B (Agentic MCP)** under **Strict Mutual Exclusion**:
1. **Default Execution:** Engine A (Playwright) running in **headless mode** is the mandatory default for all test executions to prevent macOS GUI constraints.
2. **Interactive Debugging:** Engine B (`chrome-devtools-mcp`) is ONLY permitted for post-failure triage and exploratory debugging. It must NEVER run concurrently with Engine A.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
