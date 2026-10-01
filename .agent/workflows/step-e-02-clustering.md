---
description: 'step-e-02-clustering.md step'
---

# Step E-02: Clustering (Pattern Recognition)

## Goal
Transform raw evidence into actionable "Pattern Failures" and map them to specific I-Wish capabilities.

## Execution Instructions
1. **Thematic Clustering**:
   - Review the lessons and hotspots from Step E-01.
   - Group them into failure modes:
     - **Mechanical**: Syntax errors, broken imports, missing types (Upgrade logic in `ast-health.js` or `qa-agent`).
     - **Contextual**: Agent missed an edge case in a specific domain (Upgrade `Edge Case Guardian` or `Kira Data architect-agent`).
     - **Architectural**: Repeated loops in file editing or dependency violations (Upgrade `Pivot Guardian`).
     - **Workflow**: A workflow step is too ambiguous or causes deadlocks (Upgrade the specific `.md` workflow).
2. **Capability Mapping**:
   - Identify which existing `SKILL.md` or `.md` workflow is the "Primary Caretaker" for each failure mode.
3. **Gap Analysis**:
   - For each cluster, answer: "What rule or check was missing that allowed this bug/failure to happen?"

## Expected Output
A mapping of clusters to target capabilities:
- **Cluster**: [Description]
- **Target**: [Path to Skill/Workflow]
- **Proposed Enhancement Type**: [Addition/Modification/Constraint]


## State Machine Checkpoint & Anti-Skip Lock

> [!IMPORTANT]
> **STATE MACHINE UPDATE (MANDATORY):**
> Before exiting this step, you MUST update `state.json` atomically.
> 1. Write updated state (using strict JSON serialization tools) to `state.tmp.json` containing the new phase. The `"phase"` key MUST be validated against the strict Enum of expected phases.
> 2. Execute `mv state.tmp.json state.json`.
> 3. You MUST check for OS-level filesystem errors (e.g., disk full, permission denied) during the `mv` command and gracefully HALT if it fails.

> [!WARNING]
> **ANTI-SKIP LOCK (MANDATORY):**
> You MUST run the following command to validate integrity before proceeding:
> `python3 .agent/scripts/pipeline-integrity-runner.py --target "<capability_name>" --phase "<current_phase>"`
> - **Circuit Breaker:** If this script fails (non-zero exit), you MUST immediately HALT, report the error to the user, and do not retry more than 3 times. Do not silently ignore it.
