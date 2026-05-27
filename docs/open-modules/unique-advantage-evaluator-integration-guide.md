# Unique Advantage Evaluator Integration Guide

## Snapshot

- Name: `Unique Advantage Evaluator`
- Slug: `unique-advantage-evaluator`
- Source: `Strategic business-advantage lens`
- Kind: `skill`
- Shape: `skill`
- Role: `supportive`
- Registration state: `registered`
- Module class: `n/a`
- Trigger hints: `business advantage`, `competitive edge`, `unfair advantage`, `moat`, `defensibility`
- Tool dependencies: none

## What It Is

`Unique Advantage Evaluator` is a skill registered in I-Wish as a `supportive` capability.

## Why It Exists

- It gives users and Orch a reviewed, reusable capability instead of rediscovering the same solution each time.
- It creates a stable contract for future routing, planning, and human review.

## Delivery Framework Placement

- Phases:
- supporting multiple delivery phases
- Stages / tasks:
- task execution
- specialized assistance

## Input -> Process -> Output

- Input:
  - user intent
  - relevant story, artifact, or task context
  - any tool/module constraints already known
- Process:
  - Orch evaluates whether `Unique Advantage Evaluator` fits the current phase/stage
  - Orch decides whether to use it directly or through a parent workflow
  - user reviews any meaningful boundary or risk before deeper promotion
- Output:
  - clearer execution path
  - a reusable reviewed capability
  - richer routing context for future use

## Use Cases

### Core use cases
- Use Unique Advantage Evaluator when the user explicitly asks for this capability or its native artifact/output.
- Use Unique Advantage Evaluator when Orch needs a specialized skill to improve execution quality.
- Use Unique Advantage Evaluator as a reviewed building block instead of improvising an ad-hoc equivalent.

### Adjacent use cases
- Pair Unique Advantage Evaluator with a parent workflow when the task is broader than the capability itself.
- Use Unique Advantage Evaluator during review, audit, or stakeholder communication when its output can improve clarity.

### Do-not-use cases
- Do not default to Unique Advantage Evaluator when a simpler canonical workflow already covers the job.
- Do not use Unique Advantage Evaluator outside its reviewed boundaries without updating this review pack.

## Edge Cases / Stress Cases / Constraints

### Edge cases
- Unique Advantage Evaluator may fit only a slice of a larger task, so Orch should avoid routing the whole request into it prematurely.
- Alias overlap or vague user intent may make Unique Advantage Evaluator look applicable when it should be treated as optional support.

### Stress cases
- Unique Advantage Evaluator should be re-evaluated when the request spans multiple stories, multiple tools, or a full end-to-end delivery phase.
- High-ambiguity requests should trigger a staged plan before Unique Advantage Evaluator is used as a primary driver.

### Constraints
- Unique Advantage Evaluator remains inside the I-Wish governance model: user review, explicit promotion boundaries, and compatibility-aware routing.
- If Unique Advantage Evaluator is external, Orch should treat it as reviewed support rather than silently promoting it into core behavior.

## Agent / Workflow / Skill Coordination

- Canonical agents:
- orch-agent
- Primary workflows:
- plan
- Supportive skills:
- skill selection depends on the parent workflow

## Orch Routing Hints

- Prefer suggesting Unique Advantage Evaluator when its trigger phrases appear and the current stage matches its delivery placement.
- Avoid auto-routing to Unique Advantage Evaluator when the request is still under-scoped and a broader planning or review workflow should run first.

## Review Questions For The User

- Which use cases of Unique Advantage Evaluator do you want Orch to suggest automatically?
- What edge cases, exclusions, or approval boundaries should Orch respect for Unique Advantage Evaluator?
- Should Unique Advantage Evaluator stay external/supportive, or do you expect deeper promotion into canonical workflows later?

## Example Scenarios

- Use Unique Advantage Evaluator to support a stage-specific task inside an existing delivery workflow.
- Ask Orch to evaluate whether Unique Advantage Evaluator should be used before implementation begins.
- Review Unique Advantage Evaluator as an optional supportive module for a story that needs better artifacts or stronger quality gates.
