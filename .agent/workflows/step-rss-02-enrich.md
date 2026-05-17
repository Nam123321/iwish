---
name: 'step-rss-02-enrich'
description: 'Stage 2 for research-solution-sources: enrich candidate pool with metadata, 90-day signals, and shortlist draft.'
---

# Step RSS-02: Enrich

## Purpose

Transform the broad candidate pool into comparable candidate cards with enough metadata to form a shortlist draft.

## Required Inputs

- `candidate-pool.md`
- `candidate-pool.json`
- `query-log.md`

## Exact Process Checklist

1. Read the candidate pool and confirm which candidates should be enriched.
2. Gather metadata for each serious candidate:
   - repo/package/module identity
   - shape
   - latest release
   - issue / PR movement
   - contributor activity
   - package / dependency context when relevant
3. Capture `90-day diagnostics` where available.
4. Normalize candidates into a comparable card structure.
5. Produce a shortlist draft:
   - top `3` primary candidates
   - up to `2` alternates
6. Record obvious strengths, weaknesses, and unknowns.
7. Save artifacts before continuing.

## Output Artifacts

- `candidate-enrichment-table.md`
- `candidate-enrichment.json`
- shortlist draft embedded in the enrichment output

## Validation / Gate

Do not continue to `step-rss-03-trust-check.md` unless:

- a shortlist draft exists
- each shortlisted candidate has enrichment notes
- 90-day diagnostics were attempted and recorded

## Edge Cases

- Candidate has strong fit but weak release cadence.
- Candidate is package-first rather than repo-first.
- Candidate data is sparse; keep it, but mark uncertainty explicitly.

## Degraded Mode

If one enrichment source is unavailable, continue with the remaining sources and mark the missing dimension as unknown rather than inventing confidence.

## Next-Step Rule

If the gate passes, load `step-rss-03-trust-check.md`.
