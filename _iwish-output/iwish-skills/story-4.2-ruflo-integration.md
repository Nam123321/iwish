# Story 4.2: Double-Lock TDD Fragment Integration

**Epic:** Epic 4: TDD London School Fragment
**Story Title:** Double-Lock Classifier & Directive Injector
**Goal:** Install a "Double-Lock" checkpoint that classifies stories as mock-heavy and injects a mandatory directive forcing LLM agents to `view_file` the TDD London Fragment before writing test code.
**Depends On:** Story 4.1 (DONE) — `draft-rules/tdd-london-principles.md` and `knowledge-graph-patch-tdd.yaml`

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story delivers a complete vertical slice:
1. **Classification Layer**: `DoubleLockClassifier.isMockHeavy()` analyzes story text for mock-heavy indicators and returns a confidence score.
2. **Directive Generation Layer**: `generateDirective()` produces the standardized Double-Lock markdown block referencing the TDD fragment.
3. **Injection Layer**: `injectDirective()` prepends the directive to story content, with idempotency protection.
4. **Validation Layer**: `validateFragmentLoaded()` checks agent logs for evidence of fragment reading.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a story spec text containing mock-heavy indicators (e.g., "mock", "stub", "spy", "vi.fn", "jest.fn", "dependency injection", "test double", "integration test"), **When** `isMockHeavy(storySpec)` is called, **Then** it returns `{ isMockHeavy: boolean, score: number, matchedIndicators: string[] }` where `score` is between 0 and 1 and `isMockHeavy` is `true` when score >= 0.3.
- **AC2:** **Given** a fragment path, **When** `generateDirective(fragmentPath)` is called, **Then** it produces a markdown block containing the Double-Lock header, mandatory `view_file` instruction, and the fragment path.
- **AC3:** **Given** a story content string and a fragment path, **When** `injectDirective(storyContent, fragmentPath)` is called on a mock-heavy story, **Then** the directive is prepended to the story. If the story is NOT mock-heavy, the content is returned unchanged.
- **AC4:** **[IDEMPOTENCY]** **Given** a story that already contains the Double-Lock directive, **When** `injectDirective()` is called again, **Then** the directive is NOT duplicated.
- **AC5:** **Given** an agent log string, **When** `validateFragmentLoaded(agentLog)` is called, **Then** it returns `{ loaded: boolean, evidence: string|null }` indicating whether the log contains a `view_file` call targeting the TDD fragment path.
- **AC6:** **[EDGE-CASE]** **Given** empty or null input to any method, **Then** the method handles it gracefully without throwing.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 6 (≤ 8) → 0
2. **Data Model Spread:** 0 (pure functions, no persistence) → 0
3. **UI Surface:** 0 (no UI) → 0
4. **Cross-Domain:** 0 (pure text analysis) → 0
5. **Flow Complexity:** 2 (classification + injection + validation) → 0
6. **Test Burden:** 3 (multiple indicator combinations, idempotency, edge cases) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|---------------------|-----------------------------|--------|
| AC1 | Mock-heavy classification | Task 1: Implement `isMockHeavy()` with indicator scanning and scoring | ✅ Done |
| AC2 | Directive generation | Task 2: Implement `generateDirective()` producing the markdown block | ✅ Done |
| AC3 | Directive injection | Task 3: Implement `injectDirective()` with mock-heavy gate | ✅ Done |
| AC4 | Idempotency guard | Task 3: Check for existing `DOUBLE-LOCK` marker before injecting | ✅ Done |
| AC5 | Agent log validation | Task 4: Implement `validateFragmentLoaded()` with view_file pattern matching | ✅ Done |
| AC6 | Edge case handling | Task 5: Guard all methods against null/empty/invalid input | ✅ Done |

---

## 📋 5. Tasks
- [x] Task 1: Implement `DoubleLockClassifier` class with `isMockHeavy()` scoring
- [x] Task 2: Implement `generateDirective()` with Double-Lock markdown template
- [x] Task 3: Implement `injectDirective()` with idempotency check
- [x] Task 4: Implement `validateFragmentLoaded()` with log pattern matching
- [x] Task 5: Add edge case guards (null, empty, non-string inputs)
- [x] Task 6: Write comprehensive unit tests covering all ACs

---

## 🧪 6. Test Plan
- **Test 1:** `isMockHeavy()` returns high score for mock-heavy story text
- **Test 2:** `isMockHeavy()` returns low score for non-mock story text
- **Test 3:** `isMockHeavy()` respects the 0.3 threshold boundary
- **Test 4:** `isMockHeavy()` handles empty/null input gracefully
- **Test 5:** `generateDirective()` produces correctly formatted markdown with fragment path
- **Test 6:** `generateDirective()` handles empty/null path gracefully
- **Test 7:** `injectDirective()` prepends directive to mock-heavy story
- **Test 8:** `injectDirective()` leaves non-mock story unchanged
- **Test 9:** `injectDirective()` does NOT duplicate an existing directive (idempotency)
- **Test 10:** `validateFragmentLoaded()` detects `view_file` call to fragment path
- **Test 11:** `validateFragmentLoaded()` returns false when fragment was not loaded
- **Test 12:** `validateFragmentLoaded()` handles empty/null log gracefully
- **Test 13:** `isMockHeavy()` detects all individual indicator keywords
- **Test 14:** Score is proportional to the density of indicators

---

## 💬 7. Socratic Review Synthesis Summary
- **Scoring Algorithm:** Each indicator keyword is searched case-insensitively. The score is `matchCount / totalIndicators`, capped at 1.0. This gives a normalized measure of how "mock-heavy" a story is.
- **Threshold Choice:** 0.3 means at least ~3 of the 8 indicator categories must appear. This is intentionally low to err on the side of forcing agents to read the fragment.
- **Idempotency:** The injection method checks for the `🔒 DOUBLE-LOCK DIRECTIVE` marker before prepending, preventing accumulation of directives across repeated pipeline runs.
- **Log Validation:** Searches for `view_file` followed by a path containing `tdd-london-principles`, which covers both absolute and relative path references in agent logs.

---

## 🛡️ 8. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | All 6 ACs directly addressed with well-scoped methods and clear return types. |
| Data Integrity & State | 10 | Stateless classifier; no side effects or persistence. Pure functions operating on strings. |
| Security & Validation | 9.5 | No external input execution. All inputs are sanitized via type checks. |
| Performance & Scalability | 10 | Regex-based text scanning is O(n) per indicator. Handles large story texts efficiently. |
| Error Handling & Recovery | 10 | All methods guard against null/undefined/non-string inputs with safe defaults. |
| Architectural Depth & Leverage | 9.5 | Integrates with the Story 4.1 fragment via path reference. Reusable for any future fragment-based checkpoints. |
| UX Empathy | 9.5 | Prevents agents from generating brittle tests. Directive text is clear and actionable. |

**TOTAL AVERAGE: 9.79/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (classification → directive generation → injection → validation).
- [x] **Deletion Testable?** Yes (removing the classifier means stories lose Double-Lock protection).
- [x] **Interface vs Implementation?** Yes (public API is 4 methods; scoring algorithm is an implementation detail).

---

**Status:** `DONE`
