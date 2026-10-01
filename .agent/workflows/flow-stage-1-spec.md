---
name: 'flow-stage-1-spec'
description: 'Stage 1 of the /flow pipeline: SPECIFICATION (Make Story, Data Spec, UI Spec)'
---

# /flow-stage-1-spec

This is Stage 1 of the 4-stage decomposed SDLC pipeline.

## Workflow Guidelines

**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response unless `--auto-approve` is set.

**State Tracking Mechanism:**
At the beginning of this stage, create or open `task.md` in the story-specific subdirectory (`_iwish-output/3. Development/...`) to track progress.

**Out-of-Band (OOB) Authentication Protocol:**
To complete a [Zero-Trust Gate], you MUST:
1. Call the `watchmen-mcp` Server (`sign_pipeline_gate`).
2. Paste the exact `[x] {HMAC_SIGNATURE}` block into `task.md`.

### Steps:

0. **Step 0: Implementation Readiness Gate**
   - Run: `python3 .agent/scripts/validate-implementation-readiness.py`
   - If exit code `1` -> HALT. Route user to `/check-implementation-readiness`.

0.5. **Step 0.5: Story Status Triage**
   - Check story `status`. If `status != backlog`, run drift detection and set `INHERITED_SPEC_MODE = true`.

1. **Step 1: Story Design (`/make-story`)**
   - Generate `story.md`. Ensure OKF YAML header.
   - Run Epic Preflight: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<epic_id>" --type epic --phase planning`
   - Run Architecture Coherence: `python3 .agent/scripts/architecture-coherence-checker.py ...`
   - Validation Gate: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase pre-code` (draft run).

1.5. **Step 1.5: AI-ML Workload Classification (Zero-Trust Category A)**
   - Run: `python3 .agent/scripts/classify-ai-workload.py --story-dir "<story_dir>" --auto-tag --output "<story_dir>/ai-classification.json"`
   - If AI workload detected (`AUTO_TAG`), it automatically injects `domain: AI-ML` into YAML frontmatter.
   - If `NOT_AI`, passes through with zero overhead.

2. **Step 2: Specification Generation**
   - Run `/make-ui-spec` if UI changes exist.
   - Run `/make-data-spec` if schema/API changes exist.

2.5. **Step 2.5: Post-Spec Unknowns Scan**
   - Run: `python3 .agent/scripts/run-unknowns-scanner.py --story-id {id} --phase spec --context {spec_file} --story-dir <story_dir>`
   - Append findings to `unknowns-ledger.yaml`.

**Handoff to Stage 2:**
Once Step 2.5 is completed, execute `echo '{"stage": 1, "status": "completed"}' > <story_dir>/spec-stage-evidence.json`. Then, prompt the user to invoke `/flow-stage-2-design` (or automatically trigger it if `--auto-approve` is on).
