---
story_id: "STORY-HSEA-3.3"
epic_id: "EPIC-HSEA"
title: "Add Promotion and Rollback Governance"
status: "done"
assignee: "Hit"
priority: "P0"
depends_on: ["STORY-HSEA-3.2b"]
blocks: []
phase: "forge"
---
# Story HSEA-3.3: Add Promotion and Rollback Governance

## 1. Objective
Build safe promotion and rollback gates for the Evolution Lab to ensure generated candidates can only overwrite canonical `.agent/` assets after human approval and strict integrity validations, preventing fatal degradations from corrupting the system.

## 1.1 Context & Tracer Bullet
**Tracer Bullet (Vertical Slice):**
Two companion CLI scripts:
1. `.agent/scripts/promote-trial.js [TRIAL_ID]`: Reads the trial manifest and scorecard. If `decision: "APPROVED"` and `fatal_degradations` is exactly 0, it backs up the existing canonical file to `.agent/evolution-lab/backups/`, overwrites the canonical file with the winning candidate, and logs the lineage.
2. `.agent/scripts/rollback-trial.js [TRIAL_ID]`: Reverses the promotion by restoring the archived backup file to its canonical path.

## 2. Acceptance Criteria
* **AC1:** **Given** a human approved trial **When** the `promote-trial.js [TRIAL_ID]` command is run **Then** the script validates `decision === 'APPROVED'` and `fatal_degradations` list is empty. If validation fails, abort with a strict error.
* **AC2:** **Given** validation passes **When** promoting **Then** the current canonical file is copied to `.agent/evolution-lab/backups/[TRIAL_ID]-[original-name].bak`.
* **AC3:** **Given** the backup is created **When** completing the promotion **Then** the selected candidate file overwrites the canonical `.agent/` asset.
* **AC4:** **Given** a recent promotion **When** the human runs `rollback-trial.js [TRIAL_ID]` **Then** the script restores the `.bak` file from the backups folder to the canonical path, reverting the promotion.

## 3. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1, AC2, AC3 | Build Promotion Script with Gates | T1: Implement `promote-trial.js` | Add validation logic, file backup logic, and overwrite logic. | [x] |
| AC4 | Build Rollback Script | T2: Implement `rollback-trial.js` | Implement file restoration from backups folder. | [x] |

## 4. Dev Notes & Project Memory Context
- Ensure backup files are named with the Trial ID to prevent collisions (e.g., `TRIAL-2026-05-13-native.bak`).
- The scripts must parse both the YAML manifest (for decision and candidate paths) and the Markdown scorecard (for fatal degradation count).

## 5. QA Simulator Guardian Audit

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | The dual script approach exactly satisfies the rollback and promotion governance requirements. |
| Data Integrity & State | 10 | Strict AC1 integrity checks protect canonical files from bad approvals. Backup step ensures perfect reversibility. |
| Security & Validation | 9 | Both `decision` and `fatal_degradations` must pass before any destructive file overwrites occur. |
| Performance & Scalability | 10 | Simple CLI file I/O operations. Zero heavy computation. |
| Error Handling & Recovery | 10 | Dedicated rollback command guarantees a fast panic-recovery UX without relying on git history manually. |
| Architectural Depth & Leverage | 9 | Adheres to Single Responsibility Principle by decoupling promotion logic from the trial runner. |
| UX Empathy | 10 | Explicit commands (`promote` and `rollback`) map perfectly to how a human operator expects to govern changes. |

**Total Average:** 9.71 / 10 - PASS
