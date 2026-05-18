# Step E-02: Clustering (Pattern Recognition)

## Goal
Transform raw evidence into actionable "Pattern Failures" and map them to specific I-Wish capabilities.

## Execution Instructions
1. **Thematic Clustering**:
   - Review the lessons and hotspots from Step E-01.
   - Group them into failure modes:
     - **Mechanical**: Syntax errors, broken imports, missing types (Upgrade logic in `ast-health.js` or `Tien-Shinhan`).
     - **Contextual**: Agent missed an edge case in a specific domain (Upgrade `Edge Case Guardian` or `Kira Data Piccolo`).
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
