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
   - Audit the existing capability's gates: classify each as Category A (Deterministic — script exit codes, compiler checks, file existence) or Category B (Trust-Based — agent self-reported judgments, comparisons, scores).
   - Calculate the Enforcement Maturity Ratio: `Category A gates / Total gates × 100%`.
   - If Category B ratio > 80% (Enforcement Maturity < 20%), you MUST propose converting at least 2 gates to Category A (e.g., by adding script-verified checks, grep patterns, or automated validators).
   - For all remaining Category B gates, ensure evidence trail requirements are defined (what artifact proves the gate was executed — e.g., `view_file` tool call, raw output, file:line references).
   - Include the Enforcement Maturity score in the upgrade proposal.
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
