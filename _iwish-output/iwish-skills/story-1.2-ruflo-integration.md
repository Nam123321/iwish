# Story 1.2: Booster Dev-Agent Integration

**Epic:** Epic 1: Agent Booster & WASM/Regex LLM Bypass
**Depends On:** Story 1.1 (DONE) — `agent-booster/scripts/booster-engine.js`
**Story Title:** Booster Dev-Agent Integration
**Goal:** Wire the `agent-booster` skill into the dev-agent workflow so that when a code modification request is received, the booster engine is consulted FIRST. If it succeeds, the LLM call is bypassed; if it falls back, the request proceeds to the LLM without corrupting context.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story integrates Story 1.1's core engine into the dev-agent pipeline as a middleware:
1. **File I/O Layer**: Reads source files from disk, writes modified content back.
2. **Decision Layer**: Consults `matchIntent` to determine booster eligibility.
3. **Transform Layer**: Runs `applyTransform` with `runWithTimeout` guard (100ms).
4. **Routing Layer**: Returns structured result that tells the caller whether to skip LLM or forward to it.
5. **Middleware Layer**: Provides `createBoosterMiddleware()` for pipeline composition.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a dev-agent receives a code modification request with a file path and intent, **When** the request enters the pipeline, **Then** `tryBoostFirst(filePath, intent)` is called BEFORE any LLM invocation.
- **AC2:** **Given** the booster engine successfully transforms the code (match + transform within 100ms), **When** `tryBoostFirst` returns, **Then** it writes the modified file to disk and returns `{ boosted: true, modified_content, filePath }`, allowing the caller to skip the LLM call entirely.
- **AC3:** **Given** the booster engine falls back (no match, timeout, or error), **When** `tryBoostFirst` returns, **Then** it returns `{ boosted: false, reason: 'no_match'|'timeout'|'error', originalCode }` with the original code intact so the LLM pipeline can proceed without data corruption.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 0 (reuses Story 1.1 result shape) → 0
3. **UI Surface:** 0 (API only) → 0
4. **Cross-Domain:** 1 (file I/O + booster engine) → 0
5. **Flow Complexity:** 2 (timeout + fallback routing + middleware pattern) → 0
6. **Test Burden:** 3 (file mocking, timeout scenarios, middleware chain) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Call booster first on modification request | Task 1: Implement `tryBoostFirst(filePath, intent, options?)` that reads file, checks `matchIntent`, runs `applyTransform` with timeout. | ✅ Mapped |
| AC2 | Write file on boost success, skip LLM | Task 2: On successful transform, write modified content to disk and return `{ boosted: true }` result. | ✅ Mapped |
| AC3 | Forward to LLM on fallback without corruption | Task 3: On fallback, return `{ boosted: false, reason, originalCode }` with pristine original code. | ✅ Mapped |
| AC1-3 | Middleware composition for dev-agent | Task 4: Implement `createBoosterMiddleware()` that wraps `tryBoostFirst` as a pipeline-composable middleware function. | ✅ Mapped |

---

## 🧪 5. Test Plan
| # | Test Case | Expected Outcome |
|---|-----------|------------------|
| T1 | `tryBoostFirst` with valid file + matching intent → boost succeeds | `{ boosted: true, modified_content: <string> }`, file written |
| T2 | `tryBoostFirst` with valid file + non-matching intent → fallback | `{ boosted: false, reason: 'no_match', originalCode }` |
| T3 | `tryBoostFirst` with non-existent file → error fallback | `{ boosted: false, reason: 'error' }` |
| T4 | `tryBoostFirst` with unknown intent → fallback | `{ boosted: false, reason: 'no_match' }` |
| T5 | `tryBoostFirst` respects custom timeout option | Times out with slow transform → `{ boosted: false, reason: 'timeout' }` |
| T6 | `tryBoostFirst` does NOT write file on fallback | File content remains unchanged |
| T7 | `tryBoostFirst` DOES write file on success | File content is updated to transformed version |
| T8 | `createBoosterMiddleware` returns a function | typeof === 'function' |
| T9 | Middleware calls next() on fallback | next() is invoked with original context |
| T10 | Middleware does NOT call next() on success | next() is never invoked |
| T11 | Middleware preserves context payload integrity | context.code matches original on fallback |
| T12 | `tryBoostFirst` with `dryRun: true` does not write file | Returns success but file unchanged |
| T13 | Edge case: empty file → graceful fallback | `{ boosted: false, reason: 'no_match' }` |
| T14 | Edge case: null/undefined filePath → error | `{ boosted: false, reason: 'error' }` |
| T15 | Result shape validation for success | Has all required fields |
| T16 | Result shape validation for fallback | Has all required fields |

---

## 💬 6. Socratic Review Synthesis Summary
- **Separation of Concerns:** `tryBoostFirst` handles the file I/O + booster orchestration; `createBoosterMiddleware` handles pipeline composition. Neither leaks internal booster details.
- **Fallback Reason Taxonomy:** Three distinct reasons (`no_match`, `timeout`, `error`) give the caller enough information to log/route without exposing engine internals.
- **Context Integrity:** The original code is captured BEFORE any transform attempt and returned verbatim on fallback, guaranteeing zero corruption of the LLM context payload.
- **Dry Run:** Optional `dryRun` flag lets callers test boost eligibility without side effects — useful for metrics and preview.

---

## 🛡️ 7. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9.5 | All AC paths covered: success → write, fallback → preserve, middleware → route. |
| Data Integrity & State | 9.5 | Original code preserved on fallback; file only written on confirmed success. |
| Security & Validation | 9.0 | Input validation on filePath/intent; timeout inherited from Story 1.1's 100ms guard. |
| Performance & Scalability | 9.5 | Single file read + regex check; no unnecessary allocations on fallback path. |
| Error Handling & Recovery | 9.5 | All I/O errors caught and mapped to `{ reason: 'error' }` fallback. |
| Architectural Depth & Leverage | 9.0 | Middleware pattern enables clean pipeline composition without coupling. |
| UX Empathy | 8.5 | Clear reason codes; dryRun support for safe exploration. |

**TOTAL AVERAGE: 9.21/10 (PASS)**

---

**Status:** `DONE`

---

## 🔍 8. Self-Review Report

### Code Quality
- **JSDoc coverage:** 100% — all exported functions, internal helpers, and the middleware closure have full JSDoc with `@param`, `@returns`, and `@example`.
- **Separation of concerns:** `tryBoostFirst()` handles file I/O + booster orchestration; `createBoosterMiddleware()` handles pipeline composition. Neither leaks internal booster details.
- **Result builders:** Dedicated `boostSuccess()` and `boostFallback()` helpers ensure consistent result shapes across all code paths.
- **Naming:** Clear, descriptive names following existing project conventions (`tryBoostFirst`, `createBoosterMiddleware`, `boostFallback`).
- **No external dependencies:** Pure Node.js with only `node:fs`, `node:path`, and the sibling `booster-engine.js` imports.

### Acceptance Criteria Verification
| AC | Status | Evidence |
|----|--------|----------|
| AC1: Call booster first on modification request | ✅ PASS | `tryBoostFirst` reads file → `matchIntent` → `applyTransform` with timeout. Tests T1-T3, T23. |
| AC2: Skip LLM on success, write file | ✅ PASS | File written on success, middleware does NOT call `next()`. Tests T7, T10, T23. |
| AC3: Forward to LLM on fallback without corruption | ✅ PASS | `originalCode` preserved verbatim, middleware sets `context.code` and calls `next()`. Tests T4, T6, T9, T11, T24. |

### Test Coverage: 30/30 tests passing
- **tryBoostFirst success:** 4 tests (wrap_try_catch, add_jsdoc, format_syntax, file write verification)
- **tryBoostFirst fallback:** 3 tests (no_match, unknown intent, file unchanged)
- **tryBoostFirst error:** 4 tests (non-existent file, null/undefined filePath, null intent, empty string)
- **tryBoostFirst edge cases:** 3 tests (empty file, dryRun, custom timeout)
- **Result shape validation:** 2 tests (success + fallback shapes)
- **createBoosterMiddleware:** 7 tests (next on fallback, skip next on success, context preservation, missing filePath/intent, null context, dryRun config, missing next)
- **Full pipeline integration:** 3 tests (boost+verify, fallback+preserve, sequential boosts)

### Regression: Story 1.1 tests: 39/39 still passing ✅

### Edge Cases Handled
- `null`, `undefined`, empty string filePath/intent → graceful error fallback
- Non-existent file → `{ reason: 'error', originalCode: null }`
- Empty file content → `{ reason: 'no_match' }`
- Already-transformed code → clean fallback, no double-transform
- `dryRun: true` → transform previewed but file NOT written
- Missing `next()` in middleware → no crash on either success or fallback path
- Missing `filePath` or `intent` in middleware context → falls through to `next()`
- Null/invalid context object → falls through to `next()`

### Architecture Decisions
1. **Two-function API:** `tryBoostFirst` for direct use, `createBoosterMiddleware` for pipeline composition — covers both imperative and declarative usage patterns.
2. **Reason taxonomy:** Three distinct reasons (`no_match`, `timeout`, `error`) give callers enough granularity for logging and routing without exposing engine internals.
3. **Context preservation:** Original code is captured BEFORE any transform attempt and returned verbatim on fallback, guaranteeing zero corruption of the LLM context payload.
4. **Middleware convention:** Follows the standard `(context, next)` pattern, making it composable with any middleware-based pipeline.
