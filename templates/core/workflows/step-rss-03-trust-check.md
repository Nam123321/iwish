---
name: 'step-rss-03-trust-check'
description: 'Stage 3 for research-solution-sources: trust, license, and risk screening for the shortlist.'
---

# Step RSS-03: Trust-Check

## Purpose

Screen the shortlist for trust, license, and risk concerns before deep-diving finalists.

## Required Inputs

- `candidate-enrichment-table.md`
- `candidate-enrichment.json`

## Exact Process Checklist

1. Review the shortlist draft.
2. For each shortlisted candidate, evaluate:
   - license fit
   - trust concerns
   - obvious security/supply-chain risk
   - maintenance risk
   - abandonment / brittleness signals
3. Record a disposition:
   - clean
   - caution
   - high-risk
   - reference-only
4. Downgrade candidates when justified, but do not silently delete them.
5. Save a trust-adjusted shortlist and explicit risk flags.

## Output Artifacts

- `trust-screening.md`
- `risk-flags.yaml`

## Validation / Gate

Do not continue to `step-rss-04-deep-dive.md` unless:

- a trust-adjusted shortlist exists
- any downgraded candidate has a written reason

## Edge Cases

- Strong technical repo but poor license fit.
- Strong adoption but meaningful trust caveat.
- Legal/trust concerns are not blocking yet, but must be flagged for deeper absorb review.

## Degraded Mode

If a trust signal source is unavailable, mark the trust area as partial and carry that uncertainty forward to deep-dive and recommend.

## Next-Step Rule

If the gate passes, load `step-rss-04-deep-dive.md`.
