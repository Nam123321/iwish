---
name: "behavioral-coverage-guardian"
description: "Use when evaluating Code Reviews (Layer 1.5 or 1.8) to enforce physical test execution and behavioral coverage. DO NOT put a workflow summary here."
inputs: ["story_id", "coverage_file_path"]
outputs: ["exit_code", "missing_coverage_list"]
mcp_tools_required: []
subagent_triggers: []
---

# Behavioral Coverage Guardian

## When to Use This Skill
- During the Code Review phase (specifically Layer 1.5 or 1.8).
- Whenever a story is being evaluated for completeness and the SCS (Spec Compliance Score) might be structurally anchored.
- To prevent developers from bypassing business logic by merely satisfying Database Schema or UI constraints without writing execution tests.

## Core Rules
1. **Never trust self-reported coverage:** Dev Agents cannot simply say "tests passed". You must demand physical execution artifacts.
2. **Execute the Zero-Trust Runner:** You must run the `runner.py` script included with this skill to validate that the physical coverage file exists and maps to modified business files.
3. **Trace AC to Code:** Tests must explicitly target the Acceptance Criteria. If test logic is just `expect(true).toBe(true)` (dummy tests), flag it as a Silent Bypass.

## Execution Guide (Tier 1 Only)
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
```bash
python3 .agent/skills/behavioral-coverage-guardian/scripts/runner.py --story <story_id> --coverage-file coverage/lcov.info
```
*(Note: If the project uses a different coverage path, update the `--coverage-file` flag accordingly).*

If the script returns a non-zero exit code, you MUST **REJECT** the review with the exact `[TYPE 1]` or `[TYPE 2]` error reason.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| BCG-01 | Physical Coverage Verification | Category A | `runner.py` exits 1 if `lcov.info` is missing | Output of `runner.py` |
| BCG-02 | File Coverage Mapping | Category A | `runner.py` maps Git Diff to `lcov.info` | Output of `runner.py` |
| BCG-03 | Dummy Test Bypass Check | Category B | Review Agent must read test files to check for dummy assertions | Agent review report |
| BCG-04 | Global Coverage Threshold | Category A | `runner.py` exits 1 if total coverage < 80% | Output of `runner.py` |

**Enforcement Maturity:** 75% (3 Category A / 4 Total Gates) - Meets Anti-Fabrication Policy.

## Red Flags — STOP and Reconsider
- 🚩 **Hallucinated Execution:** If you evaluate test coverage by just reading the test file without executing a validation script, STOP. This is a Silent Bypass.
- 🚩 **Trusting Dummy Tests:** If coverage is 100% but the test assertions are generic (e.g. `expect(response).toBeDefined()`) without asserting the specific AC behavior, STOP.
- 🚩 **Unmapped ACs:** If a test file exists but isn't explicitly mapped to an Acceptance Criterion, it does not count towards behavioral validation.
- If you find yourself thinking "The user already approved the schema, so the behavior is implicitly complete", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The PRISMA validation passed, so the API must be ready." | Database structures do not equate to business logic. Execution validation is required. |
| "I can't find `lcov.info`, I'll assume they ran tests manually." | Without physical evidence, the review MUST fail. (Category A Gate). |

## Boilerplate / Snippets
```bash
# Generate coverage before running the review (if needed)
npm run test:coverage

# Validate coverage against modified files
python3 .agent/skills/behavioral-coverage-guardian/scripts/runner.py --story <story_id>
```
