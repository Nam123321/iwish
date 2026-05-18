# Evolution Lab Activation Policy

## 1. Objective
This document defines the project-scoped activation mechanisms for the I-Wish Evolution Lab. It establishes the configuration schemas required to opt a project into "dual-run" capabilities, the strict rules for degraded modes (fallback to native only), and the specification for tracking candidate provenance via a centralized trial manifest.

## 2. Project-Scoped Activation Configuration

### 2.1 Activation Mechanism
To prevent accidental leakage of proprietary context to external engines, global or CLI-only flags are explicitly avoided.
A project MUST explicitly opt-in via a local configuration file.

### 2.2 `.agent/evolution-lab-config.yaml` Schema
The Evolution Lab trial runner MUST verify the presence of this configuration file and the explicit `dual_run_enabled: true` flag before attempting any subprocess call to the Darwinian engine.

```yaml
# .agent/evolution-lab-config.yaml
evolution_lab:
  # MUST be true to enable external engine execution. If false or missing, defaults to Native Only.
  dual_run_enabled: true
  
  # Optional: Define specific paths to exclude from Darwinian context
  exclude_paths:
    - "secrets/*"
    - "proprietary_algorithms/*"
```

## 3. Trial Manifest Schema

To preserve the integrity of generated candidates and avoid polluting markdown/code files with trial metadata, the trial runner MUST generate a centralized manifest file per trial.
This manifest is written atomically only after all engines complete their executions.

### 3.1 `trial-manifest.yaml` Schema
```yaml
trial_id: "TRIAL-<ID>"
timestamp: "YYYY-MM-DDTHH:MM:SSZ"
candidates:
  - path: "candidates/iwish/skill-v2.md"
    source_engine: "iwish-native"
    engine_version: "internal"
  - path: "candidates/darwinian/skill-v2.md"
    source_engine: "darwinian"
    engine_version: "latest"
```

## 4. Adapter Gate States

The trial runner must implement a state machine that respects the UX rules defined in the Darwinian Boundary Contract. The execution states dictate how runners proceed based on user opt-in vs. execution success.

### 4.1 State Definitions

*   **`STATE: FULL_DUAL_RUN`**
    *   **Condition:** Config `dual_run_enabled: true` AND Darwinian dependency is present (or successfully installed by user prompt) AND subprocess execution yields a `0` exit code.
    *   **Behavior:** Trial runner executes both Native and Darwinian engines, aggregating candidates into the trial manifest for dual scorecard generation.

*   **`STATE: DEGRADED_NATIVE_ONLY`**
    *   **Condition:** Config `dual_run_enabled: false` OR missing, OR Darwinian dependency is missing and the user Opts-Out (Clean Bypass), OR Darwinian subprocess fails (non-zero exit code).
    *   **Behavior:** Trial proceeds strictly with internal I-Wish skills. If triggered by an Opt-Out, the final scorecard MUST NOT display a "Darwinian failed" warning. If triggered by a runtime error, a prominent warning MUST be displayed on the scorecard.

*   **`STATE: FATAL_FAILURE`**
    *   **Condition:** The native I-Wish engine encounters an unrecoverable error (regardless of Darwinian engine success or failure).
    *   **Behavior:** The trial halts entirely. No candidates are promoted, and an escalation report must be generated.
