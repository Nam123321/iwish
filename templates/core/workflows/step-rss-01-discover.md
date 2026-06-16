---
name: 'step-rss-01-discover'
description: 'Stage 1 for research-solution-sources: discover candidate solution sources across internal, adjacent, and external surfaces.'
---

# Step RSS-01: Discover

## Purpose

Build the initial candidate pool for the user's problem without prematurely committing to one solution path.

## Required Inputs

- user problem brief
- desired outcome
- constraints, if known
- preferred solution shape, if known:
  - repo
  - skill
  - workflow
  - agent
  - module
- internal capability inventory

## Optional Inputs

- user-provided repo or framework names
- source-of-truth context from current story/epic/project
- prior search artifacts if resuming

## Exact Process Checklist

1. Normalize the problem-to-solve into a short research brief.
2. Classify the desired solution shape.
3. Decide whether external GitHub/external search is mandatory.
4. If you are unsure, default to including external search rather than silently stopping at internal-only matches.
5. Build multiple query families:
   - problem wording
   - job-to-be-done wording
   - technical wording
   - domain wording
   - tool/platform wording
   - synonyms / bilingual wording when useful
6. Search internal I-Wish surface first.
7. Search adjacent local/project surface second.
8. If external research is mandatory, or if you are still uncertain after internal/adjacent search, search external GitHub/package/framework sources third.
9. Build a broad pool:
   - internal matches
   - external candidates up to `8-12`
10. Note whether the pool is:
   - strong
   - weak
   - noisy
   - ambiguous
11. Save artifacts before continuing.

## Output Artifacts

- `candidate-pool.md`
- `candidate-pool.json`
- `query-log.md`

## Validation / Gate

Do not continue to `step-rss-02-enrich.md` unless:

- a candidate pool exists
- the pool includes external candidates when external search is mandatory
- the query log is saved

## Review Checkpoint

If the pool is weak, noisy, or ambiguous, stop for human review before moving on.

## Edge Cases

- Internal I-Wish already covers most of the problem.
- User phrasing is vague and needs reframing into `2-3` search angles.
- User provided a repo directly, so alternatives should still be considered.

## Degraded Mode

If one external discovery source is unavailable, continue with the remaining sources and record the missing signal in `query-log.md`.

## Next-Step Rule

If the gate passes, load `step-rss-02-enrich.md`.
