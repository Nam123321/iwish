# Party Mode Council Review: GitHub Solution Search Criteria

## Context

This memo captures a **party-mode style council review** for building the GitHub solution-search criteria behind `research-solution-sources`.

Topic under review:

- when a user asks I-Wish to research solutions on GitHub
- how Orch should search
- how many candidates should be returned
- how candidates should be compared
- how to decide the next action:
  - `enhance-skill`
  - `create-skill`
  - `register-skill-pack`
  - `absorb-repo`

## Process Note

The project runtime does not currently have `_bmad/core/workflows/party-mode/workflow.md` materialized in project mode, so this review follows the **source-mode party-mode contract**:

- anti-sycophancy is mandatory
- pushback is mandatory
- when two perspectives agree, a third must challenge them

## Council

- `orch-agent`
  Role: chair, routing and orchestration view
- `pm-agent`
  Role: product/discovery and problem-framing view
- `capability-agent`
  Role: capability shape, absorb/register/enhance/create decision view
- `review-agent`
  Role: adversarial validation and red-flag detection
- `research-agent`
  Role: search strategy and evidence gathering

## Round 1: Proposed Criteria

### 1. Problem Framing Before Search

The council agrees the search must start from the **problem to solve**, not the tool name.

Minimum brief before search:

- problem statement
- desired outcome
- constraints
- target shape:
  - repo
  - skill
  - workflow
  - agent
  - module
- desired next use:
  - reference only
  - register
  - absorb
  - enhance internal capability

### 2. Search Layers

Search must proceed in layers:

1. internal I-Wish surface
2. adjacent local/project surface
3. external GitHub candidate surface

If the user explicitly asks for GitHub/external solutions, layer 3 is mandatory.

### 3. Query Families

Do not search with one query only.

Use multiple query families:

- problem wording
- user job-to-be-done wording
- technical pattern wording
- domain wording
- tool/platform wording
- synonym wording
- bilingual wording if useful

Also vary the target object:

- repo
- workflow
- skill
- agent
- module
- template
- starter / boilerplate

### 4. Candidate Funnel

The council recommends:

- broad scan: `8-12` raw external candidates
- shortlist: `3` primary candidates
- alternates: up to `2`

Do not return a long flat dump.

### 5. Required Evidence for Shortlisted GitHub Candidates

Shortlisted candidates must be inspected beyond README.

Evidence required:

- source tree shape
- architecture seams / extension points
- dependency burden
- maintenance signal
- trust/license posture
- docs quality
- integration cost
- customization surface
- last-90-days release/community signal

Minimum last-90-days signal:

- releases in the last 90 days, if any
- what those releases were about
- issue/complaint patterns in the last 90 days
- contribution signal:
  - active maintainers
  - merged PR movement
  - visible bugfix behavior
- praise/complaint signal from public issues/discussions where available

### 6. Candidate Comparison Rubric

Every shortlisted candidate should be scored or at least compared on:

- problem fit
- capability fit
- integration cost
- architecture quality
- maintenance signal
- trust and license fit
- docs and learnability
- customization surface

### 7. Mandatory Output Shape

The final decision artifact should include:

- search intent summary
- internal matches
- external shortlist
- why each shortlisted candidate is in
- why rejected candidates were rejected
- recommendation:
  - `enhance-skill`
  - `create-skill`
  - `register-skill-pack`
  - `absorb-repo`

## Round 2: Pushback and Devil's Advocate

### Pushback A: “Top 3 might be too few”

Objection:
- If the search space is noisy or the problem is multi-dimensional, a top-3 shortlist may create false certainty.

Response:
- The shortlist should still be `3 + 2 alternates`, but the artifact must explicitly say when the pool is weak or ambiguous.
- If the pool is weak, Orch should recommend:
  - broaden search framing
  - ask a clarifying question
  - or split the problem into sub-problems

### Pushback B: “Popularity bias can poison the shortlist”

Objection:
- GitHub stars and buzz can overwhelm real fit.

Response:
- Stars are only a **secondary trust signal**, never the ranking backbone.
- Problem fit, integration cost, and architecture quality outrank stars.
- A less popular but cleaner repo may outrank a famous but tightly coupled one.
- A repo with strong stars but weak recent releases, weak maintainer response, or repeated complaints should be downgraded.

### Pushback C: “Internal match can hide the need for external search”

Objection:
- Orch may find a partial internal match and stop too early, even when the user explicitly asked for outside solutions.

Response:
- If the user explicitly asks for GitHub/external solutions, external search is mandatory.
- Internal-only stopping is allowed only when the user explicitly asked for internal overlap checking.

### Pushback D: “README-level evaluation is dangerously shallow”

Objection:
- README promises do not prove runtime shape or absorbability.

Response:
- `github-deep-research` must be mandatory for shortlisted external candidates.
- No final recommendation should be issued on README-only evidence.

### Pushback E: “One repo may solve only part of the problem”

Objection:
- The best answer may be composition, not a single repo.

Response:
- The artifact should allow:
  - `single-candidate recommendation`
  - `composed recommendation`
  - `internal + external hybrid recommendation`

### Pushback F: “Search terms can miss the real solution shape”

Objection:
- User may ask for a `repo`, but the best answer is actually a skill pack, workflow pattern, or agent shell.

Response:
- Search criteria must distinguish solution shape explicitly.
- Orch should search by **problem and shape**, not just problem.

## Round 3: Final Council Synthesis

### A. Decision Rules

1. If the user explicitly asks for GitHub/external solutions:
   - run internal scan
   - run external GitHub candidate search
   - shortlist candidates
   - run `github-deep-research` on shortlisted candidates
   - then recommend next action

2. If the user asks only whether I-Wish already has a capability:
   - internal-first search may be enough
   - external search is optional

3. If problem framing is too vague:
   - do not rush into raw search
   - Orch should clarify or generate `2-3` search framings first

### B. Search Workflow Standard

1. Frame the problem
2. Classify desired solution shape
3. Search internal surface
4. Search external GitHub surface if required
5. Build broad candidate pool
6. Shortlist `3 + 2`
7. Deep-research shortlisted external repos
8. Compare using shared rubric
9. Recommend one canonical next action

### C. Minimum Shortlist Card

Each shortlisted candidate should have:

- candidate name
- solution shape
- what problem it solves
- why it matches this request
- strongest strengths
- strongest risks
- integration recommendation
- final verdict

### D. Canonical Verdict Options

- `Enhance existing internal capability`
- `Create new skill/workflow/agent`
- `Register external skill/module pack`
- `Absorb external repo`
- `Do not adopt; use as reference only`
- `Split into multiple solution paths`

## Proposed Scoring Model

Suggested weighted dimensions:

- `problem_fit`: 25
- `integration_cost`: 15
- `architecture_quality`: 15
- `customization_surface`: 10
- `maintenance_signal`: 10
- `trust_license`: 10
- `docs_learnability`: 10
- `shape_fit`: 5

Notes:

- `problem_fit` should dominate.
- `stars` should not be a primary scoring dimension.
- If trust/license fails, the candidate can be rejected regardless of score.

## Red Flags That Should Automatically Downgrade a Candidate

- no clear license
- tightly coupled to a proprietary runtime with no seam
- demo-only repo with weak core logic
- abandoned repo with unresolved critical issues
- misleading README / no source proof
- huge monorepo where the valuable slice cannot be isolated
- no obvious path into `SKILL.md`, workflow, module, or adapter shape
- active recent complaints with weak maintainer response and no visible repair in releases/PRs

## Additional Review Signals

The council recommends a mandatory `90-day diagnostics` block in the final artifact:

- recent releases:
  - count
  - themes
  - signs of stabilization vs churn
- recent complaints:
  - recurring bugs
  - install problems
  - trust complaints
  - maintainer responsiveness
- recent praise:
  - ease of use
  - architecture clarity
  - integration value
- contribution health:
  - visible PR/issue movement
  - bus-factor signals

## Meta-Research Stack Candidates

The council also recommends evaluating tools/repositories that can improve repo research quality itself.

Initial candidate classes:

- `github-deep-research`
  - deep architecture extraction beyond README
- `repomix`
  - prompt-friendly repository packing and structure extraction
- `gitingest`
  - digest-style codebase ingestion for faster candidate triage
- code-search / code-intelligence tools
  - useful when raw tree browsing is too shallow
- web/document extraction tools
  - useful when repo docs, release notes, and issue context need structured capture

These should not be adopted blindly.

They should be evaluated with the same rubric:

- do they improve search recall or precision
- do they improve shortlist quality
- do they reduce token waste
- do they surface architecture evidence better
- do they add legal/security/tooling burden

## Recommended Change to Story 1.16

The council recommends Story 1.16 explicitly require:

- external search when user asks for GitHub solutions
- `github-deep-research` on shortlisted external candidates
- explicit shortlist funnel
- explicit comparison rubric
- explicit verdict matrix
- explicit 90-day community/release diagnostics
- follow-up evaluation of meta-research tools that improve repo research quality

## Open Questions for Review

1. Should Orch always include one “boring but reliable” candidate in the top 3?
2. Should composition of multiple repos/skills be a first-class verdict?
3. Should legal/trust failures hard-block `absorb-repo`, or merely downgrade it to `reference only`?
4. Should the search artifact expose raw candidate scores to users, or only ranked rationale?
5. When the pool is weak, should Orch default to `create-skill`, or first ask for narrower scope?

## Review Recommendation

The council recommends approving the following principles as canonical:

- problem-first, not tool-first
- internal-first but external-mandatory when the user asks for GitHub/outside solutions
- shortlist instead of dump
- deep-research beyond README
- shared rubric before action
- explicit verdict matrix instead of vague recommendation
