---
epic: EPIC-OPS-03
storyId: STORY-OPS-3.2
status: "Completed"
priority: "P1"
assignee: "Krillin"
phase: "forge"

---
# Story 3.2: Build rollback-deployment workflow [FLOW-OUT: ops.rollback.executed]

## 1. TL;DR
Create the `rollback-deploy.md` workflow assigned to Krillin. This enables rapid, 5-minute reversions of unstable production infrastructure, with a critical failsafe that routes database schema regressions to Android 17.

## 2. Context & Problem
When an `incident-response` triggers a SEV-1 due to a bad deployment, SREs need to immediately restore the last stable state. Manual rollbacks are stressful and error-prone. This workflow automates re-pointing images or Git hashes, bringing Mean Time to Recovery (MTTR) down dramatically. 

## 3. Technical Requirements & Architectural Constraints
1. **Workflow File Target**: Create `templates/library/ops-pack/workflows/day-2/rollback-deploy.md`.
2. **Behavior**: Workflow instructs Krillin to identify the previous known-good Git tag or container hash, and orchestrate an Infrastructure-as-Code reversion (e.g. `kubectl rollout undo` or Docker tag reversion).
3. **Schema Safeguard (Veto Protocol)**: Database schema reversions are notoriously destructive. Krillin MUST NOT auto-revert migrations. Schema rollbacks must trigger a hard handoff to `<persona>SecOps</persona>` (Android 17) for explicit human veto processing.
4. **Audit Trail**: All rollbacks must be logged transactionally.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Code-Only Rollback**
- **Given** an unstable production deployment without DB schema changes
- **When** Krillin executes the rollback workflow
- **Then** Krillin immediately reverts the application container/code
- **And** logs the event to the deploy-audit.log.

**Scenario 2: State-Breaking Schema Handoff**
- **Given** the bad deployment included a database migration (e.g. DROP COLUMN)
- **When** Krillin executes the rollback workflow
- **Then** Krillin halts execution
- **And** escalates to Android 17 (Veto Protocol) asking for Explicit Human Override.

**Scenario 3: Non-Idempotent Infrastructure (Edge Case Mitigation)**
- `[EDGE-CASE]` **Given** the rollback command fails midway through the process
- **When** executing the reversion
- **Then** Krillin must not leave the cluster in a split-brain state, but must alert for manual SRE intervention immediately.

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary
- **Edge Cases Detected (Hit):** Stateful data loss during DB rollbacks. Mitigated via strict Android 17 escalation.
- **Data Impact (Kira Lite):** Read-only environment state.
- **Flow Impact (Shinji Lite):** Produces `ops.rollback.executed` or `ops.rollback.escalated`.
- **Testability Check (Quinn Lite):** 3/3 ACs Automatable via simulated environments.

## 6. Development Execution Steps (For Whis/Vegeta)
1. Initialize `rollback-deploy.md` under `day-2/`.
2. Ensure clear instruction branching: "If DB migration detected -> Escalate to 17".
3. Mark story as `COMPLETED`.

---
> **Status:** COMPLETED
