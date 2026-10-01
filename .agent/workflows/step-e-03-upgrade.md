---
description: 'step-e-03-upgrade.md step'
---

# Step E-03: Upgrade (Drafting Enhancements)

## Goal
Draft the actual technical changes to the I-Wish capabilities based on the identified gaps.

## Execution Instructions
1. **Load Governance Fragments**:
   - Read `.agent/fragments/capability-authoring-curator-rules.md`.
   - Read `.agent/fragments/draft-skill-creation-governance.md`.
2. **Draft Patches**:
   - For each target identified in Step E-02, create a diff-based proposal.
   - **Skills**: Add new "Watchouts", "Pillars", or "Mandatory Steps". If rewriting or expanding a skill, strictly enforce the 3-Layer Progressive Disclosure rule. You MUST cap the `SKILL.md` at 500 lines and extract any bloated rules or context into a `references/` subdirectory.
   - **Workflows**: Clarify step descriptions or add sub-steps.
3. **CSO Validation Gate (CRITICAL)**:
   - Audit the `description` field in the capability's YAML frontmatter.
   - **Rule**: Must NOT contain workflow summaries (e.g., "generates", "creates"). Must ONLY contain triggering conditions (symptoms, keywords).
   - Rewrite any violating descriptions.
3.5. **Anti-Fabrication Audit (MANDATORY)**:
   - Read `.agent/fragments/anti-fabrication-watchmen-pattern.md`.
   - Run `python3 .agent/scripts/mcp-signing-daemon.py <path_to_capability_file> --assess-injection` to automatically calculate the Watchmen Injection Score (WIS).
   - Review the output JSON. It contains the WIS score.
   - For existing Category B gates, ensure evidence trail requirements are defined (what artifact proves the gate was executed — e.g., `view_file` tool call, raw output, file:line references).
   - Include the WIS in the upgrade proposal.
   - If WIS >= 6, you MUST ensure Watchmen Integration Gates (Out-of-Band signing) are injected into the capability logic.
   - If the capability lacks a `## Gate Classification` section, add one following the template in the fragment.
4. **Adversarial Self-Review**:
   - Imagine being an agent following the *new* rule. Does it solve the original bug without creating too much overhead?

## Expected Output
A set of proposed changes (diffs) for the target files, ready for review.
- **Target**: [Path]
- **Diff**:
  ```diff
  ...
  ```


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
