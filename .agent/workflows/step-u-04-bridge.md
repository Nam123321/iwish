# Step U-04: Bridge

## Goal
Link macro assumptions from `macro-risks.yaml` to the micro findings collected in Step 3. This ensures that tactical discoveries inform strategic confidence.

## Instructions
1. Load `_iwish-output/unknowns/macro-risks.yaml`.
2. Review the findings collected from `step-u-03-micro-scan.md`.
3. For each micro finding (e.g., edge cases, drifts), ask: "Does this finding invalidate or weaken any assumption tracked in `macro-risks.yaml`?"
4. If a macro assumption is impacted, annotate the micro finding with a `macro_impact` tag pointing to the specific risk ID in `macro-risks.yaml`.
5. Prepare this bridged data for the next synthesis step.

## Exit Criteria
- Micro findings are cross-referenced with macro risks.
- Data is ready for `step-u-05-synthesize.md`.

Next, proceed to `step-u-05-synthesize.md`.
