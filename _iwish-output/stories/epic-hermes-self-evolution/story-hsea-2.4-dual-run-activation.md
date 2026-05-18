---
story_id: "STORY-HSEA-2.4"
epic_id: "EPIC-HSEA"
title: "Define Dual-Run Scope Activation and Darwin Adapter Gate"
status: "done"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-2.3"]
blocks: ["STORY-HSEA-3.1"]
phase: "origin"
---

# Story HSEA-2.4: Define Dual-Run Scope Activation and Darwin Adapter Gate

## 1. Objective

Define the project-scoped activation mechanisms for the I-Wish Evolution Lab. Establish the exact configuration schemas required to opt a project into "dual-run" capabilities, the strict rules for degraded modes (fallback to native only), and the specification for tracking candidate provenance via a centralized trial manifest.

## 1.1 Context & Tracer Bullet

**Tracer Bullet (Vertical Slice):**
The output must be a unified policy document (`.agent/fragments/evolution-lab-activation-policy.md`) that codifies:
1. The project configuration file schema (`.agent/evolution-lab-config.yaml`).
2. The trial-manifest schema for tracking source-selection records.
3. State definitions for the Darwin Adapter gate (e.g., `FULL_DUAL_RUN`, `DEGRADED_NATIVE_ONLY`).

This document provides the exact blueprints that the trial runner (HSEA-3.x) will execute.

**Source artifacts:**
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `.agent/fragments/darwinian-boundary-contract.md` (for UX rules)

## 2. Acceptance Criteria

- **AC1: [Activation Config Schema]** The policy MUST define `.agent/evolution-lab-config.yaml` as the sole activation method, requiring a boolean flag (e.g., `dual_run_enabled: true`) to explicitly opt a project into external engine execution.
- **AC2: [Trial Manifest Schema]** The policy MUST define a `trial-manifest.yaml` (or JSON) schema to be generated per trial. It must map individual generated candidate paths to their specific origin engine (`iwish-native` vs `darwinian`), keeping candidate files clean of trial metadata.
- **AC3: [Adapter Gate States]** The policy MUST define execution states mapping back to the UX rules from HSEA-2.3. It must explicitly declare `STATE: FULL_DUAL_RUN` and `STATE: DEGRADED_NATIVE_ONLY`, dictating how runners proceed based on user opt-in vs. execution success.
- **AC4: [Contract Location]** The activation policy must be saved as `.agent/fragments/evolution-lab-activation-policy.md`.

## 3. Technical Approach & Dev Notes

### 3.1 Project-Scoped Activation
We avoid global or CLI-only flags to prevent accidental leakage of proprietary context to external engines. The presence of `dual_run_enabled: true` in the project configuration is a hard requirement for the trial runner to even attempt a subprocess call.

### 3.2 Source-Selection Records
Instead of polluting candidate markdown or code files with frontmatter, the trial runner will generate a `trial-manifest.yaml`. 
Example schema:
```yaml
trial_id: "TRIAL-123"
timestamp: "2026-05-12T12:00:00Z"
candidates:
  - path: "candidates/iwish/skill-v2.md"
    source_engine: "iwish-native"
    engine_version: "internal"
  - path: "candidates/darwinian/skill-v2.md"
    source_engine: "darwinian"
    engine_version: "latest"
```
*Note: To prevent stale manifests, the manifest MUST be written atomically only after all engine executions complete and write their candidate files to disk.*
This enables the final Scorecard generator to read exactly one file to understand provenance.

### 3.3 Degraded Mode Enforcement
The runner must implement a state machine:
- Start -> Read Config -> If `dual_run_enabled: false` -> `STATE: DEGRADED_NATIVE_ONLY`.
- If `dual_run_enabled: true` -> Check Dependency -> If Missing -> Prompt User.
- If User Opts Out -> `STATE: DEGRADED_NATIVE_ONLY`.
- If User Installs & Runs -> `STATE: FULL_DUAL_RUN`.
- If the native engine also encounters an unrecoverable error during DEGRADED mode -> `STATE: FATAL_FAILURE`.

## 4. Tasks & Traceability

### AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Activation Config Schema | T1: Define `.agent/evolution-lab-config.yaml` schema in policy | - | ☑ |
| AC2 | Trial Manifest Schema | T2: Define `trial-manifest.yaml` schema in policy | - | ☑ |
| AC3 | Adapter Gate States | T3: Map execution states to HSEA-2.3 UX rules | - | ☑ |
| AC4 | Contract Location | T4: Create `.agent/fragments/evolution-lab-activation-policy.md` | - | ☑ |

---

## 5. QA Simulator Guardian Audit (Fat-Guardian)

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 10 | Directly satisfies FR9 from the epic by strictly defining activation, gating, degraded modes, and source records. |
| Data Integrity & State | 10 | Using a separate `trial-manifest.yaml` preserves the integrity of the generated candidates for clean promotion. |
| Security & Validation | 9 | Project-scoped explicit opt-in config prevents accidental data leakage. |
| Performance & Scalability | 9 | Small YAML parsing is extremely fast and scales well across large candidate pools. |
| Error Handling & Recovery | 10 | The state definitions explicitly handle degraded modes based on config and execution environment. |
| Code Quality & Maintainability | 10 | Traceable mapping to ACs and strong policy boundary isolation. |
| UX Empathy | 9 | Keeps the developer workflow predictable and prevents candidate file pollution. |

**Total Average:** 9.57 / 10 - PASS
