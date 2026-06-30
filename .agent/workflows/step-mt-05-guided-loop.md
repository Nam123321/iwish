---
description: 'Step MT-05: Guided Loop — Executed by manual-test.md'
---

# Step MT-05: Guided Loop

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

## Step 4: Validation Gate
- **Pre-Validation Gate Check (MANDATORY):** Before running tests, the agent MUST call:
  ```bash
  python3 ../iwish/.agent/scripts/self-healing-runner.py check <Epic_ID> <Story_ID>
  ```
  If this exits with code 1 (GATE BLOCKED), the agent MUST NOT run tests. It MUST halt and inform the user.

- **Test Execution (MANDATORY via self-healing-runner):** The agent MUST NOT run `npx playwright test` directly. Instead:
  ```bash
  python3 ../iwish/.agent/scripts/self-healing-runner.py run <Epic_ID> <Story_ID> -- npx playwright test <test_files>
  ```
  This runs a **unified pipeline**: test execution → validator (7 gates) → pass/fail.
  - If both test AND validator pass: status = `Pending_Approval`, exit 0.
  - If test passes but validator rejects (e.g. Gate 6): counts as a **failed attempt**, triggers retry loop.
  - Agents do NOT need to call `validate-qa-evidence.py` separately — the runner does it.

  The validator runs 7 Hard Gates including:
  - Gate 0: Loop Integrity (checks `qa-loop.json`)
  - Gate 6: UI Presence Assertion — **rejects API Tunnel and Decoy DOM tests**

### Gate 6: Anti-Fake-Pass Rules for Test Script Authors
When writing Playwright test scripts, agents MUST follow these rules to pass Gate 6:

1. **No API Tunnel**: Do NOT use `page.evaluate(() => fetch(...))` as the sole test logic. If testing APIs, the test MUST also verify the UI reflects the API state.
2. **No Decoy DOM**: Do NOT call `page.getByRole()` / `page.locator()` without asserting on the result. Using a DOM locator only to satisfy Gate 1/2 without `expect(locator).toBeVisible()` is flagged as camouflage.
3. **DOM Assertions Required**: Every test for a UI story must contain at least one `expect(page.getByRole/getByText/getByTestId(...)).toBeVisible/toContainText/toHaveText()`.
4. **Login blocks are discounted**: DOM interactions inside `if (page.url().includes('login'))` blocks do NOT count toward the DOM assertion threshold.


## Step 5: Self-Healing Loop (Enforced by Script)
The self-healing loop is **enforced by `self-healing-runner.py` v2.0**, NOT by agent "good faith". The script:

1. **Tracks attempts atomically** in `.agent/cache/qa-loop.json`.
2. **Runs integrated pipeline** — test execution + validator in one command.
3. **Classifies failures** into Type 1 (Script) or Type 2 (App Bug), including validator rejections.
4. **Hard-blocks at 3 retries** — the script refuses to run tests after exhaustion.
5. **Outputs structured HEALING REPORT** in JSON for agent consumption.

### Agent Loop Behavior:
- **If `self-healing-runner.py run` exits 0 (PASS):**
  - Validator already ran (integrated in runner v2.0). Transition story to `Pending_Approval`, halt, notify user.
- **If `self-healing-runner.py run` exits 1 with `action: HEAL`:**
  - Read the HEALING REPORT JSON output.
  - If `failureType: Type1_ScriptFailure`: Fix the test script (wrong selectors, timeouts), loop back to Step 4.
  - If `failureType: Type2_AppBug`: **MANDATORY** — Invoke `/fix-bug` to fix app code. **Do NOT rewrite the test script to avoid the broken page/component.** Changing the test to route around a missing UI element is a "sophisticated fake-pass" and is STRICTLY FORBIDDEN.
- **If `self-healing-runner.py run` exits 1 with `action: HALT`:**
  - **STOP IMMEDIATELY.** Do NOT attempt further runs.
  - Notify user: *"Maximum retries (3) reached. Test still failing. Run `/reject-qa` to reset or `/approve-qa` to override."*

### Anti-Workaround Rule (CRITICAL):
When a DOM assertion fails because a UI element is **genuinely absent** (not wrong selector), the agent MUST:
1. **NOT** change the test to use a different navigation path that avoids the missing element.
2. **NOT** weaken the assertion (e.g., replacing `toBeVisible()` with a broader fallback).
3. **INSTEAD** invoke `/fix-bug` to add the missing UI component to the app, then re-test with the original test script.

The runner v2.1 classifies `timeout + element(s) not found` as `Type2_AppBug` to enforce this automatically.

### Reset (after user decision):
```bash
python3 ../iwish/.agent/scripts/self-healing-runner.py reset <Epic_ID> <Story_ID>
```

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
