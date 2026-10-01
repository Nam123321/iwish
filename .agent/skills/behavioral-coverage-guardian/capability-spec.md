# Capability Spec: behavioral-coverage-guardian

## Type: SKILL
## Status: Draft
## Created: 2026-07-27

### Problem Statement
The current review pipeline has a structural anchoring bias (SCS anchoring) where static schema changes (e.g., in `schema.prisma`) can yield a 100% Spec Compliance Score (SCS) even if the core business logic (API endpoints, background workers) and behavioral tests are missing. The `behavioral-coverage-guardian` fixes this by enforcing a deterministic (Category A) execution gate that requires physical proof of test execution (e.g., `coverage/lcov.info`, vitest execution logs) before a story can be marked `completed`.

### Knowledge Sources
- Source 1: `_iwish-output/party-mode/debate-transcript-14.20-rca.md` — 5 Whys Root Cause Analysis of Story 14.20's failure to implement business logic.
- Source 2: `.agent/workflows/references/code-review-protocol.md` — 3-Layer Code Review Protocol where this skill will be injected (Layer 1.5/1.8).

### Core Concepts
1. **Deterministic Execution Gate (Category A):** Reviews MUST fail if physical test execution artifacts (e.g., coverage reports, test exit codes) are missing.
2. **Anti-Stub Validation:** The skill must ensure tests actually exercise the logic, not just empty stubs or `true === true` bypasses.
3. **AC Traceability:** The skill verifies that executed tests map to the Acceptance Criteria defined in the `story.md`.
4. **Physical Evidence Check:** The Orchestrator or Review Agent must run `npm run test:coverage` (or equivalent) to generate the physical evidence prior to approval.

### Anti-Patterns
- ❌ **Trusting Self-Reported Success:** Never trust a Dev Agent claiming "I ran the tests and they passed" without reading the physical execution log or coverage artifact.
- ❌ **Structural Anchoring:** Never let a 100% SCS from `verify-review-evidence.py` override the behavioral coverage requirement.
- ❌ **Blocking on Minor Thresholds:** Don't fail the gate purely on an arbitrary coverage percentage (e.g., 99%) if the core ACs are covered; focus on AC mapped coverage.

### Best Practices  
- ✅ **Execution First:** Always require the `npm run test` command to be run as part of the pipeline or require its log output to be present.
- ✅ **Cross-Reference:** Map the files listed in the coverage report to the files modified in the Git Diff to ensure the new business logic is actually tested.

### Adversarial Self-Audit
- **The "Why Not" Test:** It increases token load and cognitive overhead during the review phase because the agent must now parse raw coverage/log files. Also, agents might generate "dummy" tests (e.g., `expect(true).toBe(true)`) just to generate coverage.
- **Failure Analysis:** A false negative where legitimate code is blocked because the coverage report path is non-standard or the test framework changed, leading to the guardian failing to find the physical evidence.
- **Redundancy Check:** Not redundant. The current 3-Layer Code Review Protocol (Layer 1.5) checks static AC traceability but lacks runtime/execution coverage validation.

### Deliverables
- [ ] File 1: `.agent/skills/behavioral-coverage-guardian/SKILL.md`

## Red Flags — STOP and Reconsider (Silent Bypasses)
- 🚩 **Hallucinated Execution:** If the Review Agent evaluates test coverage by just reading the test file without executing a validation script, STOP. This is a Silent Bypass.
- 🚩 **Trusting Dummy Tests:** If coverage is 100% but the test assertions are generic (e.g. `expect(response).toBeDefined()`) without asserting the specific AC behavior, STOP.
- 🚩 **Unmapped ACs:** If a test file exists but isn't explicitly mapped to an Acceptance Criterion, it does not count towards behavioral validation.

## FMEA Identified Risks (Zero-Trust Script Logic)
| Scenario | Pillar | Risk | Zero-Trust Script Mitigation (classify_failure) |
|----------|--------|------|-------------------------------------------------|
| `lcov.info` is missing | Pillar 1 | Agent assumes coverage is 0 or script crashes. | Script MUST verify physical file existence. If missing, exit 1 `[TYPE 1: Execution Missing]`. |
| Test suite hangs (e.g. unmocked network) | Pillar 3 | Pipeline timeout. | Execution command MUST be wrapped in a strict timeout (e.g. 60s). Exit 1 on timeout. |
| Modified business logic file has 0% coverage | Pillar 1 | Code bypassed testing. | Script MUST parse Git Diff and cross-check against coverage mapped files. If modified file lacks coverage, exit 1 `[TYPE 2: Insufficient Behavioral Coverage]`. |
| AI generates "Happy Path Only" tests | Pillar 4 | Edge cases ignored to pass SCS. | The guardian MUST require adversarial tests (e.g. Negative tests, Error throwing) for core business logic. |
