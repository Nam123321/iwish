---
name: webwright-qa-generator
description: "Use when generating persistent E2E automation tests based on the Webwright methodology (Playwright Python/JS scripts). This skill creates robust, resilient code-based UI interaction scripts instead of relying on ephemeral single-action MCP DevTools operations."
inputs:
  - test_spec: "Path to manual-test-spec.md"
  - target_url: "URL to test"
outputs:
  - playwright_script: "Generated Playwright script"
mcp_tools_required: []
subagent_triggers: []
---

# Webwright QA Generator Skill

This skill acts as an adapter to launch Microsoft Webwright via `uvx` dynamically, providing a Zero-Trust manual test execution environment with live DOM feedback.

## Execution Rules

1. **Adapter Strategy:**
   DO NOT write raw Playwright scripts blindly if you can use Webwright to auto-navigate and generate the scripts.
   Execute the wrapper script `.agent/skills/webwright-qa-generator/scripts/run-webwright.sh` to trigger the Webwright AI loop.

2. **Flaky Loop Guarantee:**
   **Fallback:** If the wrapper script fails completely (due to missing Python, blockages, or 3-retry exhaustion), you MUST fall back to generating vanilla Playwright code using your own LLM context.
   **Graph-Context Resolution (MANDATORY):** Before writing code, you MUST consult the `FeatureGraph`, `data-spec.md`, and KnowledgeGraph (`Epic-risk-matrix.md`) to map out exact component dependencies and edge cases.
   **Implementation-Aware Generation (MANDATORY):** Before generating vanilla code, you MUST use `view_file` or `code_search` to read the actual implementation source code (e.g. `.tsx` components, `api-routes.ts`, `seed-accounts.js`) identified in the Graph. You MUST NOT guess or hallucinate CSS selectors, data-testids, or mock accounts.

3. **Validation Requirements (Semantic Assertions):**
   - Once the script/evidence is generated, you MUST run `.agent/scripts/validate-qa-evidence.py` to ensure the generated evidence strictly follows Zero-Trust requirements (no fragile CSS/XPath locators, no dummy files).
   - **MANDATORY EXPECT()**: Your generated Playwright scripts MUST include explicit semantic assertions (`expect(page.locator(...)).toBeVisible()`, `expect(page).toHaveTitle(...)`) to validate that the UI has successfully transitioned to the correct state. Taking a screenshot is NOT enough to pass a test case; you must assert the business logic physically in the code.
