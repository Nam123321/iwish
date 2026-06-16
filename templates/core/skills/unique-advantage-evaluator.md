---
name: 'unique-advantage-evaluator-wrapper'
description: 'Use when evaluating whether an idea, plan, or active project has a durable business advantage, or when proposing stronger business-model, pricing, and positioning options.'
---

# Unique Advantage Evaluator

`unique-advantage-evaluator` is a strategic add-on capability for I-Wish.

It should be used as a **supportive attachment**, not as the default mainline workflow.

Its job is to help the system answer two complementary questions:

1. **Stress-Test Mode:** Does this idea, plan, or project really have a meaningful and durable advantage?
2. **Solution-Proposal Mode:** Given the current market/domain/competitor context, what stronger business directions could create a better advantage?

## Purpose

This capability exists because many ideas are clear enough to describe, but weak in strategic terms.

A product can be:

- useful but easy to copy
- interesting but poorly monetized
- technically solid but strategically generic
- differentiated in features but not in business leverage

This skill helps expose that gap and propose stronger options.

## Vocabulary Coverage

Do not rely only on specialist jargon like `moat`.

Treat the following as valid entry signals:

### Specialist terms

- moat
- economic moat
- defensibility
- network effects
- switching costs
- counter-positioning
- cornered resource

### Business-friendly terms

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

### Vietnamese-friendly terms

- lợi thế cạnh tranh
- lợi thế cạnh tranh bất bình đẳng
- lợi thế kinh doanh
- lợi thế mô hình
- lợi thế sản phẩm
- lợi thế khó sao chép
- khác biệt cạnh tranh
- lợi thế bền vững

## Modes

### Mode 1: Stress-Test

Use this mode during:

- `idea-challenge`
- product brief or PRD shaping
- `pivot-project`
- major plan review

Focus:

- Is the claimed advantage real?
- Is this just operational efficiency, not strategy?
- Could a stronger competitor copy this quickly?
- Is the business model ordinary even if the product surface looks fresh?
- Is there a durable edge in distribution, pricing, data, trust, workflow lock-in, ecosystem, or brand?

### Mode 2: Solution-Proposal

Use this mode during:

- `research`
- planning conversations
- business-model design
- plan-level pivot work

Focus:

- What advantage angles are plausible in this domain?
- What pricing structures reinforce the advantage?
- What distribution path could create asymmetric leverage?
- What user behavior or workflow lock-in could strengthen retention?
- What should the `biz-stack` look like?

## Inputs

This skill works best with:

- domain research
- market research
- competitor research
- concept summary from `idea-challenge`
- product brief / PRD draft
- pivot context from `pivot-project`

If evidence is weak, request `research` rather than pretending certainty.

## Output Pattern

Recommended output format:

```markdown
## Unique Advantage Evaluation

### Current Direction
- Summary: ...
- Claimed advantage: ...

### Stress-Test Verdict
- Real advantage signals: ...
- Weak or copyable parts: ...
- Strategy vs operational-effectiveness check: ...

### Stronger Directions
- Business-model options: ...
- Pricing options: ...
- Distribution options: ...
- Retention/lock-in options: ...

### Biz Stack
- Core advantage source: ...
- Reinforcing mechanisms: ...
- Risks that could erase the advantage: ...

### Recommendation
- Keep / reshape / pivot
```

## Biz Stack Concept

In I-Wish, a `biz-stack` is the business-side analogue to a tech stack.

It can include:

- business model
- pricing model
- distribution channel
- acquisition wedge
- retention mechanism
- switching friction or workflow lock-in
- ecosystem / partner leverage
- data or trust compounding loop

This capability should help define or refine that stack.

## Integration Rules

- Prefer attaching this skill to `idea-challenge`, `plan`, `research`, or `pivot-project`.
- Do not inject it by default into implementation-only workflows like `code`, `fix-bug`, or Tien-Shinhan.
- If the ask is mostly customer/problem/value clarity, let `idea-challenge` own the flow.
- If the ask is mostly strategic differentiation, pricing, or defensibility, this skill can lead the analysis.

## Relationship to Neighbor Capabilities

- `idea-challenge` owns the Discover-phase concept challenge flow.
- `socratic-review` provides the questioning engine and adversarial structure.
- `idea-hardening` provides ideation discipline such as option framing and YAGNI checks.

This skill is the strategic advantage lens that complements, but does not replace, those capabilities.
