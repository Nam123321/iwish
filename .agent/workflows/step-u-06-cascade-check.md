# Step U-06: Cascade Check

## Goal
Evaluate the updated macro confidence and trigger appropriate escalation or halt actions based on predefined thresholds.

## Instructions
1. Read the updated `overall_confidence` from `_iwish-output/unknowns/macro-risks.yaml`.
2. Run `python3 .agent/scripts/validate-cascade-actions.py _iwish-output/unknowns/macro-risks.yaml` to ensure deterministic cascade evaluation.
3. Apply logic:
   - **Confidence >= 0.5**: Proceed normally. Output a success status.
   - **0.3 <= Confidence < 0.5**: ESCALATE. Present a warning to the user outlining the eroded assumptions and suggesting `/correct-course`. Wait for user override or confirmation.
   - **Confidence < 0.3**: HALT. Immediately block downstream execution (e.g., dependent stories). Demand a `/pivot-project` or `/correct-course` workflow.

## Exit Criteria
- Cascade thresholds evaluated.
- Appropriate warnings/halts presented to the user.
- Pipeline execution concludes successfully or halts safely.
