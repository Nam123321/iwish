# Step E-03: Upgrade (Drafting Enhancements)

## Goal
Draft the actual technical changes to the BMAD capabilities based on the identified gaps.

## Execution Instructions
1. **Load Governance Fragments**:
   - Read `.agent/fragments/capability-authoring-curator-rules.md`.
   - Read `.agent/fragments/draft-skill-creation-governance.md`.
2. **Draft Patches**:
   - For each target identified in Step E-02, create a diff-based proposal.
   - **Skills**: Add new "Watchouts", "Pillars", or "Mandatory Steps".
   - **Workflows**: Clarify step descriptions or add sub-steps.
3. **CSO Validation Gate (CRITICAL)**:
   - Audit the `description` field in the capability's YAML frontmatter.
   - **Rule**: Must NOT contain workflow summaries (e.g., "generates", "creates"). Must ONLY contain triggering conditions (symptoms, keywords).
   - Rewrite any violating descriptions.
4. **Adversarial Self-Review**:
   - Imagine being an agent following the *new* rule. Does it solve the original bug without creating too much overhead?

## Expected Output
A set of proposed changes (diffs) for the target files, ready for review.
- **Target**: [Path]
- **Diff**:
  ```diff
  ...
  ```
