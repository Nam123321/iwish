---
name: 'flow-stage-4-review'
description: 'Stage 4 of the /flow pipeline: REVIEW (Code Review, UI Automation, Sync Knowledge Graph)'
---

# /flow-stage-4-review

This is Stage 4 of the 4-stage decomposed SDLC pipeline.

## Structured Handoff Verification
Before proceeding, you MUST verify that Stage 3 completed successfully. Check for the existence of `<story_dir>/code-stage-evidence.json`. If missing, HALT and prompt the user to run `/flow-stage-3-code`.

## Workflow Guidelines
**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response unless `--auto-approve` is set.
To complete a [Zero-Trust Gate], you MUST call `watchmen-mcp` Server and paste the `[x] {HMAC_SIGNATURE}` into `task.md`.

### Steps:

6. **Step 6: Code Review & Validation (`/review`)**
   - **[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/pipeline-integrity-runner.py --story <story_id> --phase review`
   - **[ZERO-TRUST AI-ML CHECK]**: Run: `python3 .agent/scripts/validate-aiml-gate-entry.py --story-dir "<story_dir>" --story-id "<story_id>"`. If story is tagged `domain: AI-ML`, reject review if evidence is missing or stale.
   - Execute static analysis, tests, SAST.
   - **[Native Auto-Fix Loop]**: If REJECTED, you MUST run `python3 .agent/scripts/auto-fix-gate-evaluator.py --file <aggregated_review_json> --iteration <current_loop_count>`. (Max 3 iterations).
     - If the script outputs `DECISION: AUTO_FIX` (exit code 0), you MUST automatically run `/code` (or `/fix-bug --phase=5` if fixing a bug) to correct the errors, and then loop back to run `/review` again. Do not ask for user permission.
     - If the script outputs `DECISION: HALT` (exit code 1), or if you have already looped 3 times and it is STILL rejected, you MUST HALT and present these options to the user:
        - Option A: `/code` (Try coding again with standard Dev Agent)
        - Option B: Backlog (De-prioritize)
        - Option C: `/party-mode` (Socratic Debate)
        - Option D: `/pi-code-agent` (Bounded fix with contract loop — creates micro-tasks from review findings, uses ast-grep scope checks, prevents full-file rewrites)
        - Option E: Other custom solution
   - **[Option D Execution — `/pi-code-agent` Review-Fix]**: When user selects Option D:
     1. Create an isolated sub-directory for this iteration: `mkdir -p "<story_dir>/execution/pi-code-agent/review-fix-<N>"`
     2. Write a focused `impl-plan.md` into this sub-directory containing ONLY the tasks mapped to the rejected findings.
     3. Compile a review-fix contract safely without overwriting the original:
        `python3 scripts/compile-impl-plan-json.py --story-dir "<story_dir>/execution/pi-code-agent/review-fix-<N>"`
     4. Cryptographic Engine Gate: Sign the engine selection with authorized OpenSSL keypair:
        `python3 .agent/scripts/sign-engine-selection.py --story-id "<story_id>" --engine pi-code-agent --output-json "<story_dir>/execution/pi-code-agent/review-fix-<N>/engine-selection.json" --output-sig "<story_dir>/execution/pi-code-agent/review-fix-<N>/engine-selection.json.sig"`
     5. Dispatch with strict engine evidence:
        `python3 scripts/dispatch-code-engine.py --engine pi-code-agent --story-id "<story_id>" --engine-evidence "<story_dir>/execution/pi-code-agent/review-fix-<N>/engine-selection.json.sig" --story-dir "<story_dir>/execution/pi-code-agent/review-fix-<N>" --root "<worktree_dir>" --platform "<active_platform>" --invocation-profile review-fix --caller-capability flow-stage-4-review --caller-source .agent/workflows/flow-stage-4-review.md --output "<story_dir>/execution/pi-code-agent/review-fix-<N>/handoff.json"`
     6. Execute `/pi-code-agent` per-task loop (bounded working set, ast-grep, reviewer checkpoint per task).
     7. After all tasks accepted, loop back to Step 6 (`/review`).

6.5. **Step 6.5: Review-Phase Unknowns Scan & Bridge Check**
   - Run: `python3 .agent/scripts/run-unknowns-scanner.py --story-id {id} --phase review --context {story_file} --story-dir <story_dir>`
   - Trigger Bridge logic or `/party-mode` if needed.

7. **Step 7: Verification Routing (UI vs Non-UI)**
   - Run: `pnpm tsx scripts/detect-ui-story.ts --story-id <story_id> --epic-id <epic_id>`
   - **Case A: Story HAS UI (`has_ui: true`):**
     - Write structured handoff: `echo '{"stage": 4, "status": "completed", "has_ui": true}' > <story_dir>/review-stage-evidence.json`
     - Proceed immediately to **Stage 5: `/flow-stage-5-manual-test`** for live browser testing and visual fidelity audit. (Do NOT execute completion gate here).
   - **Case B: Story is Non-UI (`has_ui: false`):**
     - **[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/pipeline-integrity-runner.py --story <story_id> --phase delivery`
     - Enforce Scope-Locked Git Commits (`git add <specific_files>`).
     - **[DUAL-CONDITION STAGE 4b COMPLETION GATE]**:
       - HALT automation and invoke `ask_question` with 3 options (`Option 1: Deep Evaluation & Loop`, `Option 2: Approve`, `Option 3: Audit Log`).
       - If `Option 1` is chosen: Trigger the Autonomous Internal Remediation Loop across the **7 Core Hardening Dimensions** (`runtime-realism-guardian`), self-healing in the background without prompting the user after micro-fixes, until achieving 10/10 zero-defect consensus.
       - Only upon user selecting `Option 2`: Update SSOT status to `completed` and verify via `validate-story-completion-gate.py`.
     - **Knowledge Graph Sync**:
       - `nohup iwish code-graph > /dev/null 2>&1 &`
       - Safe JSON injection `iwish inject-node ...`

Pipeline is complete!
