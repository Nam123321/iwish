---
description: 'Step MT-03: Execution — Executed by manual-test.md'
---

# Step MT-03: Execution

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

## Step 2.5: Compliance Pre-Check & Environment Setup (MANDATORY)

### 1. Dynamic Worktree Port Allocation (Zero Collision Gate):
Before starting any local server or test execution, the Agent MUST allocate an isolated port:
```bash
python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py assign "<story_id>" "<worktree_path>"
```
Validate port assignment:
```bash
python3 .agent/skills/worktree-port-allocator/scripts/validate-port-lifecycle.py --phase assign --port <ALLOCATED_PORT>
```

### 2. Live Server Startup & Liveness Probe:
Start the development server strictly binding to IPv4 and the allocated port:
```bash
HOST=127.0.0.1 npm run dev -- -p <ALLOCATED_PORT> &
SERVER_PID=$!
```
Probe server liveness:
```bash
python3 scripts/validate-live-browser-qa.py <epic_id> <story_id> --check-liveness --port <ALLOCATED_PORT>
```

### 3. Compliance Pre-Check & Playwright Execution:
Inspect existing or generated `.cjs` / `.spec.ts` test files:
1. **Semantic Locators:** MUST interact with actual DOM using semantic locators (`getByRole`, `getByText`).
2. **Zero Mock Link Rule (MANDATORY):** Test scripts MUST target `http://127.0.0.1:<ALLOCATED_PORT>`. Using `file://` URLs, static HTML in `scratch/`, or mocked endpoints is STRICTLY FORBIDDEN.
3. **Data Isolation (EC-P4-02):** Use dynamic UUID prefixes (`qa-test-<uuid>@cowok.ai`) for test data to prevent database state contamination.
4. **WebGL & Headless Canvas Safeguard (EC-P5-01):** Run Playwright with software rendering flags and hard timeout 30s:
   ```bash
   TARGET_PORT=<ALLOCATED_PORT> npx playwright test tests/e2e/Story-<story_id>.spec.ts --chromium-sandbox=false --timeout=30000
   ```
5. **Action Delta Verification:** For every state-mutating interaction, capture Before and After screenshots to verify visual state changes via hash delta.

### 4. Cleanup & Port Release (Finally Block):
Immediately upon completing execution (pass or fail), release the allocated port and terminate server process groups:
```bash
python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py release "<story_id>"
python3 .agent/skills/worktree-port-allocator/scripts/validate-port-lifecycle.py --phase release --port <ALLOCATED_PORT>
```

## Exit Criteria
- [ ] Dev server ran on verified, isolated worktree port.
- [ ] Playwright test executed against live `http://127.0.0.1:<ALLOCATED_PORT>`.
- [ ] Worktree port released cleanly.

