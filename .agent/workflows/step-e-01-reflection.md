---
description: 'step-e-01-reflection.md step'
---

# Step E-01: Reflection (Evidence Gathering)

## Goal
Gather data from the project's "Auto-Immune" signals to identify where capabilities (skills/workflows) are failing or need hardening.

## Mandatory Data Sources
1. **Bug Tracker**: `_iwish-output/bug-tracker.yaml` (Look for `rca`, `fiveWhys`, and `lessonLearned`).
2. **Execution Logs**: `.agent/memory/turn-exits.jsonl` (Look for workflows that exited with "failure" or "timeout").
3. **Hotspot Graph**: Query FalkorDB for files with `bug_count > 3`.

## Execution Instructions
1. **Scan Bug History**: 
   - Extract the last 5 fixed bugs from `bug-tracker.yaml`.
   - Identify the `filesChanged` and the `lessonLearned` for each.
2. **Query Hotspots**:
   - Run a command to list the top 5 files by `bug_count` from the `codegraph` database.
   - Example query: `GRAPH.QUERY codegraph "MATCH (f:File) WHERE f.bug_count > 0 RETURN f.path, f.bug_count ORDER BY f.bug_count DESC LIMIT 5"`
3. **Analyze Exit Trends**:
   - Read `turn-exits.jsonl`.
   - Identify if a specific workflow (e.g., `/fix-bug`, `/create-prd`) is frequently failing at a specific step.
4. **Summarize Evidence**:
   - Create a brief list of "Candidate Patterns for Evolution" based on the above.

## Expected Output
A summary of evidence categorized by:
- Recurring File Hotspots
- Failed Interaction Patterns
- Extracted Lessons from fixed bugs


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
