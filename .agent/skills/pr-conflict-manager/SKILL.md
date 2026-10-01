---
name: pr-conflict-manager
description: Intercepts, classifies, and safely resolves Git conflicts or semantic
  drift before a Pull Request is allowed to merge.
---
# PR Conflict Management Skill

## Purpose
Enforces rigorous Zero-Trust policies to prevent silent semantic breaks, core script tampering, and uncommitted user data loss during PR generation and conflict resolution.

## Edge Case Guardrails (Zero-Trust)
1. **[P1 & P5] Strict Verifier Source & Tier 1 Review Trigger:** `watchmen-verify.py` is executed from the origin/master branch to prevent Chicken-and-Egg bypasses by attackers altering the PR's verification script. If Core TCB scripts are conflicted or modified, the workflow HALTS immediately, auto-reverts to master, and mandates running `/review <story_id>`.
2. **[P2] State Lifecycle & Auto-Rollback:** `git pull --rebase` is wrapped in a strict try/catch. Unresolved conflicts automatically trigger `git rebase --abort` to keep the worktree pristine.
3. **[P3] OS-Level Concurrency:** Execution acquires an OS-level flock on `.git/pr-conflict-manager.lock` to prevent race conditions during DB tests or git state changes.
4. **[P6 & P8] Python Hygiene:** Ghost file purging utilizes `ghost-file-buster.sh` instead of blind destructive `rm -rf` or `git clean -fd`.
5. **[P4 & P9] Resource Governance:** Hard timeouts and pre-flight dependency checks (`npx`, `prisma`) are enforced before triggering the Semantic Test suite.
6. **[P10] Party-Mode Code & Script Clarification (Anti-Data-Loss):** When conflicts involve core source code (`src/`), schemas (`prisma/`), or utility scripts (`.agent/scripts/`), blind script execution and arbitrary overwriting are strictly FORBIDDEN. The agent MUST invoke `/party-mode` to conduct Socratic analysis of differences between `master` and branch, and formulate a surgical merge plan.

## Execution Flow

```bash
python3 .agent/scripts/pr-conflict-executor.py
```

This single command deterministically executes all Zero-Trust Scenarios:
1. **Concurrency Lock & Pre-flight**: Acquires `fcntl.flock` on `.git/pr-conflict-manager.lock`.
2. **Core Script Tampering Check (Tier 1)**: Validates integrity against `origin/master`.
   - On Drift/Tampering: HALTS and prompts: `👉 Run '/review <story_id>' to re-audit the story implementation.`
3. **Ghost File Purging**: Runs `ghost-file-buster.sh` to sanitize the workspace safely.
4. **Semantic Rebase & Conflict Classification**:
   - If **Clean**: Proceeds to Step 5.
   - If **Tier 1 (Core TCB Security Conflict)**: Reverts to `origin/master`, aborts rebase, and prompts `/review <story_id>`.
   - If **Tier 2 (Utility Script Conflict)**: Extracts AST diffs and triggers `/party-mode` for Socratic reconciliation.
   - If **Tier 3 (Core Code / Schema Conflict)**: Extracts conflict diffs and triggers `/party-mode` for surgical code merge.
   - If **Dependency Conflict (`package-lock.json`)**: Re-installs dependencies deterministically.
5. **Semantic Test Mandate**: Runs `npx prisma validate && npx vitest run` with a 300s timeout before allowing PR push.

If the executor exits with code 1, the PR is **BLOCKED**. If code 0, you may proceed.
