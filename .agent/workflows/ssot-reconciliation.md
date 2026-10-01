---
name: SSOT Reconciliation Gateway
description: Gateway workflow for SSOT Reconciliation Skill. Handles manual and semantic triggers to evaluate and fix drift.
version: 1.0.0
---

# SSOT Reconciliation Gateway

This workflow acts as the entry point for the SSOT Reconciliation Skill (`/ssot-reconciliation-skill/SKILL.md`). It can be invoked manually by the user or automatically via semantic triggers from the Orchestrator Agent.

## Workflow Execution

### Step 1: Input Intake & Dependency Tracking
- Identify the target Story or Feature that initiated the reconciliation request.
- Use the Dependency Tracker logic from the skill to locate the corresponding PRD, UI Spec, Data Spec, and Database Schema files.
- **Action:** Load the target documents into context.

### Step 2: SSOT Evaluation
- Delegate to the `ssot-reconciliation-skill`.
- The skill will run the 3-step Drift Detection Engine:
  1. Contract Extraction (with Caching)
  2. Semantic Diff Engine (with Zero-Trust Proof and Input limits)
  3. Triage Gate Matrix

### Step 3: Plan Generation & User Approval
- If the Triage Gate returns `Drift = True` and authorizes an update, generate `reconciliation-plan.md` detailing the exact files to be updated and the proposed changes.
- **[Zero-Trust Constraint]:** STOP execution and present the plan to the user. Ask for explicit approval.

### Step 4: Execution & Safe Sync
- Once approved, execute the **Safe Sync Execution** protocol defined in the skill:
  1. Mutex Lock.
  2. Physical Backup (`cp file file.bak`).
  3. Apply Changes.
  4. Unlock.
- If the user rejects the plan, discard the drift ticket and perform Git Restore / Backup Rollback if any modifications were pre-staged.
