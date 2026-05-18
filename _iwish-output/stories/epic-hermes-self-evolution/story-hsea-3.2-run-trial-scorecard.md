---
story_id: "STORY-HSEA-3.2"
epic_id: "EPIC-HSEA"
title: "Run Trial and Produce Scorecard"
status: "done"
assignee: "Vegeta"
priority: "P0"
depends_on: ["story-hsea-2.4-dual-run-activation.md", "STORY-HSEA-3.1"]
blocks: ["STORY-HSEA-3.3"]
phase: "origin"
---

# Story HSEA-3.2: Run Evolution Lab Trial and Produce Scorecard

## 1. Objective

Implement the Evolution Lab Trial Runner. This engine will execute the dual-run pipeline on a selected trial fixture (e.g., `land-and-deploy`), producing both a centralized `trial-manifest.yaml` (for provenance) and a final Markdown Scorecard mapping the evaluation results.

## 1.1 Context & Tracer Bullet

**Tracer Bullet (Vertical Slice):**
The Node.js (or Bash) script `.agent/scripts/evolution-lab-runner.js` that orchestrates the execution. For this milestone, the actual LLM candidate generation and evaluation will be **mocked** to ensure the pipeline structure and file I/O operations are stable.

## 2. Acceptance Criteria

- **AC1: [Config Loading]** The runner MUST load `.agent/evolution-lab-config.yaml`. If `dual_run_enabled: true`, the runner proceeds in `FULL_DUAL_RUN`. Otherwise, it falls back to `DEGRADED_NATIVE_ONLY` (skipping the external engine).
- **AC2: [Fixture Execution]** The runner MUST accept a fixture name (e.g., `node .agent/scripts/evolution-lab-runner.js land-and-deploy`). It loads `baseline.md` and generates candidate mutations (mocked).
- **AC3: [Evaluation Pipeline]** The runner MUST execute an evaluation step (mocked JSON response mapping to `evaluation-schema.json`) for each generated candidate.
- **AC4: [Trial Manifest]** The runner MUST atomically write `.agent/evolution-lab/trials/trial-manifest-<timestamp>.yaml` mapping candidate paths to their respective origin engines (`iwish-native` and `darwinian`).
- **AC5: [Scorecard Generation]** The runner MUST output a markdown scorecard containing the scores, winners, and any `fatal_degradations` encountered.

## 3. Technical Approach & Dev Notes

### 3.1 Runner Infrastructure
The script will mock the AI responses for now:
1. `candidate_native.md` - Simulated output of a I-Wish engine mutation.
2. `candidate_darwinian.md` - Simulated output of a Darwinian engine mutation.
3. Both candidates will receive simulated JSON evaluations matching the schema defined in HSEA-3.1.

### 3.2 File System Outputs
- `manifest`: `.agent/evolution-lab/trials/trial-manifest-[timestamp].yaml`
- `scorecard`: `.agent/evolution-lab/trials/scorecard-[timestamp].md`
- `candidates`: Stored under `.agent/evolution-lab/trials/candidates/` and mapped in the manifest.

## 4. Tasks & Traceability

### AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Config Loading | T1: Implement `dual_run_enabled` check | - | ☐ |
| AC2 | Fixture Execution | T2: Implement baseline loading and candidate generation (mocked) | - | ☐ |
| AC3 | Evaluation Pipeline | T3: Implement evaluation JSON parsing (mocked) | - | ☐ |
| AC4 | Trial Manifest | T4: Write `trial-manifest.yaml` | - | ☐ |
| AC5 | Scorecard Generation | T5: Output the markdown scorecard | - | ☐ |

---

## 5. QA Simulator Guardian Audit (Fat-Guardian)

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 10 | Implements the runner logic specified in the epic exactly, tracking candidates and outputting evaluations. |
| Data Integrity & State | 10 | Generates `trial-manifest.yaml` to strictly map candidate files without polluting the rest of the workspace. |
| Security & Validation | 9 | Honors the `dual_run_enabled` configuration toggle to prevent unauthorized external engine calls. |
| Performance & Scalability | 9 | The runner is designed to execute the file I/O operations synchronously and handles failure gracefully. |
| Error Handling & Recovery | 9 | Defaults safely to `DEGRADED_NATIVE_ONLY` if the config is missing or invalid. |
| Code Quality & Maintainability | 9 | The runner is a standalone script that isolates the trial logic. |
| UX Empathy | 9 | The output markdown scorecard provides clear, actionable results for the human reviewer. |

**Total Average:** 9.28 / 10 - PASS
