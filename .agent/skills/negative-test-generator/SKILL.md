---
name: "negative-test-generator"
description: "Trigger this skill when a user story requires QA testing, specifically to analyze requirements and automatically generate negative test cases and failure scenarios to prevent confirmation bias."
inputs: ["story_id", "story_content"]
outputs: ["negative_test_cases"]
mcp_tools_required: ["view_file", "grep_search"]
subagent_triggers: []
---

# negative-test-generator

## When to Use This Skill
- When an Epic or Story is entering the validation or QA phase.
- When generating a test plan to ensure negative scenarios are covered.
- When a user explicitly requests negative test cases or failure scenarios to prevent confirmation bias.

## Core Rules
1. **Bias Mitigation:** Actively look for assumptions in the story and challenge them with edge case data (nulls, extreme values, timeouts, invalid state transitions).
2. **Failure Scenarios First:** Prioritize scenarios where the system fails, degrades gracefully, or rejects bad input.
3. **Traceability:** Map every negative test case back to a specific Acceptance Criteria or implicit constraint.
4. **Verifiability:** Negative test cases must be actionable and machine-testable.

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-1 | Read Story Content | A (Deterministic) | view_file exit code | Tool execution output |
| G-2 | Identify Constraints | B (Trust-Based) | Agent reasoning | Transcript audit |
| G-3 | Generate Tests | B (Trust-Based) | Agent reasoning | Markdown output |
| G-4 | Verify Coverage | A+B (Hybrid) | Script + Agent | Coverage check output |

## Red Flags — STOP and Reconsider
- ❌ Do not write "happy path" or positive test cases using this skill.
- ❌ Do not generate generic failure cases (e.g., "system crash") without context.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The story doesn't mention error handling." | Negative testing explicitly targets what is NOT mentioned to expose unhandled errors and unspoken assumptions. |
