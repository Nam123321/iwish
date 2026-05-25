# I-Wish Triage: `idea-challenge`, `unique-advantage-evaluator`, and `socratic-review`

Generated: 2026-05-16

## Purpose

This document captures the official triage outcome for three related but non-identical capability areas:

- upstream BMAD `prfaq` -> canonical I-Wish `idea-challenge`
- proposed `strategy-moat-evaluator` -> canonical I-Wish `unique-advantage-evaluator`
- existing `socratic-review`

The goal is to stop ad hoc naming and decide these capabilities through the I-Wish funnel:

- capability `shape`
- capability `role`
- delivery `phase`
- integration mode

## Decision Summary

### 1. `idea-challenge`

- Canonical rename from upstream `prfaq`
- Classification:
  - `shape`: `workflow`
  - `role`: `process-primary`
  - `phase`: `Discover`
- Job:
  - stress-test a product or solution idea through Working Backwards style pressure
  - force customer/problem/value/stakes/solution clarity before PRD
  - produce downstream planning input

### 2. `unique-advantage-evaluator`

- Canonical rename from proposed `strategy-moat-evaluator`
- Classification:
  - `shape`: `skill-attachment` first
  - can evolve to `workflow-patch` if integration surface becomes broad
  - do not start as a large standalone workflow by default
  - `role`: `supportive`
  - `phase`: `Discover`, `Plan`, `pivot-project`
- Job:
  - evaluate whether an idea, plan, or product direction has durable business advantage
  - stress-test competitive strength
  - propose stronger business-model and positioning options
  - help define a `biz stack` alongside the tech stack

### 3. `socratic-review`

- Keep current canonical name
- Classification:
  - `shape`: `skill`
  - `role`: `supportive`, with partial `foundational` behavior
  - `phase`: cross-phase
- Job:
  - provide structured adversarial questioning
  - operate as a gate or questioning protocol
  - improve clarity, rigor, and synthesis across many workflows

## Why They Should Not Be Merged

These three capabilities overlap in method but not in purpose.

### `idea-challenge`

This is the mainline product-concept challenge flow.

It answers:

- What are we building?
- For whom?
- Why now?
- Why would anyone care?
- What objections would customers and stakeholders raise?

### `unique-advantage-evaluator`

This is the strategic defensibility and business-advantage lens.

It answers:

- What gives this direction an advantage that is hard to copy?
- Is this just operational improvement or real strategic leverage?
- What business model, pricing, distribution, switching cost, data, ecosystem, or network advantages are possible?
- If the current idea is weak, how should we reshape it?

### `socratic-review`

This is the questioning engine.

It answers:

- What assumptions are weak?
- What trade-off is being ignored?
- Are we adding complexity without justification?
- What evidence is missing?

The overlap is real, but it is mostly in the questioning posture, not in the business job to be done.

## Official Integration Model

### Pattern A: `idea-challenge` + `socratic-review`

Default use for early concept challenge.

- `idea-challenge` owns the flow
- `socratic-review` is injected as the questioning gate

### Pattern B: `idea-challenge` + `unique-advantage-evaluator`

Use when the concept needs strategic and business-model stress testing.

- `idea-challenge` owns the main customer/problem/value flow
- `unique-advantage-evaluator` adds business defensibility analysis

### Pattern C: `idea-challenge` + `unique-advantage-evaluator` + `research`

Use when the user wants not only critique, but better strategic options.

- `research` supplies domain, market, and competitor context
- `unique-advantage-evaluator` turns that context into strategic proposals
- `idea-challenge` integrates it into the product-concept challenge

### Pattern D: `pivot-project` + `unique-advantage-evaluator`

Use when a project is already in motion but the direction may no longer be strong enough.

- `pivot-project` owns re-routing
- `unique-advantage-evaluator` tests whether the current plan still has a compelling business edge

## Two-Way Behavior of `unique-advantage-evaluator`

This capability must not be one-directional.

It has two modes:

### Mode 1: Stress-Test

Use during:

- `idea-challenge`
- product brief review
- PRD challenge
- `pivot-project`

Questions include:

- Is this advantage real or cosmetic?
- Is this just a feature, not a strategy?
- Could a larger competitor copy this quickly?
- Does pricing, distribution, trust, workflow lock-in, ecosystem fit, or data advantage exist?

### Mode 2: Solution-Proposal

Use during:

- `research`
- planning conversations with user
- product brief/PRD shaping
- plan-level pivot work

Outputs include:

- recommended business angles
- differentiated pricing ideas
- distribution and channel ideas
- adoption wedge suggestions
- unfair-advantage hypotheses
- `biz-stack` proposal

This is why `unique-advantage-evaluator` should be treated as a bidirectional strategic add-on, not just a negative critique engine.

## Vocabulary and Trigger Coverage

The system must not rely only on specialist words like `moat`.

### Specialist triggers

- moat
- economic moat
- defensibility
- strategic moat
- network effects
- switching costs
- scale advantage
- counter-positioning
- cornered resource

### Business-friendly triggers

- business advantage
- strategic advantage
- unique advantage
- unfair advantage
- business model advantage
- pricing advantage
- distribution advantage
- competitive edge
- differentiated model
- biz stack

### Vietnamese-friendly triggers

- lợi thế cạnh tranh
- lợi thế cạnh tranh bất bình đẳng
- lợi thế kinh doanh
- lợi thế mô hình
- lợi thế sản phẩm
- khác biệt cạnh tranh
- lợi thế bền vững
- lợi thế khó sao chép

Routing should recognize all of these as potential entrypoints into `unique-advantage-evaluator`.

## Relationship to Existing Skills

### Existing `idea-hardening`

Likely adjacent and must be reviewed before creating a near-duplicate.

Expected action:

- evaluate whether `idea-hardening` should absorb part of the `idea-challenge` or `unique-advantage-evaluator` logic
- prefer `enhance-skill` over blind net-new capability creation if overlap is high

### Existing `socratic-review`

Do not replace it.

Expected action:

- enhance integration points
- keep it as the structured questioning protocol
- attach it to `idea-challenge`, `pivot-project`, and selected planning workflows

## Recommended Funnel Decisions

### `idea-challenge`

- Use `absorb-repo` or equivalent upstream-learning flow to capture BMAD `prfaq`
- Then route through `create-skill` triage
- Outcome should become a new canonical workflow

### `unique-advantage-evaluator`

- First run overlap review against:
  - `idea-hardening`
  - `socratic-review`
  - planning and research workflows
- Then route through `enhance-skill`
- Preferred result:
  - start as `skill-attachment`
  - promote to `workflow-patch` only if multiple workflows need explicit standalone orchestration

### `socratic-review`

- Keep as current canonical skill
- Extend only where integration gaps exist

## Proposed Outputs

### `idea-challenge`

- `idea-challenge-{project}.md`
- optional downstream distillate for PRD/plan

### `unique-advantage-evaluator`

- `advantage-hypotheses.md`
- `competitive-edge-map.md`
- `strategy-vs-ops-check.md`
- `biz-stack.md`

## Final Recommendation

Do not merge these three into one capability.

Instead:

- `idea-challenge` becomes the new Discover-phase process workflow
- `unique-advantage-evaluator` becomes the strategic supportive add-on
- `socratic-review` remains the reusable questioning engine

This gives I-Wish:

- a clear mainline workflow
- a reusable strategy lens
- a reusable critical-thinking protocol

That separation is cleaner for Orch routing, easier for users to understand, and safer for future evolution.
