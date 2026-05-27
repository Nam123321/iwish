# Idea Challenge Integration Guide

## Snapshot

- Name: `Idea Challenge`
- Slug: `idea-challenge`
- Source: `Discover-phase workflow`
- Kind: `workflow`
- Shape: `workflow`
- Role: `process-primary`
- Registration state: `registered`
- Module class: `n/a`
- Trigger hints: `idea-challenge`
- Tool dependencies: none

## What It Is

`Idea Challenge` is a workflow registered in I-Wish as a `process-primary` capability.

## Why It Exists

- It gives users and Orch a reviewed, reusable capability instead of rediscovering the same solution each time.
- It creates a stable contract for future routing, planning, and human review.

## Delivery Framework Placement

- Phases:
- discover
- plan
- solution
- implement
- validate
- deliver
- Stages / tasks:
- stage orchestration
- artifact production

## Input -> Process -> Output

- Input:
  - user intent
  - relevant story, artifact, or task context
  - any tool/module constraints already known
- Process:
  - Orch evaluates whether `Idea Challenge` fits the current phase/stage
  - Orch decides whether to use it directly or through a parent workflow
  - user reviews any meaningful boundary or risk before deeper promotion
- Output:
  - clearer execution path
  - a reusable reviewed capability
  - richer routing context for future use

## Use Cases

### Core use cases
- Use Idea Challenge when the user explicitly asks for this capability or its native artifact/output.
- Use Idea Challenge when Orch needs a specialized workflow to improve execution quality.
- Use Idea Challenge as a reviewed building block instead of improvising an ad-hoc equivalent.

### Adjacent use cases
- Pair Idea Challenge with a parent workflow when the task is broader than the capability itself.
- Use Idea Challenge during review, audit, or stakeholder communication when its output can improve clarity.

### Do-not-use cases
- Do not default to Idea Challenge when a simpler canonical workflow already covers the job.
- Do not use Idea Challenge outside its reviewed boundaries without updating this review pack.

## Edge Cases / Stress Cases / Constraints

### Edge cases
- Idea Challenge may fit only a slice of a larger task, so Orch should avoid routing the whole request into it prematurely.
- Alias overlap or vague user intent may make Idea Challenge look applicable when it should be treated as optional support.

### Stress cases
- Idea Challenge should be re-evaluated when the request spans multiple stories, multiple tools, or a full end-to-end delivery phase.
- High-ambiguity requests should trigger a staged plan before Idea Challenge is used as a primary driver.

### Constraints
- Idea Challenge remains inside the I-Wish governance model: user review, explicit promotion boundaries, and compatibility-aware routing.
- If Idea Challenge is external, Orch should treat it as reviewed support rather than silently promoting it into core behavior.

## Agent / Workflow / Skill Coordination

- Canonical agents:
- orch-agent
- Primary workflows:
- plan
- Supportive skills:
- skill selection depends on the parent workflow

## Orch Routing Hints

- Prefer suggesting Idea Challenge when its trigger phrases appear and the current stage matches its delivery placement.
- Avoid auto-routing to Idea Challenge when the request is still under-scoped and a broader planning or review workflow should run first.

## Review Questions For The User

- Which use cases of Idea Challenge do you want Orch to suggest automatically?
- What edge cases, exclusions, or approval boundaries should Orch respect for Idea Challenge?
- Should Idea Challenge stay external/supportive, or do you expect deeper promotion into canonical workflows later?

## Example Scenarios

- Use Idea Challenge to support a stage-specific task inside an existing delivery workflow.
- Ask Orch to evaluate whether Idea Challenge should be used before implementation begins.
- Review Idea Challenge as an optional supportive module for a story that needs better artifacts or stronger quality gates.
