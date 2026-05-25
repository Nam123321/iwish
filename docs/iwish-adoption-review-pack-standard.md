# I-Wish Adoption Review Pack Standard

Generated: 2026-05-16

## Purpose

Whenever I-Wish:

- absorbs an external repo
- registers an external skill/module
- creates a new skill/workflow/agent
- evolves an existing capability in a way that changes user-facing behavior

it should also create a **review pack** for humans and Orch.

The review pack exists for two reasons:

1. **Human review:** give the user a readable, shareable artifact to understand what the capability is, where it fits, and what risks or decisions remain.
2. **Orch context:** give Orch richer structured understanding for later semantic routing, stage planning, and supportive-capability selection.

## Deliverables

Every review pack should contain two files:

```text
<target>/integration-guide.md
<target>/integration-guide.html
```

Recommended targets:

- absorbed repo or external module:
  - `docs/open-modules/<name>-integration-guide.md`
  - `docs/open-modules/<name>-integration-guide.html`
- generated draft capability:
  - `${IWISH_HOME}/generated-skills/<name>/integration-guide.md`
  - `${IWISH_HOME}/generated-skills/<name>/integration-guide.html`
  - or corresponding generated-workflows/generated-agents path

## Runtime Automation

This standard is not docs-only.

I-Wish should materialize it through runtime commands:

- `iwish register-module ...`
  - MUST auto-generate the review pack for the registered module or absorbed repo.
- `iwish generate-review-pack ...`
  - SHOULD be used for generated skills, workflows, agents, or any manually normalized capability.

This keeps the review pack consistent across:

- absorbed repos
- external skill packs
- generated skills
- generated workflows
- generated agents

## Required Sections

Every review pack MUST answer the following:

### 1. What is it

- capability or repo name
- source
- current registration state
- shape classification
- role classification

### 2. Why it exists

- what job it solves
- why I-Wish wants it
- what gap it fills

### 3. Delivery framework placement

- which phase(s) it helps
- which stage/task(s) it serves
- whether it is `process-primary`, `supportive`, or `foundational`

### 4. Input -> Process -> Output

- what inputs it expects
- how it is used in process
- what outputs it produces

### 5. Use cases

At least:

- `core use cases`
- `adjacent use cases`
- `do-not-use cases`

### 6. Edge cases / Stress cases / Constraints

This section is mandatory.

It should include:

- edge cases
- stress cases
- operational constraints
- governance constraints
- routing caveats

### 7. Agent / Workflow / Skill coordination

- which canonical agents should use it
- which workflows should call it
- which supportive skills pair well with it
- whether it should be used directly or only through a parent workflow

### 8. Orch routing hints

- trigger phrases
- anti-triggers
- preferred routing stage
- whether it should be proposed automatically or only on explicit user demand

### 9. Review questions for the user

This section is mandatory.

It should explicitly ask the user to review:

- desired use cases
- risky edge cases
- constraints or exclusions
- approval boundaries
- whether it should remain external or be promoted deeper

### 10. Example scenarios

Provide 2-4 realistic prompts or user scenarios.

## Why HTML Is Required

The `.md` file is the source-of-truth version for repo governance and diffability.

The `.html` file exists because:

- users read it more easily
- it is easier to share
- it is easier to revisit later
- it supports richer narrative and interaction

The HTML file should present:

- summary snapshot
- phase/stage mapping
- key decisions
- examples
- review prompts

## Orch Benefit

The review pack should later become a structured source for Orch to retrieve:

- stage suitability
- use-case suitability
- edge-case warnings
- tool/module pairing hints
- user-approved boundaries

This is what turns “registered module exists” into “Orch actually knows when and why to suggest it”.

## Relationship To Routing Profiles

The review pack is **not** the first source Orch should read.

For token efficiency, Orch should prefer `routing-profile.yaml` first, then open the review pack only for the shortlisted candidates.

See:

- `docs/iwish-routing-profile-standard.md`
