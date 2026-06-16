---
name: idea-challenge
description: Canonical Discover-phase workflow for Working Backwards concept
  challenge, PRFAQ-style idea stress testing, and downstream planning
  distillation.
---

# /idea-challenge

Canonical workflow for challenging a product, solution, or business idea before committing to PRD and delivery planning.

This workflow absorbs the strongest parts of upstream `prfaq`, but adapts them to I-Wish:

- customer-first concept forging
- hard objection handling
- strategic and business-model challenge
- downstream distillation into planning-ready artifacts
- concept-type calibration (commercial, internal tool, OSS, community/nonprofit)
- resume-aware stage progression
- research-grounded claims instead of hand-wavy assumptions
- verdict-based exit with explicit next-step recommendation
- preserved coaching notes for downstream compression and reuse

## When to Use

Use `/idea-challenge` when the user says or implies:

- `prfaq`
- `working backwards`
- `press release first`
- `stress-test this idea`
- `validate this product concept`
- `is this idea worth building`
- `hãy thử thách ý tưởng này`
- `đánh giá ý tưởng`
- `làm rõ value proposition`

## What This Workflow Owns

This workflow is a **Discover-phase process-primary flow**.

It owns:

- customer/problem/stakes/solution clarity
- concept-forging pressure
- strong objection surfacing
- readiness handoff into `plan`

It does **not** replace:

- `research` for domain, market, or technical evidence gathering
- `socratic-review` as a reusable questioning engine
- `unique-advantage-evaluator` as the strategic advantage lens

## Required Add-Ons

When running `/idea-challenge`, Orch or the owning agent should attach:

1. `socratic-review`
   - mode: `discovery`
   - use for progressive adversarial questioning

2. `unique-advantage-evaluator`
   - attach when the user asks about:
     - business advantage
     - defensibility
     - moat / unfair advantage
     - business model strength
     - pricing or distribution edge

3. `research` **[PREREQUISITE — NOT OPTIONAL]**
   - MUST be completed BEFORE `/idea-challenge` begins
   - Agent MUST load and reference the following files during challenge:
     - `market-research.md` — for market size, TAM/SAM/SOM claims
     - `competitor-research.md` — for differentiation arguments
     - `domain-research.md` — for industry-specific validation
     - `technical-research.md` — for feasibility and ML/AI complexity assessment
   - If any file is missing, agent should flag it and route to `/research` first

4. `fragment-idea-discovery-framework`
   - load and use to structure the raw idea clarification and pushback conversation

## Runtime Role

`idea-challenge` is the mainline Discover workflow.

It is not just a prompting posture. It is a stateful sequence with explicit artifacts, stage transitions, and handoff rules.

If the user simply wants lightweight ideation, use `idea-hardening` + `socratic-review` without forcing the full gauntlet.

If the user wants a battle-tested concept before PRD, run this workflow fully.

## Modes

### Interactive Mode

Default mode.

Use when:

- the concept is still fuzzy
- the user wants coaching and challenge
- strategic shape is not locked yet

### Draft-First Mode

Use when the user already has enough basics and wants a strong first draft quickly.

Minimum input:

- user/persona
- problem
- stakes
- rough solution direction

The workflow may still challenge assumptions, but it should move faster to artifact generation.

### Resume Mode

If an existing `idea-challenge-{project}.md` already exists, the workflow should inspect the current stage and resume from the next incomplete stage instead of restarting from zero.

### Research-Grounded Mode

**[MANDATORY]** Before entering `/idea-challenge`, the agent MUST verify that research outputs exist in the project's `_iwish-output/1. Idea Discovery/1.4. research/` directory. If research files (market-research.md, competitor-research.md, domain-research.md, technical-research.md) do NOT exist, the agent MUST route to `/research` first and BLOCK `/idea-challenge` from starting.

## Stage Map

Execute in this order:

1. `step-ic-01-ignition.md`
2. `step-ic-02-press-release.md`
3. `step-ic-03-customer-faq.md`
4. `step-ic-04-internal-faq.md`
5. `step-ic-05-strategic-advantage.md`
6. `step-ic-06-distillate-and-handoff.md`

## Default Flow

### Step 1: Ignition

Read and execute: `step-ic-01-ignition.md`

The goal is to capture enough truth to justify entering the full challenge.

If the user cannot define the basic problem/user/stakes after a short loop, route them back to lighter ideation support instead of forcing a fake PRFAQ.

### Step 2: Press Release

Read and execute: `step-ic-02-press-release.md`

This stage should force clarity on:

- what is being announced
- who it matters to
- why a user would care

### Step 3: Customer FAQ

Read and execute: `step-ic-03-customer-faq.md`

This stage stress-tests external adoption objections.

### Step 4: Internal FAQ

Read and execute: `step-ic-04-internal-faq.md`

This stage stress-tests feasibility, risk, and execution reality.

### Step 5: Strategic Advantage

Read and execute: `step-ic-05-strategic-advantage.md`

This is where `unique-advantage-evaluator` becomes mandatory if the concept needs:

- differentiation
- defensibility
- stronger pricing or distribution logic
- `biz-stack` shaping

### Step 6: Distillate and Handoff

Read and execute: `step-ic-06-distillate-and-handoff.md`

This stage decides whether the output is ready for:

- `/plan`
- additional `/research`
- `/pivot-project`

## Concept-Type Adaptation

At the start of the workflow, classify the idea as one of:

- commercial product
- internal tool
- open-source project
- community / nonprofit initiative

This classification should change the framing of:

- customer language
- pricing/economics questions
- adoption questions
- internal FAQ pressure

Do not force commercial framing onto non-commercial concepts.

## Coaching Notes

Each stage should preserve concise context notes that survive later summarization:

- rejected framings
- assumptions challenged
- out-of-scope but important context
- strategic observations
- open questions

Use comment blocks such as:

- `<!-- coaching-notes-stage-1 -->`
- `<!-- coaching-notes-stage-2 -->`
- `<!-- coaching-notes-stage-3 -->`
- `<!-- coaching-notes-stage-4 -->`
- `<!-- coaching-notes-stage-5 -->`

These notes feed the final distillate and later Orch research.

## Add-On Roles

### `idea-hardening`

Use for:

- option framing
- YAGNI checks
- MVP pressure
- visual routing choices

This is a discipline layer, not the owner of the concept challenge.

### `socratic-review`

Use for:

- adversarial questioning
- progressive clarification
- synthesis checkpoints

This is the questioning engine, not the business strategy lens.

### `unique-advantage-evaluator`

Use for:

- competitive edge analysis
- business-model strengthening
- defensibility review
- `biz-stack` proposals

This is the strategic lens, not the primary workflow owner.

### `research`

> **Note:** Research is a **PREREQUISITE** for `/idea-challenge` (see Required Add-Ons above). This section describes how research data feeds INTO the challenge steps.

Research should feed back into the challenge. It should not replace the challenge.

## Expected Outputs

Recommended artifacts:

- `idea-challenge-{project}.md`
- `idea-challenge-{project}-distillate.md`
- optional `biz-stack.md` if `unique-advantage-evaluator` was used deeply

Use the templates:

- `idea-challenge-output-template.md`
- `idea-challenge-distillate-template.md`

## Recommended Next Steps

After `/idea-challenge`, Orch should usually route to:

- `/plan` for PRD or product brief work
- `/research` if evidence gaps remain
- `/pivot-project` if this is a major strategic redirection of an active project

## Orch Deep Chain

When the user is not just asking for a light challenge, Orch MUST prefer this chain:

1. `/idea-discover` — clarify raw problem, persona, JTBD
2. `/research` — gather market, domain, competitor, and technical evidence FIRST
3. `/idea-challenge` — challenge the idea WITH research data as ammunition
4. `unique-advantage-evaluator` when the concept needs stronger business advantage
5. `/product-strategy` — synthesize all discovery outputs into Go/No-Go assessment
6. `/plan` to turn the challenged concept into a PRD-ready planning artifact

This chain should preserve and reuse:

- `idea-challenge-{project}.md`
- `idea-challenge-{project}-distillate.md`
- optional `biz-stack.md`
- research notes or evidence briefs

## Navigator Sync

After materially updating any of the following:

- `idea-challenge-{project}.md`
- `idea-challenge-{project}-distillate.md`
- `biz-stack.md`

the agent should invoke `navigator-guardian` so the HTML overview reflects the new Discover/analysis lineage before the project moves deeper into PRD, epic, and story planning.

## Notes

- `idea-challenge` is the canonical I-Wish surface.
- Legacy alias `/prfaq` should route here.
- Use this workflow before heavy delivery planning when the concept is still weak, fuzzy, or strategically under-shaped.
