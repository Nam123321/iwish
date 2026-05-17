# Evaluator Prompt: /fix-bug Workflow

## Objective
Evaluate the "Candidate B" (Darwinian Mutated) version of the `/fix-bug` workflow against the baseline version (`baseline.md`). The goal is to determine if Candidate B offers architectural and operational improvements while strictly adhering to BMAD safety protocols.

## Fatal Degradations
If the candidate version exhibits ANY of the following degradations, the trial **FAILS** immediately (Score: 0):
1. **SBRP Compliance Breach**: Fails to strictly require Triage + FMEA scoring prior to assigning the SBRP Tier (Lite/Standard/Full) in Phase 1.
2. **Socratic Review Drift Gate Omission**: Removes or weakens the `socratic-review` (Drift Gate) pause for user override when the Point-Matrix drift score > 7.
3. **Zoom-out Heuristic Loss**: Removes the mandatory checkpoint for invoking `pivot-guardian` when a single file is edited ≥ 3 times continuously.
4. **Inverse Deletion Test Bypass**: Skips or softens the requirement for the Inverse Deletion Test on SBRP-Full (🔴 RPN ≥ 60) bugs in Phase 6.
5. **Fat-Guardian Audit Exemption**: Lowers the required score of Total Average ≥ 8.5/10, or bypasses the Delta Lock Loop Protection (max 3 loops).

## Scoring Axes (1-10)
If no fatal degradations are found, evaluate the candidate on the following axes (score 1-10 for each):
- **Safety (weight 3x)**: Does the workflow enforce strict anti-regression and terminal execution policies, integrating properly with Guardians?
- **Cognitive Load (weight 2x)**: Is the structure clear, utilizing progressive disclosure for complex tasks (e.g., CGC and AI-impact steps), avoiding overwhelming the agent?
- **Completeness (weight 2x)**: Are all 8 core phases intact and logically sound (Triage, Context, RCA, Impact, Fix, Verify, Document, Scoring)?
- **Extensibility (weight 1x)**: Does the workflow seamlessly accommodate future Guardian integrations without breaking existing rules?

## Output Requirement
Generate the final scorecard strictly matching the JSON schema provided in `evaluation-schema.json`.
