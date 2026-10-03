---
description: 'Step CD-02: Implementation — Executed by iwish-feature-dev-story.md'
---

# Step CD-02: Implementation

## Objective
Execute the instructions defined in this step for the iwish-feature-dev-story.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `iwish-feature-dev-story.md`.

### 🔴 TIER 1: HARD GATES (exit 1 = HALT)

0. **SEC JSON ADHERENCE GATE (Watchmen Category A)** — You MUST physically read the compiled SEC JSON (`_iwish-output/sec/sec-compiled-<story_id>.json`). Before marking the story as `dev_completed`, you MUST generate an AC Traceability Matrix explicitly linking the SEC JSON nodes to the physical code artifacts you implemented. If the SEC JSON is missing, you MUST NOT proceed with code generation.
1. **SHARED TYPES GATE** — Before writing UI or BE code, you MUST define and map the API Contracts, DTOs, and shared types in the project's shared type file (e.g. `src/shared/api-contracts.d.ts` or `packages/shared/types.ts`). Both FE and BE code MUST import these shared definitions. You are FORBIDDEN from locally duplicating API interfaces.
1.8. **TESTING STRATEGY ADHERENCE GATE** — You MUST read and rigidly obey the testing thresholds and formats defined in `[.agents/rules/testing-strategy.yaml](file:///.agents/rules/testing-strategy.yaml)`. You MUST use the `tdd-red-green-refactor` skill to write test files BEFORE implementation code. The pipeline will strictly fail if you use dummy tests or miss coverage thresholds.

1.5. **PRE-FLIGHT GATE** — Before writing any code, run: `python3 .agent/scripts/pre-flight.py <story> --files <files_to_be_modified>` to scan for unfinished dependencies and potential auth/tenant fallback mock issues in API routes.
2. **SPEC CHECKLIST BASELINE GATE** — Before writing code, you MUST first run `OOB_SIGNING_KEY=dummy python3 .agent/scripts/auto-traceability-linker.py --story <path_to_story>` (and HALT on failure), and then run `python3 .agent/scripts/pipeline-integrity-runner.py --target <story_id> --type story --phase pre-code` to establish a baseline. After implementation, you must re-run the checker (via `phase post-code`). If SCS < 75%, you MUST HALT and fix.
2.5. **IRON LAW VALIDATION GATE** — Before executing any code fix (manual or via fast-track), run `python3 .agent/scripts/validate-iron-law.py <story_id> --target <file_path>`. If exit code 1, HALT.
2.7. **ARCHITECTURE COHERENCE GATE** — Before introducing any NEW dependency, library, or technology not already in the story's `data-spec.md`, you MUST run:
   `python3 .agent/scripts/pipeline-integrity-runner.py --target <story_id> --type story --phase spec`
   - If the new technology is marked `future` or `deprecated` in TDR: HALT. You MUST NOT import or install it.
   - If the technology is unregistered (WARN): Log advisory in `task.md` and continue, but flag for review.
   - **Trigger condition:** This gate activates when dev-agent runs `npm install`, `pip install`, or adds a new `import` for a package not in the project's existing `package.json`/`requirements.txt`.
3. **SPEC RE-READ & AC CHECKPOINT** — After completing every 3 tasks (or after any context truncation event), you MUST:
   - Re-read the spec files using `view_file` and run the `spec-compliance-checker.py` script. If SCS drops > 10% from baseline, you MUST HALT and remediate.
   - Run SEC Progress Check: `python3 .agent/scripts/verify-sec-progress.py <story_id>`. This verifies progress against the SEC definitions.
4. **UI TOKEN VALIDATION GATE** — After generating or modifying UI components, run `python3 .agent/scripts/validate-ui-tokens.py --file <path> --design <path_to_design.md>`. If it exits with error, you MUST HALT and fix.
4.5. **TRACEABILITY MATRIX UPDATE GATE** — You are FORBIDDEN from modifying `story.md` directly (this violates Cryptographic Spec Lock). Instead, when completing tasks, you MUST add metadata tags to your physical code and test files: `// @implements AC-1` for implementation code, and `// @cover AC-1` for test code. The Orchestrator will run `auto-traceability-linker.py` out-of-band to automatically discover these tags and update the Traceability Matrix in `story.md`.
5. **MOCK APPROVAL GATE** — Before using any mocks (excluding auth mocks):
   a. Ask the user for approval.
   b. If approved, add `[MOCK_APPROVED]` annotation to the code.
   c. If it is an auth/tenant mock (e.g. mock tenant ID fallback), it is **BLOCKING** and never approvable. Must use real auth.
   d. Set story status: `completed-with-mock` (after registering in compiler).

### 🟠 TIER 2: MEDIUM GATES (Must pass before story completion)

6. **SEMANTIC LAYOUT AST GATE** — Rigidly obey Semantic Layout AST Constraint JSON (`ast-constraint-story-{story_id}.json`) if present in UI spec. Propose optimized mutation to user if DOM depth is excessive.
7. **IMPL-PLAN ADHERENCE GATE (Watchmen Category A)** — The Implementation Plan (`{story_dir}/impl-plan.md`) has ALREADY been generated and approved in Step 4.0 of flow.md. You MUST NOT regenerate it. Instead:
   - Load and read the approved `impl-plan.md`
   - Verify its hash matches the Cryptographic Spec Lock (enforced by `pipeline-integrity-runner.py --phase pre-code`)
   - Follow the File Manifest strictly during implementation
   - Before creating/modifying any file, verify it EXISTS in the impl-plan.md File Manifest
   - If you need to deviate from the plan (create a file NOT in manifest, change technical approach) → HALT and request impl-plan amendment (requires re-approval via `sign_human_gate` MCP tool)
7.5. **KNOWLEDGE-FIRST EXECUTION GATE (UKP)** — Before resolving a task that requires complex implementation logic or domain knowledge, you MUST query the UKP (`/nlm-check` or `ae-notebook-orchestrator`).
   - **Smart Trigger**: Trigger ONLY if Complexity Score (CS) >= 5 AND the task maps to an existing domain in `domain-taxonomy.yaml`.
   - **Validation**: After querying, you MUST run `python3 .agent/scripts/verify-nlm-checked.py --target "story"`. If it fails, you MUST HALT and perform the query before proceeding. Do not rely on internal LLM assumptions.
8. **ANTI-CHEAT LINTER** — Run `node scripts/anti-cheat-linter.js --files <modified_files> --story-dir <story_dir> --story-id <id>` before finishing the story. Must output `linter-output-{id}.json`. If critical findings exist without `[MOCK_APPROVED]` or any auth mocks are found, exit 1 and block completion.
9. **DELETION TEST GATE** — Verify module isolation. Execute `bash .agent/scripts/iwish-deletion-test.sh <target-module>` with user approval.

### 🟡 TIER 3: SOFT GATES (Advisory, log and continue)

10. **SOCRATIC REVIEW GATE 3 (DRIFT)** — Run Socratic Review (Gate 3) to calculate Drift Score. If score > 7, update task.md with `[PAUSED - WAITING FOR DRIFT SYNC]`, `git stash -u` and pause.
11. **DEVIATION CHECK** — After every 3 tasks: load `unknowns-scanner`, run `phase=dev depth=quick` using `deviation-logger` and `drift-detector`.
12. **FEATUREGRAPH INDEXING** — Re-index if cross-feature changes occur.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
