---
name: 'flow-stage-3b-code'
description: 'Stage 3B of the /flow pipeline: CODE (Code Generation, Post-Code Validation)'
---

# /flow-stage-3b-code

This is Stage 3B of the 6-stage decomposed SDLC pipeline.

## Structured Handoff Verification
Before proceeding, you MUST verify that Stage 3A completed successfully. Check for the existence of `<story_dir>/plan-approved-evidence.json`. If missing, HALT and prompt the user to run `/flow-stage-3a-plan-safe`.

## Workflow Guidelines
**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response unless `--auto-approve` is set.
To complete a [Zero-Trust Gate], you MUST call `watchmen-mcp` Server and paste the `[x] {HMAC_SIGNATURE}` into `task.md`.

### Steps:

3.95. **Step 3.95: AI-ML Evidence Check (Zero-Trust Category A)**
   - Run: `python3 .agent/scripts/validate-aiml-gate-entry.py --story-dir "<story_dir>" --story-id "<story_id>"`
   - If AI-ML story lacks valid evidence, execution is blocked immediately.

3.98. **Step 3.98: Machine Contract Compilation (`impl-plan.json`)**
   - Compile human-oriented `impl-plan.md` into machine-readable actionable contract `impl-plan.json`:
     `python3 scripts/compile-impl-plan-json.py --story-dir "<story_dir>"`
   - Verify that `<story_dir>/impl-plan.json` exists and conforms strictly to `.agent/schemas/impl-plan.schema.json`.
   - The compiled `impl-plan.json` acts as the SINGLE SOURCE OF TRUTH (SSOT) for code generation and scope lockdown.

3.98.5. **Step 3.98.5: Structured Intent-Constraint Fusion (Dual-Input Boundary)**
   - The Dev-Agent (Prompt) receives `impl-plan.md` solely as the "Control Plane" (How to do it, business logic).
   - Simultaneously, load `contract-context.json` into the System Prompt as the "Data Plane" (Absolute Database & Security Constraints).
   - **CRITICAL**: Absolutely do not merge Constraints directly into `impl-plan.md`. This separation prevents LLM Context Exhaustion and ensures security boundaries are treated as rigid rules rather than flexible suggestions.

3.99. **Step 3.99: Authorized Engine Selection**
   - Compile the native capability catalog before presenting engine choices:
     `python3 .agent/scripts/pi-code-agent/compile_capability_catalog.py --root "<project_root>"`
   - Run the bridge drift check before presenting choices:
     `python3 .agent/scripts/check-codex-skill-bridges.py --root "<project_root>"`
   - Present exactly four choices and record the user's authorized selection, engine provenance, catalog hash, plan hash, and external-key requirement:
     1. `/pi-code-agent` — native Pi/OMP-inspired executor; zero additional OMP/Pi BYOK.
     2. `/omp-orch-skill` — explicit external OMP compatibility path; may consume configured provider API keys.
     3. `/code` — standard iWish path through `/iwish-feature-dev-story`.
     4. `/tournament` — comparison mode for the three engines above; only available when isolated candidate worktrees and the tournament guard are verified.
   - Plan approval does not authorize an engine, paid provider, elevated tool, or merge. If the user does not choose, HALT and wait.
   - Do not silently default to OMP or native execution.

4. **Step 4: Implementation (authorized engine selection)**
   - Ensure dependencies in `sprint-status.yaml` are `completed`.
   - **Choice 1: Native `/pi-code-agent`**:
     - Read and execute `.agent/workflows/pi-code-agent.md`.
     - Prepare the governed IDE handoff with:
       `python3 scripts/dispatch-code-engine.py --engine pi-code-agent --story-dir "<story_dir>" --root "<worktree_dir>" --platform "<active_platform>" --invocation-profile flow-story --caller-capability flow-stage-3b-code --caller-source .agent/workflows/flow-stage-3b-code.md --output "<story_dir>/execution/pi-code-agent/handoff.json"`
     - Use the pinned catalog, task ledger, and task-owned lease. Do not claim LSP unless the capability probe reports it truthfully.
     - A worker may emit only a candidate receipt. `task_runner.py review` and an externally signed `task_runner.py accept` are mandatory before an accepted transition.
   - **Choice 2: Explicit OMP Engine with Safety & Trace Lifecycle**:
     - **Check Fallback Latch**: If `<worktree_dir>/.circuit-breaker-tripped` exists, skip this choice and alert the user.
     - **[ENGINE ANNOUNCEMENT]**: Orchestrator MUST announce the engine provenance:
       `[ENGINE DISPATCH] Invoking Oh My Pi (OMP) for Stage 3B code implementation based on <story_dir>/impl-plan.json...`
     - The adapter MUST execute implementation strictly targeting `impl-plan.json` with Dual-Model Pairing (Primary Coder: `gemini-3.8-flash`, Advisor: `gemini-3.1-pro-preview`) and In-Process LSP checking.
     - Run: `python3 scripts/adapters/omp-orch-executor.py --mode code --plan-file "<story_dir>/impl-plan.json" --output-dir "<story_dir>" --worktree-dir "<worktree_dir>"`
     - Exit Codes:
       - `0`: Success. Trace artifacts generated in `<story_dir>`:
         - `omp-trace.html` (Offline rendering, 0 token cost, visual UI for human inspection).
         - `omp-trace.jsonl` (Full Chain of Thought and tool trace for AI learning).
         - `omp-report.md` (Token breakdown, cache hit %, and USD cost metrics).
       - `1`: Test logic failed (OMP auto-heals; do not fallback prematurely).
       - `10`: Engine/API/Network crash -> **Workspace atomically rolled back**. Latch tripped: `<worktree_dir>/.circuit-breaker-tripped`. **HALT and display user decision prompt** (Retry OMP / Switch to Native Dev-Agent / Cancel). Do NOT automatically fall back without user consent.
       - `11`: Configuration error -> HALT.
   - **Choice 3: Standard `/code`**:
     - Prepare the governed standard-code handoff with:
       `python3 scripts/dispatch-code-engine.py --engine code --story-dir "<story_dir>" --root "<worktree_dir>" --output "<story_dir>/execution/code/handoff.json"`
     - Execute standard `/code` implementation following `step-cd-02-implementation.md`.
   - **Choice 4: `/tournament`**:
     - Run only through a validated isolated-worktree tournament adapter with identical plan/catalog/checker/test hashes for every candidate.
     - If the current tournament implementation cannot prove isolation, mark the choice `UNAVAILABLE` and HALT; do not run shared-checkout branch switching as if it were parallel execution.
     - Require the human scorecard selection before merge or cleanup.

4.5. **Step 4.5: Post-Implementation Compliance Check**
   - Run: `python3 .agent/scripts/architecture-coherence-checker.py ... --output-json "<story_dir>/coherence-report-post-impl.json"`

4.6. **Step 4.6: Post-Implementation Unknowns Micro-Scan**
   - Run: `python3 .agent/scripts/run-unknowns-scanner.py --story-id {id} --phase dev --context {story_file} --story-dir <story_dir>`

5. **Step 5: Anti-Cheat & Post-Code Validation**
   - **[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/pipeline-integrity-runner.py --story <story_id> --phase post-code --cwd "<worktree_dir>"`
   - Verifies the SHA-256 hashes of spec files against the pre-code snapshot to detect tampering.

**Handoff to Stage 4:**
Once Step 5 is completed, emit cryptographic stage evidence:
   - If implemented via OMP:
    `python3 scripts/emit-code-evidence.py --story-dir "<story_dir>" --engine "OMP (oh-my-pi/gemini-3.8-flash+gemini-3.1-pro-advisor)"`
   - If implemented via Native `/pi-code-agent`:
     `python3 scripts/emit-code-evidence.py --story-dir "<story_dir>" --engine "Native Pi Code Agent (I-Wish contract loop)"`
   - If implemented via standard `/code`:
    `python3 scripts/emit-code-evidence.py --story-dir "<story_dir>" --engine "Native Dev-Agent (I-Wish standard)"`

Then, prompt the user to invoke `/flow-stage-4-review` (or auto-trigger if `--auto-approve` is on).
