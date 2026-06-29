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

## Step 2.5: Compliance Pre-Check (MANDATORY)
Before execution, the Agent MUST search for existing `.cjs` or `.spec.ts` test files related to the story.
1. Inspect the files to ensure they comply with Zero-Trust guidelines:
   - They MUST interact with the actual DOM using semantic locators (e.g. `getByRole`, `getByText`).
   - They MUST NOT use fragile locators (`.locator`, `.click('.class')`).
   - They MUST NOT inject fake/mocked API requests or dump mocked strings as evidence.
2. **Override Rule:** If any script violates these rules (is caught "làm màu"), the Agent MUST overwrite it entirely with a proper Zero-Trust compliant Playwright script before proceeding.

## Step 3: Execution & Evidence Collection
### 3A: Engine A (Headless Playwright) - MANDATORY EXECUTION
- **Kiểm tra công cụ:** Trình tạo QA (`webwright-qa-generator`) dựa trên công cụ Webwright của Microsoft (cài đặt qua `uvx` hoặc `pip`).
- Trực tiếp chạy lệnh kiểm tra sự tồn tại của `webwright` (ví dụ `webwright --help` hoặc lệnh tương đương do skill định nghĩa).
- **Yêu cầu Xác nhận (Ask):** Nếu CÓ lỗi (command not found), Agent **TUYỆT ĐỐI KHÔNG** tự động bypass. Agent PHẢI dừng quy trình lại và thông báo: *"Webwright chưa được cài đặt. Bạn có muốn install Webwright để sử dụng AI Automation QA không, hay muốn tiếp tục với Vanilla Playwright?"*.
- **Fallback Strategy**: CHỈ KHI người dùng xác nhận "Tiếp tục với Vanilla Playwright", Agent mới được phép bỏ qua wrapper script và tiến hành dùng LLM context gốc để sinh code Playwright.
- Mã Playwright sinh ra bắt buộc chạy ở chế độ headless và xuất kết quả (DOM snapshot, HAR log, screenshot) vào `qa/evidence`.
- *Requirement:* The Agent MUST have `enable_write_tools=true` to write and execute the test scripts natively.

### 3B: Engine B (Agentic Ephemeral MCP) - POST-FAILURE TRIAGE ONLY
- If Engine A fails, the QA Agent may use `chrome-devtools-mcp` tools attached to a separate debugging instance to inspect the DOM, identify missing selectors, or triage the failure.
- Agent proposes script fixes based on triage and loops back to 3A.

### 3C: DoD Audit (Claude Kit Standard)
- Execute Lighthouse and Axe checks programmatically (via CLI or Playwright integration) rather than relying on GUI MCP tools.
- Audit results MUST be captured and appended to the `qa/evidence` folder inside the Story directory.

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

