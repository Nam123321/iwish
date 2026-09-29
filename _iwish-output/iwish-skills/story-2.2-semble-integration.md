# Story 2.2: Semantic Merge Audit Hook

**Epic:** Epic 2: Parallel Coordination & Merge Conflict Audit
**Story Title:** Semantic Merge Audit Hook
**Goal:** Create a pre-merge verification script that uses Semble to detect stale symbol references across branches before merging parallel agent work.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. Complete flow:
1. **Input**: Git diff of branch changes (modified files + symbols)
2. **Processing**: Extract modified symbols (functions, classes, variables) from diff
3. **Query**: Semble `find-related` to locate all call-sites of modified symbols in other branches
4. **Validation**: Check if other active branches contain stale references to modified symbols
5. **Output**: Audit report with safe/unsafe merge verdict

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a branch ready for merge, **When** the audit hook runs, **Then** it parses the git diff to identify all modified symbols (function names, class names, exported variables).
- **AC2:** **Given** identified modified symbols, **When** querying Semble with `find-related`, **Then** it scans the codebase for all call-sites and references to those symbols.
- **AC3:** **Given** call-site results, **When** cross-referencing with other active branches' changes, **Then** it flags any branches that contain stale references to symbols that were modified, renamed, or deleted.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 1 (Audit report model) → 0
3. **UI Surface:** 0 → 0
4. **Cross-Domain:** 1 (Git + Semble integration) → 0
5. **Flow Complexity:** 2 (Diff parse + semantic search + cross-branch check) → 1
6. **Test Burden:** 2 (Multi-branch mock scenarios) → 1
**Complexity Score (CS):** 2 (✅ OK)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | Symbol Extraction from Diff | Task 1: Parse `git diff` output, extract function/class/variable names. | ✅ Mapped |
| AC2 | Semble Call-site Search | Task 2: Query `find-related` for each modified symbol. | ✅ Mapped |
| AC3 | Cross-branch Stale Reference Check | Task 3: Compare call-sites against active branch changes, flag stale refs. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Value**: Catches semantic breakage that git's textual merge can't detect — e.g., when Branch A renames a function and Branch B calls it by the old name.
- **Integration**: Runs as a pre-merge hook in the `land-and-deploy` skill flow.
- **Limitation**: Symbol extraction from diff is heuristic (regex-based); may miss complex refactors. Acceptable for I-Wish's current scale.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification |
|---|---|---|
| Functional Correctness | 8 | Regex-based symbol extraction is heuristic but sufficient for common patterns. |
| Data Integrity & State | 9 | Read-only against git and semble; no mutations. |
| Security & Validation | 9 | Local git + local semble; no network exposure. |
| Performance & Scalability | 7 | Bounded by number of modified symbols × semble queries; fine for typical PRs. |
| Error Handling & Recovery | 8 | Falls back to "audit skipped" if semble unavailable; never blocks merge. |
| Architectural Depth & Leverage | 10 | Unique semantic merge safety net for multi-agent parallel workflows. |
| UX Empathy | 9 | Prevents silent breakage in merged code; builds developer trust. |

**TOTAL AVERAGE: 8.57/10 (PASS)**

---

**Status:** `DONE`
**Depends On:** Story 1.1
