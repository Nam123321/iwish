---
story_id: "story-1.16"
title: "Solution Source Research Before Create or Enhance"
status: "in-progress"
assignee: "capability-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "story-1.15-idea-challenge-orch-chain-and-navigator-lineage.md"
  - "story-1.17-context-first-semantic-routing-for-orch.md"
  - "docs/party-mode-github-solution-search-council-review.md"
  - "docs/meta-research-github-research-stack.md"
  - "docs/meta-research-github-solution-intelligence-stack.md"
---

# Story 1.16: Solution Source Research Before Create or Enhance

## 1. Objective

Create a canonical research-first workflow that helps Orch and `capability-agent` decide whether a problem should be solved by:

- enhancing an existing skill
- creating a new skill
- registering an external skill/module pack
- absorbing an external repo

This workflow must prevent blind capability creation and make the decision process explicit, evidence-backed, and reviewable.
It must also enforce external solution research when the user explicitly asks for GitHub/external options, rather than stopping at internal capability lookup.

## 2. Tracer Bullet

**Data**
- internal capability inventory
- local project modules and draft skills
- external candidate repos / frameworks / packages
- routing profiles, review packs, repo DNA, gap-analysis artifacts

**Logic**
- search internal first
- search adjacent/local second
- search external candidate surface third
- compare candidates on a shared rubric
- recommend the next canonical action

**Presentation**
- a short decision artifact with:
  - top matches
  - comparison matrix
  - recommended next action
  - rationale and risk notes

## 3. Context & Rationale

The system already had `create-skill`, `enhance-skill`, `register-skill-pack`, and `absorb-repo`, but it lacked a clear pre-decision research lane for requests like:

- find a repo that solves this
- is there already a skill for this
- compare internal capability vs external module
- before creating a new skill, check whether we already have 60-80% of the answer

Without this lane, Orch could still route, but the decision boundary between:

- `enhance-skill`
- `create-skill`
- `register-skill-pack`
- `absorb-repo`

was too implicit and easy to skip.

## 4. Orch Role

`orch-agent` should treat this story as part of its capability-routing responsibility:

- detect when the user is not asking to build immediately, but to **find the right source of solution first**
- route into `research-solution-sources`
- if the user explicitly asks for GitHub/external solution research, require external candidate search and attach `github-deep-research` on shortlisted candidates
- then decide whether the next step is:
  - `enhance-skill`
  - `create-skill`
  - `register-skill-pack`
  - `absorb-repo`

## 5. Role of `github-deep-research`

`github-deep-research` is relevant here, but it is **not** the owner workflow.

Its role inside Story 1.16 is:

- act as a **supportive deep-evidence skill** when external GitHub repositories are candidate solution sources
- go beyond README-level claims
- inspect architecture, core patterns, prompts, workflows, operating model, and implementation constraints

It should be used when:

- the user asks to find a repo/framework/library for a problem
- multiple GitHub candidates need comparison
- an external repo looks promising enough to justify deeper evaluation before `/absorb-repo`

It becomes mandatory when:

- the user explicitly says `research on GitHub`
- the user asks for external repos or open-source alternatives
- the user asks to compare outside frameworks/packages/solutions

It should **not** be mandatory when:

- the search is purely internal to I-Wish capabilities
- the answer can already be resolved from local skills/workflows/agents
- the user already provided a repo and the system is moving directly into `/absorb-repo`

## 6. Story Quality and Socratic Gate

This story must follow the same quality bar as other strong I-Wish/I-Wish stories.
The party-mode council memo in `docs/party-mode-github-solution-search-council-review.md` is the current decision reference for the GitHub solution-search rubric behind this story.
The corrected meta-research baseline for GitHub solution intelligence is in `docs/meta-research-github-solution-intelligence-stack.md`.

Before finalizing this workflow design, the capability path should explicitly challenge:

- whether the problem is already covered internally
- whether the request is actually a `workflow-patch` rather than a new top-level flow
- whether the GitHub search/repo comparison logic is specific enough to be reproducible
- whether the outputs are concrete enough for Orch to reuse later

This means the story should include:

- a tracer bullet
- explicit edge cases and stress cases
- a clear decision rubric
- a next-step decision matrix
- a meta-research baseline for which repo/tool/skill stack improves GitHub research quality itself

## 7. Search Strategy

### 7.1 Search order

The workflow should research in this order:

1. **Internal I-Wish surface**
   - existing skills
   - workflows
   - agents
   - library packs
   - already-registered external modules

2. **Adjacent local/project surface**
   - project-local custom modules
   - generated draft skills
   - absorbed repo DNA / gap-analysis artifacts

3. **External candidate surface**
   - repos the user points to
   - named frameworks, tools, libraries, or skill packs
   - GitHub candidates discovered through problem-fit search

This third layer is mandatory whenever the user explicitly asks for external/GitHub solution research.

### 7.2 GitHub search approach

When the workflow moves to GitHub research, it should search by more than one phrasing:

- raw problem statement
- user job-to-be-done
- technical pattern
- domain terminology
- tool/platform terminology

Example query families:

- `browser automation skill repo`
- `playwright visual qa workflow`
- `figma to code prompt workflow`
- `agentic capability registry`
- domain-specific variants of the same problem

### 7.3 Candidate funnel

The workflow should not dump a long list of weak options back to the user.

Recommended funnel:

- broad scan: up to `8-12` external candidates
- shortlist: top `3` primary candidates
- optional alternates: up to `2`

If fewer than `2-3` credible candidates exist, the workflow should say so explicitly instead of padding results.

## 7.4 Workflow Architecture for Long-Form Execution

Because this is a long workflow, it must not remain a single prose-heavy command file.
It should follow a **step-file execution architecture** similar to the strongest I-Wish / Superpower-style execution patterns:

### A. Workflow shell

The canonical `research-solution-sources.md` file should become a thin shell that owns:

- purpose and when-to-use
- stage map
- required tool/skill bindings per stage
- hard rules and anti-skip constraints
- final handoff rules

It should **not** contain the full operational detail of all phases inline.

### B. Step files

The workflow must be decomposed into explicit step files:

1. `step-rss-01-discover.md`
2. `step-rss-02-enrich.md`
3. `step-rss-03-trust-check.md`
4. `step-rss-04-deep-dive.md`
5. `step-rss-05-recommend.md`

Each step file must define:

- purpose
- required inputs
- exact process checklist
- output artifact(s)
- edge cases
- stop / escalate conditions
- next-step rule

### C. Artifact-first execution

Each stage must save a concrete artifact before the next stage begins.
No stage should be considered complete based on reasoning alone.

Recommended artifacts:

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

### D. State manifest and resume support

The workflow should maintain a lightweight state file, for example:

- `research-solution-sources.state.yaml`

This manifest should track:

- current stage
- completed stages
- pending stages
- produced artifacts
- whether user review is required
- where to resume after interruption

### E. Hard gates between stages

The workflow should enforce stage-level gates, including:

- `discover -> enrich` blocked if no valid candidate pool exists
- `enrich -> trust-check` blocked if no shortlist draft exists
- `trust-check -> deep-dive` blocked if no trust-adjusted shortlist exists
- `deep-dive -> recommend` blocked if shortlisted external candidates have not passed through `github-deep-research`
- `recommend -> handoff` blocked if no explicit canonical next action exists

### F. Human review checkpoints

At minimum, the workflow should support:

1. checkpoint after `discover`
   - if the pool is weak, noisy, or ambiguous
2. checkpoint after `recommend`
   - before proceeding to:
     - `/enhance-skill`
     - `/create-skill`
     - `/register-skill-pack`
     - `/absorb-repo`

### G. Single-step loading discipline

Execution should load:

- the workflow shell
- the current step file
- the output artifact(s) from the previous step

It should not rely on holding the entire long workflow in active context at once.

### H. Tool binding by stage

The default stage-to-tool binding should be:

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
  - internal comparison rubric + raw score synthesis

## 8. Candidate Comparison Rubric

Each strong candidate should be compared on a consistent rubric:

| Axis | What to evaluate |
|---|---|
| Problem fit | Does it actually solve the user's real problem, not just a nearby one? |
| Capability fit | Is it shaped like a skill/workflow/module/repo we can use? |
| Integration cost | How hard is it to adapt into I-Wish? |
| Architecture quality | Is the repo/workflow structure coherent and reusable? |
| Maintenance signal | Recency, issue hygiene, signs of abandonment |
| Trust & license | License, obvious red flags, reviewability |
| Docs & learnability | Can Orch and users actually understand it quickly? |
| Customization surface | Can it be adapted without forking into chaos? |

The output should not just say “best repo”. It should say **why**.

## 9. Edge Cases and Stress Cases

### Edge cases

- A local skill already solves 70-80% of the problem
- The best answer is a `workflow-patch`, not a new skill
- A repo is strong technically but has poor license/trust fit
- Multiple candidates solve adjacent problems, but none solve the exact one
- The user names a repo directly, so the workflow should compare “provided repo vs alternatives”

### Stress cases

- The search space is noisy and GitHub returns many lookalike repos
- README quality is misleading, so `github-deep-research` must inspect deeper
- A repo looks attractive but is tightly coupled to another platform/runtime
- The user wants “the best repo” with vague criteria, forcing the workflow to expose tradeoffs clearly

## 10. Next-Step Decision Matrix

After the comparison, the workflow must recommend one canonical next move:

- **`enhance-skill`**
  - if a strong internal capability already covers most of the problem

- **`create-skill`**
  - if nothing credible exists internally or externally in a usable form

- **`register-skill-pack`**
  - if a third-party pack is already well-shaped and needs registration more than absorption

- **`absorb-repo`**
  - if an external repo is strong enough to justify structured absorption

## 11. Acceptance Criteria

- **AC1:** A canonical supportive workflow exists for solution-source research before create/enhance decisions.
- **AC2:** Orch can route natural-language requests for repo/skill/framework discovery into that workflow.
- **AC3:** `create-skill` and `enhance-skill` explicitly reference this pre-decision research step.
- **AC4:** The inventory and command catalog recognize this workflow as part of the canonical surface.
- **AC5:** The story and workflow explicitly define when `github-deep-research` should be attached as a supportive skill.
- **AC6:** The workflow defines a reproducible GitHub/external search strategy rather than ad-hoc search.
- **AC7:** The workflow limits result volume and returns a shortlist rather than an unbounded dump.
- **AC8:** The workflow defines a shared comparison rubric for internal vs external candidates.
- **AC9:** The story includes edge cases, stress cases, and a tracer-bullet-level decision model.
- **AC10:** If the user explicitly asks for GitHub/external solution research, the workflow must perform external candidate search and cannot stop at internal lookup only.
- **AC11:** Shortlisted external candidates must be passed through `github-deep-research` before final recommendation.
- **AC12:** The workflow has a reviewed meta-research baseline for which repo/tool/skill stack should improve GitHub research quality for Story 1.16 itself.
- **AC13:** The workflow is implemented as a thin shell plus explicit step files rather than a single long prose file.
- **AC14:** Each stage has mandatory saved artifacts before the next stage begins.
- **AC15:** A state manifest exists so the workflow can resume safely after interruption.
- **AC16:** Stage-to-stage hard gates prevent the agent from skipping mandatory steps.
- **AC17:** The workflow defines at least two human review checkpoints for noisy discovery and final recommendation review.
- **AC18:** Stage-specific tool bindings are explicit and aligned with the meta-research baseline.

## 12. Task Breakdown

| Task | Description | Maps To |
|---|---|---|
| T1 | Create canonical workflow `research-solution-sources` with clear purpose, layers, outputs, and handoff rules | AC1 |
| T2 | Add routing-profile metadata so Orch can reason about this workflow | AC1, AC2 |
| T3 | Update Orch routing so natural-language “find repo/skill/framework” requests map here | AC2 |
| T4 | Update `create-skill` and `enhance-skill` to reference this research-first decision step | AC3 |
| T5 | Register the workflow in command catalog and platform inventory | AC4 |
| T6 | Document the attach conditions for `github-deep-research` | AC5 |
| T7 | Add explicit GitHub/external search strategy and candidate funnel rules | AC6, AC7 |
| T8 | Add comparison rubric and next-step decision matrix | AC8, AC9 |
| T9 | Enforce mandatory external candidate research for explicit GitHub/external-solution requests | AC10, AC11 |
| T10 | Produce a meta-research artifact that evaluates candidate tools/repo/skills for improving GitHub solution research itself | AC12 |
| T11 | Refactor `research-solution-sources` into a workflow shell plus 5 explicit stage step files | AC13 |
| T12 | Create artifact templates for each stage output and require save-before-next behavior | AC14 |
| T13 | Add a state manifest and resume rules for interrupted execution | AC15 |
| T14 | Add hard gates between stages so mandatory stages cannot be skipped | AC16 |
| T15 | Define and implement human review checkpoints at discovery and recommendation boundaries | AC17 |
| T16 | Encode stage-specific tool binding defaults from the meta-research baseline | AC18 |

## 13. Proposed File Structure

The target structure for implementation should be:

- `.agent/workflows/research-solution-sources.md`
- `.agent/workflows/step-rss-01-discover.md`
- `.agent/workflows/step-rss-02-enrich.md`
- `.agent/workflows/step-rss-03-trust-check.md`
- `.agent/workflows/step-rss-04-deep-dive.md`
- `.agent/workflows/step-rss-05-recommend.md`
- `.agent/workflows/research-solution-sources.state-template.yaml`
- `.agent/workflows/research-solution-sources-output-template.md`
- `.agent/workflows/research-solution-sources-scorecard-template.md`
- `.agent/workflows/research-solution-sources-trust-template.md`

## 14. Implementation Notes

The story should be implemented in two passes:

1. **Specification pass**
   - shell contract
   - step contracts
   - artifact contracts
   - state/resume contract
   - gate/checkpoint contract
2. **Runtime pass**
   - routing integration
   - tool binding integration
   - source-of-truth references
   - final handoff integration

## 13. Expected Outputs

- `.agent/workflows/research-solution-sources.md`
- `.agent/workflows/research-solution-sources.routing-profile.yaml`
- routing updates in `src/iwish/routing.ts`
- catalog and inventory updates
- a decision artifact shape for:
  - top matches
  - shortlist comparison
  - recommended next action
  - raw scores
  - 90-day diagnostics
  - rationale for rejected candidates

## 14. Reopen Notes

This story was reopened because the first pass was too thin.
It also failed to enforce the user's stronger requirement that explicit GitHub/external research requests must trigger real external candidate search.

Specifically, it was missing:

- tracer bullet / vertical slice framing
- explicit edge cases and stress cases
- clear GitHub search methodology
- shortlist/result-limit rules
- candidate-comparison criteria strong enough for Orch reuse

## 15. Current Status

- Story artifact has been reopened and strengthened.
- The implementation surface should now be reviewed through `/review` before the story is considered truly done.
