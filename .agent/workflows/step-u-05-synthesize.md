# Step U-05: Synthesize

## Goal
Aggregate findings, update knowledge buses (`unknowns-ledger.yaml` and `macro-risks.yaml`), and apply the QA Simulator Scorecard logic if generating final verdicts.

## Instructions
1. Gather all findings from Step 2 (Macro) and Step 3/4 (Micro/Bridge).
2. Format the findings to append to `_iwish-output/unknowns/unknowns-ledger.yaml`. 
3. If any finding impacts a macro risk, update `overall_confidence` and the specific risk entry in `_iwish-output/unknowns/macro-risks.yaml`.
4. **QA Simulator Guardian Absorption:** If the workflow phase is `story` or `review` and requires a completeness verdict, execute the 7-row Hybrid Scorecard evaluation:
   - Mentally simulate edge cases, state integrity, and UX empathy based on the findings.
   - Calculate a scorecard out of 10. (If score < 8.5, flag as incomplete).
5. Output the synthesized report to `_iwish-output/unknowns/reports/`.
6. Use `Artifact Smith` if an interactive HTML visualization is requested, placing the HTML file co-located with the requesting context.

## Exit Criteria
- Knowledge buses are updated.
- QA Simulator Scorecard logic applied (if applicable).
- Synthesized report generated.

Next, proceed to `step-u-06-cascade-check.md`.
