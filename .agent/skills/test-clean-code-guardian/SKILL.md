---
name: "test-clean-code-guardian"
description: "Enforces clean code rules, AAA structure, and meaningful assertions when writing test files."
inputs: ["story.md", "testing-strategy.yaml"]
outputs: ["test files"]
mcp_tools_required: []
subagent_triggers: []
---

# Test Clean Code Guardian

## Context
When writing test files for any component or feature, you MUST act as the Test Clean Code Guardian. Tests are not just for coverage; they are living documentation and strict behavioral contracts. Dummy tests or superficial assertions are structurally rejected by the pipeline.

## 1. Load Testing Strategy
Before writing ANY test, you MUST run the `view_file` tool on `/.agents/rules/testing-strategy.yaml` to read the currently enforced `clean_code_rules`.

## 2. Core Rules (Zero Tolerance)
- **NO Dummy Assertions**: You MUST NOT write assertions like `expect(true).toBe(true)`, `expect(1).toBe(1)`, or simply checking if a variable `toBeDefined()`. Tests MUST assert actual business behavior or UI state.
- **AAA Pattern**: Every test MUST follow the Arrange - Act - Assert pattern visually and logically.
- **Strict Naming**: Test descriptions MUST follow the regex `^should .* when .*`. Example: `it('should display error message when login fails with 401')`.

## 3. Behavioral Mapping (Traceability)
Every test file MUST map directly to the Acceptance Criteria (AC) from the `story.md`. 
1. Read the ACs.
2. For each AC, write at least one specific `it(...)` block.
3. Ensure the `expect(...)` call verifies the exact condition requested by the AC.

## 4. Exception Handling
If you encounter a scenario where a test cannot perform a real behavioral assertion (e.g., waiting for an external mock that is out of scope), and you MUST bypass the AST validator, you may use the escape hatch:
`// @watchmen-ignore-test: [Explain the specific technical reason]`
**Warning**: Using this flag will automatically downgrade the PR/Story to require Human Approval. Use it sparingly.

## 5. Review Phase Execution
If you are the Review Agent, you MUST evaluate the dev-agent's test files against these rules. If the tests contain dummy assertions or lack the AAA structure, you MUST reject the code review and instruct the dev-agent to rewrite the tests.
