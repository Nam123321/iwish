---
story_id: "STORY-HSEA-4.3"
epic_id: "EPIC-HSEA"
title: "Add Turn-Exit Diagnostics for I-Wish Workflows"
status: "DONE"
assignee: "Hit"
priority: "P1"
depends_on: ["STORY-HSEA-1.3"]
phase: "forge"

---
# Story HSEA-4.3: Add Turn-Exit Diagnostics for I-Wish Workflows

## 1. Objective

Define lightweight turn-exit diagnostics for I-Wish workflows so agents record why a run ended, whether memory scoring ran, and what follow-up is required.

## 1.1 Context

Hermes logs why agent turns end. The gap analysis marked turn-exit diagnostics as ADOPT because I-Wish workflows often stop at human checkpoints, blockers, validation failures, or successful completion. HSEA memory and evolution work needs these exit reasons to avoid losing useful learning signals.

## 2. User Story

As a I-Wish reviewer,  
I want each major workflow run to record why it exited,  
So that blockers, skipped memory scoring, and follow-up evolution candidates remain auditable.

## 3. Acceptance Criteria

### AC1: Exit Reason Taxonomy Exists
**Given** a workflow ends  
**When** diagnostics are recorded  
**Then** the exit reason uses a controlled set: `completed`, `blocked`, `awaiting_user_approval`, `validation_failed`, `scope_split_required`, `security_blocked`, or `deferred`.

### AC2: Centralized Persistence (Tracer Bullet)
**Given** a workflow is yielding/exiting  
**When** it outputs diagnostics  
**Then** it MUST append the JSON/Markdown diagnostic block to `.agent/memory/turn-exits.jsonl` (or `.md`) to ensure the record is not lost in ephemeral chat history.

### AC3: Memory/Evolution Follow-Up Is Captured
**Given** a workflow discovers a durable lesson or candidate improvement  
**When** it exits  
**Then** diagnostics state whether memory admission scoring ran, was skipped, or should run later via the `memory_follow_up` field.

### AC4: Workflow Engine Enforcement
**Given** a I-Wish workflow runs via `_iwish/core/tasks/workflow.xml`  
**When** it reaches the final steps  
**Then** `workflow.xml` MUST explicitly mandate the generation and persistence of the Turn-Exit Diagnostics block as a mandatory exit procedure.

## 4. Tasks

- **T1:** Define the final exit reason taxonomy and data payload (JSON/Markdown structure).
- **T2:** Define the centralized persistence target (`.agent/memory/turn-exits.jsonl`).
- **T3:** Update `_iwish/core/tasks/workflow.xml` to include the mandatory "Turn-Exit Diagnostics" block generation and file append instructions at the end of all workflow executions.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Exit taxonomy uses controlled set | T1: Define taxonomy payload | - | [x] |
| AC2 | Append to `.agent/memory/turn-exits.jsonl` | T2: Define persistence target | - | [x] |
| AC3 | Capture memory follow-up | T1: Define taxonomy payload | - | [x] |
| AC4 | Enforce in `workflow.xml` | T3: Update `workflow.xml` | - | [x] |

## 6. Plan Tune Heuristic Scoring

- **AC Volume:** 4 ACs (≤ 8) → 0
- **Data Model Spread:** 0 models → 0
- **UI Surface:** 0 components → 0
- **Cross-Domain:** 0 domains → 0
- **Flow Complexity:** None → 0
- **Test Burden:** 0 tests → 0
- **Complexity Score (CS):** **0**
- **Verdict:** ✅ **OK** (Proceed normally. Story is well-scoped).

## 7. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | Covers the turn-exit diagnostics ADOPT candidate and centralized persistence. |
| Data Integrity & State | 9 | Using `.jsonl` or append-only log ensures atomic state updates without mutating core files. |
| Security & Validation | 9 | Security/validation exits become explicit and auditable. |
| Performance & Scalability | 9 | Append-only compact JSONL prevents file bloat and parses quickly. |
| Error Handling & Recovery | 9 | Blocked/deferred exits become actionable for follow-up bots. |
| Code Quality & Maintainability | 9 | Centralizing the rule in `workflow.xml` avoids updating 50+ individual workflow templates. |
| UX Empathy | 9 | Users can see why a workflow stopped and Evolution Lab can auto-recover context. |

**Total Average:** 9.00 / 10 - PASS
