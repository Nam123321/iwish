---
name: research-solution-sources
description: Supportive workflow for finding skills, modules, repos, or tool
  patterns that can solve a problem before create-skill, enhance-skill, or
  absorb-repo decisions
---

# /research-solution-sources

Canonical supportive workflow for researching solution sources before we decide to:

- create a new skill
- enhance an existing skill
- register a skill pack
- absorb an external repo

This is a **long-form step-file workflow**. Do not treat this file as the full execution body.
Load this shell, then load only the current step file plus the previous step's artifacts.

This workflow is not allowed to stop at internal lookup when the user's request explicitly asks for:

- GitHub research
- external repos
- frameworks / packages / open-source solutions
- comparison of outside solutions

In those cases, external candidate research is **mandatory**, not optional.

## When to Use

Use this workflow when the user says or implies:

- `find a repo that can solve this`
- `is there a skill for this already`
- `look for a module / framework / package / skill pack`
- `before creating a new skill, check what exists`
- `before enhancing this skill, research alternatives`
- `tìm repo`, `tìm skill`, `tìm giải pháp`, `tìm framework`, `tìm package`, `tìm module`

## Purpose

This workflow prevents premature creation or blind enhancement by forcing a source search first.
It also prevents a false positive where Orch finds a partial internal match and stops too early, even though the user explicitly asked for outside solution research.

## Stage Map

Execute in this order:

1. `step-rss-01-discover.md`
2. `step-rss-02-enrich.md`
3. `step-rss-03-trust-check.md`
4. `step-rss-04-deep-dive.md`
5. `step-rss-05-recommend.md`

## Required Artifacts

Minimum stage artifacts:

- `candidate-pool.md`
- `candidate-pool.json`
- `query-log.md`
- `candidate-enrichment-table.md`
- `candidate-enrichment.json`
- `trust-screening.md`
- `risk-flags.yaml`
- `finalist-deep-dive.md`
- `rejection-reasons.md`
- `solution-research-verdict.md`
- `shortlist-scorecard.md`

Use `research-solution-sources.state.yaml` to track stage progress and resume safely.

## Stage Tool Binding

- `discover`
  - `gh`
  - `OSSInsight`
  - `Libraries.io`
- `enrich`
  - `ecosyste.ms`
  - `gh`
- `trust-check`
  - `OpenSSF Scorecard`
  - `gh`
- `deep-dive`
  - `github-deep-research`
  - optional `firecrawl/cli`
- `recommend`
  - rubric synthesis
  - raw score comparison

## Hard Rules

1. Load one step at a time.
2. Save the current step artifact(s) before moving to the next step.
3. If the user explicitly asks for GitHub/external solution research, external candidate research is mandatory.
4. Do not issue a final recommendation on README-only evidence.
5. If shortlisted external GitHub repos exist, `github-deep-research` is mandatory before final recommendation.
6. If the candidate pool is weak, noisy, or ambiguous after `discover`, stop for review instead of pretending certainty.
7. If the final verdict is not explicit, the workflow is not complete.
8. If Orch is unsure whether external search is required, default to including external search rather than silently stopping at internal matches.

## Checkpoints

Human review checkpoints:

1. After `discover`
   - if the pool is weak, noisy, or ambiguous
2. After `recommend`
   - before handing off to:
     - `/enhance-skill`
     - `/create-skill`
     - `/register-skill-pack`
     - `/absorb-repo`

## Handoff Rules

- If the strongest answer is “we already have 70-80% of this internally”, hand off to `/enhance-skill`.
- If the strongest answer is “no internal match, but a strong external repo exists”, hand off to `/absorb-repo`.
- If the strongest answer is “a third-party skill pack is already shaped correctly”, hand off to `/register-skill-pack`.
- If the strongest answer is “nothing suitable exists”, hand off to `/create-skill`.
- If the strongest answer is `reference only`, stop with a reviewable recommendation and do not force a downstream build workflow.
- If the strongest answer is `compose multiple solutions`, return a composed recommendation that maps each candidate to the requirement it satisfies, then wait for review before handing off to one or more canonical workflows.

## Execute

Start with: `step-rss-01-discover.md`
