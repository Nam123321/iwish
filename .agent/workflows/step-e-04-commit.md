---
description: 'step-e-04-commit.md step'
---

# Step E-04: Commit (Applying & Logging)

## Goal
Apply the approved enhancements and update the system's evolution lineage.

## Execution Instructions
1. **Apply Changes**:
   - **Physical Checkpoint (Zero-Trust Gate):** Do not manually save or copy the drafted patches for SKILL files. You MUST use the atomic commit script.
   - Run: `python3 .agent/scripts/commit-skill.py <draft_path> <canonical_path>` (e.g. `.agent/skills/<name>/SKILL.md`)
   - If the script fails (exit 1), you are FORBIDDEN from committing and must abort.

> [!WARNING]
> **Anti-Bypass Rule (Runtime Cryptographic Enclave):** You are explicitly forbidden from using `cp` or `write_file` to save changes directly to `.agent/skills/`. Doing so will bypass the `.sig` validation and cause the runtime to block the skill. You MUST use `commit-skill.py`.
2. **Update Lineage**:
   - Append an event to `.agent/fragments/capability-provenance-lineage.md` or a local `lineage.jsonl` if it exists.
   - **Event Format**:
     - `timestamp`: [ISO]
     - `type`: "capability_upgrade"
     - `target`: [Path]
     - `reason`: [Summary of clustered evidence]
     - `source`: "Auto-Immune System (HSEA-1.4)"
3. **Registry & Knowledge Graph Sync**:
   - If the capability's domain, tags, or keywords have evolved, you MUST update `.agent/config/domain-skill-registry.yaml` to reflect the new mapping.
   - **Graph Re-calibration (Zero-Trust):** You MUST write the updated skill's metadata (id, title, description, tags, depends_on, graph_visibility) to a temporary JSON file and run `python3 .agent/scripts/inject-skill-node.py --metadata-file <path_to_json>` to update its semantic node in the Knowledge Graph safely without risking bash escaping errors.
     - **[EC-P5-001] Workflow Desynchronization:** You MUST check the exit code of `inject-skill-node.py`. If the script fails (e.g., due to syntax error or permissions), you MUST emit a strong warning to the user prompting them to manually run `python3 .agent/scripts/batch-ingest-skills.py` to heal the system.
4. **Verify Deployment**:
   - Confirm that the new rules are visible to future agent turns.
5. **Notify User**:
   - Summarize which skills/workflows were hardened and what specific failure modes they now protect against.

## Expected Output
Final confirmation of changes and an updated lineage log.


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
