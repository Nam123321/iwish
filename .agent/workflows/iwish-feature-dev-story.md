---
legacy_name: 'dev-agent-story'
description: 'Execute a story by implementing tasks/subtasks, writing tests, validating, and updating the story file per acceptance criteria'
disable-model-invocation: true
---


> [!IMPORTANT]
> **STANDARDS INJECTION (MANDATORY):**
> During coding and testing phases, you MUST use `view_file` to load `/.agent/fragments/test-bootstrap.md` and `/.agent/fragments/ux-principles.md` to adhere to core quality guidelines.

> [!WARNING]
> **MECHANICAL COMPILATION GATE (MANDATORY):**
> Before marking any task as complete or sending the code to Review, the dev-agent MUST execute a local build check (e.g., `npm run build`, `vite build`, or `npx tsc --noEmit && npx vite build --emptyOutDir=false`). This guarantees no unresolved imports or syntax errors slip through to the Review-Agent.

> [!CAUTION]
> **CRYPTOGRAPHIC SPEC LOCK (WATCHMEN MODE 1):**
> The specification files (`story.md`, `ui-spec.md`, `data-spec.md`) are cryptographically hashed and locked. You MUST NOT modify them to make your code appear compliant. The post-code runner will compare hashes and REJECT the pipeline immediately if any spec tampering is detected. Focus on writing code that matches the specs, not changing specs to match the code.
IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/code/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.


# Code Execution Orchestrator
> [!IMPORTANT]
> **ZERO-TRUST DESIGN APPROVAL GATE (MANDATORY):**
> Before executing `step-cd-01-setup`, the dev-agent MUST run: `python3 .agent/scripts/validate-design-approval.py <story_dir>`.
> If the script exits with code `1` and outputs `FATAL: HALT_AND_WAIT_FOR_HUMAN`, the dev-agent MUST NOT start any code implementation. You must HALT completely and wait for the user to approve the design manually using `approve-design.py`.

> [!IMPORTANT]
> **ZERO-TRUST AI-ML GATE (Category A):**
> Before executing `step-cd-01-setup`, run: `python3 .agent/scripts/validate-aiml-gate-entry.py --story-dir "<story_dir>" --story-id "<story_id>"`.
> If the story contains `domain: AI-ML` and lacks valid recent AI-ML Tri-Source Evidence, execution is BLOCKED immediately. You MUST run `/ai-system-architect --mode=evaluate` first.


> [!IMPORTANT]
> **AUTO-INJECT TAGS (AFTER EACH TASK):**
> After completing each task in your implementation plan, you MUST run:
> `python3 .agent/scripts/inject-story-tag.py <story_id>`
> This ensures all modified code files receive the required `@story-X.Y` tag.


This workflow executes:
1. step-cd-01-setup
2. step-cd-02-implementation
3. **step-cd-02.5-unknowns-micro-scan (NEW — UIP Integration)**
4. step-cd-03-testing
5. **step-cd-03.5-auto-traceability-link (MANDATORY)**
6. step-cd-04-pre-review-gap-scan
7. **step-cd-05-workspace-hygiene-cleanup (MANDATORY)**

> [!IMPORTANT]
> **AUTO-TRACEABILITY LINK (MANDATORY):**
> After testing (step-cd-03) and BEFORE pre-review gap scan (step-cd-04), the dev-agent MUST:
> 1. Run: `python3 .agent/scripts/inject-story-tag.py <story_id>` (final catch-all injection)
> 2. Run: `python3 .agent/scripts/validate-story-tags.py --story <story_id>` (MUST pass before continuing)
> 3. Run: `uv run .agent/scripts/ac-to-task-mapper.py --story <path_to_story.md>`
> 4. Run: `python3 .agent/scripts/auto-traceability-linker.py --story <path_to_story.md> --sync-matrix`
> 5. Run: `python3 .agent/scripts/validate-story-completion.py --story <path_to_story.md>` (Zero-Trust Gate)


> [!CAUTION]
> **NO MANUAL TRACEABILITY EDITS:**
> You MUST NOT manually edit the Traceability Matrix inside `story.md`. The pipeline integrity runner strictly requires the `auto-traceability-linker.py` script to generate the paths and evaluate the state. Manually writing 'Yes', 'done', or filling in files by yourself violates Zero-Trust enforcement and is strictly FORBIDDEN.

> [!IMPORTANT]
> **UNKNOWNS MICRO-SCAN (DEV PHASE — MANDATORY):**
> After completing implementation tasks (step-cd-02) and BEFORE testing (step-cd-03), the dev-agent MUST:
> 1. Run: `python3 .agent/scripts/run-unknowns-scanner.py --story-id {id} --phase dev --context {story_file} --story-dir <story_dir>`
> 2. The script automatically executes the curated tool set (`drift-detector`, `deviation-logger`, `fmea-scanner`) and generates `<story_dir>/unknowns-gate-{id}-dev.json`.
> 3. Extract findings from the generated JSON and append them to `_iwish-output/unknowns/unknowns-ledger.yaml`.
> 4. If any finding links to a MACRO assumption (via `macro_impact: true`), flag it for the Orchestrator to run Bridge logic.

> [!IMPORTANT]
> **ZERO-TRUST INTEGRITY GATE (MANDATORY ENFORCEMENT):**
> Immediately after running `auto-traceability-linker.py` (Step 3.5) and before Step 4, you MUST run:
> `python3 .agent/scripts/pipeline-integrity-runner.py --target <story_id> --type story --phase post-code`
> - If exit code `1` → HALT. This means Step 3.5 failed to link your code/tests (or you forgot to add `@implements` / `@cover` tags). You MUST fix your tags and re-run the linker until this gate passes!

> [!IMPORTANT]
> **WORKSPACE HYGIENE CLEANUP (MANDATORY GATE):**
> Before marking the story as `dev_completed`, you MUST:
> 1. Delete or move all scratch scripts (e.g. `test*.js`, `fix*.py`, `*.log`) created in the workspace root during this session.
> 2. Ensure NO `mock_*.json` or temporary files are saved in `_iwish-output/3. Development` or other structural folders. Use `_iwish-output/adhoc-workspace/scratch/` for all temporary files.
> 3. Verify cleanup by running: `python3 _iwish-output/adhoc-workspace/scratch/clean_workspace.py` (if available) or manually deleting the files.

---

> **📘 NotebookLM Integration Hook (UKP)**
> This hook is auto-triggered when this workflow executes. Agent MUST read `ae-notebook-orchestrator` skill before proceeding.
> **UKP Orchestrator**: The orchestrator handles all context enrichment and knowledge retrieval natively. Do not load legacy CENS fragments.
> Auto-triggered during implementation and after story completion.

### PULL (conditional) + KNOWLEDGE COLLECT

1. **During implementation**: If the story requires interaction with unfamiliar SDK/framework → Use `/nlm-check` or invoke `ae-notebook-orchestrator` → Pull documentation from relevant UKP notebooks. **Do NOT hardcode filenames.**
2. **After story completion**: Invoke `ae-notebook-orchestrator` (Capture phase) → Capture novel solutions, workarounds, or patterns discovered during implementation → Route to appropriate notebook (RL for reusable patterns, OP-1 for story-specific context).
