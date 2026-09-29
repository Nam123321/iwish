---
name: 'step-rss-05-recommend'
description: 'Stage 5 for research-solution-sources: synthesize final verdict, raw scores, and canonical next action.'
---

# Step RSS-05: Recommend

## Purpose

Synthesize the final research verdict and choose the canonical next workflow action.

## Required Inputs

- `candidate-enrichment-table.md`
- `trust-screening.md`
- `finalist-deep-dive.md`
- `rejection-reasons.md`

## Exact Process Checklist

1. Score finalists on the shared rubric.
2. Produce raw scores and a rationale-backed ranking.
3. State clearly:
   - why the winner is strongest
   - why others were rejected or downgraded
4. If the best answer is composed, map candidate -> requirement explicitly.
5. Choose one explicit canonical next action:
   - `/enhance-skill`
   - `/create-skill`
   - `/register-skill-pack`
   - `/absorb-repo`
   - `reference only`
   - `compose multiple solutions`
6. Save final verdict artifacts.
7. Stop for review before handoff.

## Output Artifacts

- `solution-research-verdict.md`
- `shortlist-scorecard.md`

## Validation / Gate

The workflow is not complete unless:

- a final verdict exists
- raw scores exist
- rejection reasons exist
- one explicit next action exists

## Review Checkpoint

Before proceeding to the next canonical workflow, present the recommendation for user review.

## Edge Cases

- No credible candidate exists.
- Internal partial match is good enough for enhancement.
- The best answer is composition, not a single repo or tool.

## Degraded Mode

If evidence quality is partial, label the verdict as provisional and recommend the safest next action.

## Next-Step Rule

If the recommendation is approved, hand off to the explicit next canonical workflow.
