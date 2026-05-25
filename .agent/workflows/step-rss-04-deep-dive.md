---
name: 'step-rss-04-deep-dive'
description: 'Stage 4 for research-solution-sources: deep inspection of shortlisted external candidates.'
---

# Step RSS-04: Deep-Dive

## Purpose

Turn shortlisted candidates into evidence-backed finalists and eliminate README-only judgments.

## Required Inputs

- `candidate-enrichment-table.md`
- `trust-screening.md`
- `risk-flags.yaml`

## Exact Process Checklist

1. Confirm the finalists to inspect.
2. For shortlisted external GitHub candidates, run `github-deep-research`.
3. Inspect beyond README:
   - architecture
   - extension points
   - coupling
   - implementation seams
   - workflow/prompt structure when relevant
4. If GitHub/API evidence is not enough, use optional web evidence harvesting.
5. Capture:
   - adaptation cost
   - architectural fit
   - likely integration shape
   - reasons to reject
   - composition opportunities across candidates
6. Save artifacts before continuing.

## Output Artifacts

- `finalist-deep-dive.md`
- `rejection-reasons.md`

## Validation / Gate

Do not continue to `step-rss-05-recommend.md` unless:

- shortlisted external GitHub candidates have passed through `github-deep-research`
- rejection reasons are explicit for rejected finalists

## Edge Cases

- README quality overstates repo quality.
- Repo solves only one part of the problem and must be composed with another candidate.
- Repo is strong but too coupled to a different platform/runtime.

## Degraded Mode

If deep inspection cannot fully complete, downgrade confidence and mark the recommendation as partial rather than claiming a definitive winner.

## Next-Step Rule

If the gate passes, load `step-rss-05-recommend.md`.
