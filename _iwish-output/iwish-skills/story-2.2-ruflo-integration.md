# Story 2.2: Workflow Rollback Integrator & Fail-Safe Hook

**Epic:** Epic 2: Topological Rollback Engine
**Story Title:** Workflow Rollback Integrator & Fail-Safe Hook
**Goal:** Embed the rollback engine into the I-Wish workflow runner so that story builds/tests that fail trigger automatic rollback of completed steps. If a rollback itself fails, abort immediately and hand control to the user.
**Status:** IN_PROGRESS → DONE
**Priority:** High
**Depends On:** Story 2.1 (DONE) — `workflow-rollback/scripts/rollback-manager.js`

---

## 🎯 1. User Story

As a **workflow orchestrator agent**, I want the **rollback engine to be embedded into the pipeline runner so that step failures auto-trigger LIFO rollback and rollback crashes immediately abort with diagnostics**, so that **failed builds never leave the environment in a corrupted state and users always have clear recovery information**.

---

## 📝 2. Acceptance Criteria (AC)

- **AC1:** **Given** a pipeline of steps `[{ stepId, execute, rollback }]`, **When** any step's `execute` function throws, **Then** `rollbackAll()` is automatically triggered for all previously completed steps.
- **AC2:** **Given** a rollback command that crashes during `rollbackAll()`, **When** a `RollbackAbortError` is thrown, **Then** execution stops immediately, a CRITICAL diagnostic report is generated, and no further rollbacks are attempted.
- **AC3:** **Given** a rollback failure, **When** the diagnostic report is generated, **Then** it contains: failed step ID, original error, rollback error, partial rollback log, list of dirty (un-rolled-back) steps, and clear manual recovery instructions.
- **AC4:** **Given** `wrapStep(stepId, executeFn, rollbackFn)`, **When** called, **Then** the step is registered, executed, and marked as completed in a single atomic-like operation. If execution fails, the step is NOT marked completed.
- **AC5:** **Given** a successful pipeline run, **When** all steps complete without error, **Then** `runPipeline` returns a success result with the list of completed step IDs and no rollback is triggered.
- **AC6:** **Given** a failed pipeline with successful rollback, **When** `runPipeline` catches the step error and `rollbackAll()` succeeds, **Then** a WARNING-level diagnostic report is returned indicating clean rollback with full log.

---

## 📐 3. Plan Tune Complexity Check

1. **AC Volume:** 6 (≤ 8) → 0
2. **Data Model Spread:** 1 (delegates to RollbackManager) → 0
3. **UI Surface:** 0 (API only) → 0
4. **Cross-Domain:** 1 (integrates with RollbackManager from Story 2.1) → 0
5. **Flow Complexity:** 3 (sequential pipeline + dual error path: step-fail → rollback-fail) → 1
6. **Test Burden:** 4 (Pipeline mock, wrapStep, dual error paths, diagnostic report format) → 1

**Complexity Score (CS):** 2 (✅ OK — Minor integration complexity, proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix

| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Auto-trigger rollback on step failure | Task 2: `runPipeline()` catches step errors and calls `rollbackAll()` | ✅ Mapped |
| AC2 | Abort on rollback crash with CRITICAL report | Task 3: `handleFailure()` detects `RollbackAbortError` and generates CRITICAL report | ✅ Mapped |
| AC3 | Diagnostic report with dirty steps & recovery instructions | Task 4: `generateDiagnosticReport()` with full context | ✅ Mapped |
| AC4 | wrapStep atomic register+execute+markCompleted | Task 1: `wrapStep()` method | ✅ Mapped |
| AC5 | Success result on clean pipeline | Task 2: `runPipeline()` returns success result | ✅ Mapped |
| AC6 | WARNING report on successful rollback | Task 3: `handleFailure()` handles clean-rollback path | ✅ Mapped |

---

## 🛠️ 5. Tasks

- [x] Task 1: Implement `WorkflowRollbackIntegrator` class with `constructor(rollbackManager)` and `wrapStep(stepId, executeFn, rollbackFn)`
- [x] Task 2: Implement `runPipeline(steps)` — sequential execution with auto-rollback on failure
- [x] Task 3: Implement `handleFailure(error)` — orchestrate rollback, detect `RollbackAbortError`, produce diagnostic reports
- [x] Task 4: Implement `generateDiagnosticReport(error, rollbackResult)` — markdown report with severity levels
- [x] Task 5: Write comprehensive unit tests covering all 6 ACs and edge cases

---

## 🧪 6. Test Plan

| # | Test Case | AC |
|---|-----------|-----|
| 1 | `wrapStep` registers, executes, and marks step as completed | AC4 |
| 2 | `wrapStep` does NOT mark step completed if execution throws | AC4 |
| 3 | `runPipeline` runs all steps sequentially on success and returns success result | AC5 |
| 4 | `runPipeline` auto-triggers rollback when a middle step fails | AC1 |
| 5 | `runPipeline` returns WARNING diagnostic when rollback succeeds after step failure | AC1, AC6 |
| 6 | `runPipeline` returns CRITICAL diagnostic when rollback itself fails | AC2 |
| 7 | CRITICAL diagnostic report includes dirty steps, failed step, and recovery instructions | AC2, AC3 |
| 8 | WARNING diagnostic report includes full rollback log | AC3, AC6 |
| 9 | `handleFailure` distinguishes RollbackAbortError from generic errors | AC2 |
| 10 | `runPipeline` with empty steps array returns success immediately | AC5 |
| 11 | `runPipeline` rollback-on-first-step (no prior completed steps) | AC1 |
| 12 | `generateDiagnosticReport` output is valid markdown with required sections | AC3 |

---

## 💬 7. Socratic Review Synthesis Summary

- **Architecture:** `WorkflowRollbackIntegrator` is a thin orchestrator wrapping `RollbackManager`. It owns no rollback state — it delegates entirely to the manager. This keeps Story 2.1 as the single source of truth for rollback logic.
- **Error Strategy:** Two-tier error handling:
  1. **Step failure** → attempt clean rollback → WARNING report.
  2. **Rollback failure** → immediate abort → CRITICAL report with dirty-step inventory.
- **Diagnostic Reports:** Markdown format with clear severity badges, timestamps, and step-by-step recovery instructions. Designed for both automated parsing and human reading.

---

## 🛡️ 8. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Sequential pipeline with deterministic rollback trigger on any step failure. |
| Data Integrity & State | 9.5 | Delegates state to RollbackManager; wrapStep ensures no phantom "completed" entries on failure. |
| Security & Validation | 9.0 | No shell exec; all steps are caller-provided functions. Input validation on constructor and step shapes. |
| Performance & Scalability | 9.5 | Sequential execution is intentional (workflow steps may have ordering dependencies); no unnecessary parallelism. |
| Error Handling & Recovery | 10 | Dual-tier error handling with CRITICAL abort and user control transfer. |
| Architectural Depth & Leverage | 9.5 | Clean separation — Integrator orchestrates, Manager manages state. No circular dependencies. |
| UX Empathy | 9.5 | Diagnostic reports include dirty-step lists and manual recovery commands for non-technical operators. |

**TOTAL AVERAGE: 9.6/10 (PASS)**

---

## 📋 9. Self-Review

- **Code quality:** Clean ESM module with full JSDoc. No external dependencies. Single Responsibility: Integrator orchestrates, Manager manages state.
- **Test coverage:** 12 test cases covering all 6 ACs, both error paths, edge cases (empty pipeline, first-step failure), and diagnostic report format.
- **Edge cases:** Empty pipeline, single-step failure, first-step failure, rollback crash on any step, async step functions.

---

**Status:** `DONE`
