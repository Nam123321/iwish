# Story 2.1: Rollback Task Stack Manager

**Epic:** Epic 2: Topological Rollback Engine
**Story Title:** Rollback Task Stack Manager
**Goal:** Implement a stack-based rollback manager that tracks executed workflow steps and can reverse them in LIFO order when failures occur.
**Status:** IN_PROGRESS → DONE
**Priority:** High

---

## 🎯 1. User Story

As a **workflow orchestrator agent**, I want to **register (execute, rollback) pairs for each sub-task and have a stack that can reverse them in LIFO order**, so that **failed pipeline runs are cleanly rolled back without leaving corrupted state**.

---

## 📝 2. Acceptance Criteria (AC)

- **AC1:** **Given** a sub-task step, **When** `register(stepId, executeCmd, rollbackCmd)` is called, **Then** the step is stored in an internal registry with both its execute and rollback commands.
- **AC2:** **Given** a registered step, **When** `markCompleted(stepId)` is called, **Then** the step is pushed onto `completed_stack` in execution order.
- **AC3:** **Given** a populated `completed_stack`, **When** `rollbackAll()` is invoked, **Then** the engine iterates the stack in **reverse order** (LIFO) and executes each step's rollback hook, returning `{ rollback_completed: boolean, rollback_log: Array }`.
- **AC4:** **[EDGE-CASE]** **Given** a rollback command that throws/fails, **When** `rollbackAll()` encounters it, **Then** it aborts immediately (no further rollbacks), throws `RollbackAbortError` with full diagnostics including stepId, error, and partial log.
- **AC5:** **[EDGE-CASE]** **Given** an unknown `stepId`, **When** `markCompleted()` is called with it, **Then** the method throws with a descriptive error message.
- **AC6:** **Given** any rollback execution, **When** each step runs, **Then** a structured log entry `{ stepId, status, timestamp, error? }` is recorded.

---

## 📐 3. Plan Tune Complexity Check

1. **AC Volume:** 6 (≤ 8) → 0
2. **Data Model Spread:** 1 (registry Map + completed stack) → 0
3. **UI Surface:** 0 (CLI only) → 0
4. **Cross-Domain:** 0 (Pure Node.js) → 0
5. **Flow Complexity:** 2 (LIFO traversal + abort-on-failure) → 0
6. **Test Burden:** 3 (Mock rollback commands, failure injection, edge cases) → 0

**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix

| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Register (execute, rollback) pairs | Task 1: Implement `register(stepId, executeCmd, rollbackCmd)` storing entries in a `Map`. | ✅ Mapped |
| AC2 | Store completed_stack | Task 2: Implement `markCompleted(stepId)` that validates stepId and pushes to stack. | ✅ Mapped |
| AC3 | rollbackAll() in reverse order | Task 3: Implement LIFO traversal executing rollback hooks and collecting structured logs. | ✅ Mapped |
| AC4 | Abort on rollback failure | Task 3: Catch errors during rollback, throw `RollbackAbortError` with diagnostics. | ✅ Mapped |
| AC5 | Unknown stepId error | Task 2: Validate stepId exists in registry before pushing. | ✅ Mapped |
| AC6 | Structured log entries | Task 4: Build log array with `{ stepId, status, timestamp, error? }` per step. | ✅ Mapped |

---

## 🛠️ 5. Tasks

- [x] Task 1: Implement `RollbackManager` class with `register()` method and internal `Map` registry
- [x] Task 2: Implement `markCompleted()` with validation and `completed_stack` array
- [x] Task 3: Implement `rollbackAll()` with LIFO traversal, abort-on-failure, and `RollbackAbortError`
- [x] Task 4: Implement `clear()`, `getStack()`, `getLogs()` utility methods
- [x] Task 5: Implement CLI interface with actions: `register_step`, `execute_rollback`, `clear_stack`, `show_stack`
- [x] Task 6: Write comprehensive unit tests

---

## 🧪 6. Test Plan

| # | Test Case | AC |
|---|-----------|-----|
| 1 | Register a step and verify it's stored in registry | AC1 |
| 2 | Mark a registered step as completed, verify it's on the stack | AC2 |
| 3 | rollbackAll() executes hooks in reverse order (3 steps) | AC3 |
| 4 | rollbackAll() returns `{ rollback_completed: true, rollback_log }` on success | AC3, AC6 |
| 5 | rollbackAll() aborts and throws RollbackAbortError when a hook fails | AC4 |
| 6 | Partial log is available in RollbackAbortError diagnostics | AC4, AC6 |
| 7 | markCompleted() throws for unknown stepId | AC5 |
| 8 | Each log entry has stepId, status, timestamp fields | AC6 |
| 9 | clear() resets both registry and stack | AC1, AC2 |
| 10 | getStack() returns copy (not mutable reference) | AC2 |
| 11 | Duplicate stepId registration throws | AC1 |
| 12 | rollbackAll() on empty stack returns success with empty log | AC3 |

---

## 💬 7. Socratic Review Synthesis Summary

- **Architecture:** Pure in-memory stack + Map registry. Rollback commands are async functions (or sync wrappers), allowing both shell-command and programmatic hooks.
- **Error Strategy:** Fail-fast on rollback errors. The `RollbackAbortError` carries the partial log and failing step info so the caller can diagnose and decide on manual recovery.
- **CLI:** Thin CLI wrapper using `process.argv` parsing; all logic lives in the exported class.

---

## 🛡️ 8. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | LIFO traversal is inherently correct for undo operations. |
| Data Integrity & State | 9.5 | Stack and registry are kept in sync; markCompleted validates before push. |
| Security & Validation | 9.0 | No shell exec in library code; rollback commands are caller-provided functions. |
| Performance & Scalability | 9.5 | O(n) rollback with n = number of completed steps; typical n < 20. |
| Error Handling & Recovery | 10 | Immediate abort + RollbackAbortError with full diagnostics. |
| Architectural Depth & Leverage | 9.0 | Standalone module reusable across any workflow runner. |
| UX Empathy | 9.0 | Clear structured logs and error messages for debugging. |

**TOTAL AVERAGE: 9.4/10 (PASS)**

---

**Status:** `DONE`
