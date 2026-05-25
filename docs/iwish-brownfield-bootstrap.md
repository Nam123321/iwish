# I-Wish Brownfield Bootstrap

Generated: 2026-05-16

## Problem

Many teams install I-Wish into an already-running project.

That project may have:

- no PRD
- no architecture doc
- no stories or sprint tracking
- no `project-context.md`
- no graph profile
- no codebase indexing

If Orch treats that project like a fully prepared greenfield workspace, routing quality drops fast.

## Recommended I-Wish Flow

### 1. Classify the project

Orch should first decide whether the project is:

- `context-light`
  Code exists, but almost no planning/source-of-truth exists.
- `context-partial`
  Some planning exists, but it is incomplete, inconsistent, or stale.
- `context-rich`
  Good artifacts exist, but they need normalization into I-Wish routing and graph/tool setup.

### 2. Establish minimum operating context

Before mainline execution, Orch should ensure:

- graph backend is selected
- basic tool profile exists
- `project-context.md` exists or is generated
- the project has at least a minimal story or work-item surface for the next work horizon

### 3. Use the strongest existing supportive capabilities

Current repo capabilities that already help here:

- `analyze-codebase`
  CodebaseGraph / architecture discovery
- `bmad-bmm-document-project`
  Brownfield documentation generation
- `bmad-bmm-generate-project-context`
  Extract conventions and rules into `project-context.md`
- `research-project-modules`
  Decide which library/module packs matter for the project
- `bmad-bmm-check-implementation-readiness`
  Gate whether the project is truly ready for implementation or still missing critical artifacts

### 4. Normalize only what is necessary

I-Wish should not force every legacy project through a full greenfield planning ceremony.

Instead:

- if intent is unclear, create/refine brief or PRD
- if technical direction is unclear, create architecture
- if immediate work is unclear, create stories for the next delivery horizon
- if implementation is underway, create minimum viable sprint/story tracking around the active change

### 5. Hand off into the mainline spine

Once the minimum source-of-truth is present, Orch can move the project into:

- `plan`
- `make-story`
- `make-ui-spec`
- `code`
- `review`

## Comparison with BMAD Method Upstream

Upstream BMAD Method already has a clear brownfield idea:

- `bmad-document-project`
- `bmad-generate-project-context`
- optional `project-context.md`
- brownfield guide recommending large-context analysis for existing codebases

But upstream is still more document-first than graph-first.

That means BMAD Method handles the edge case mainly by:

1. documenting the existing project
2. generating project context
3. then re-entering the standard planning or quick-dev path

I-Wish should go further by adding:

1. explicit graph backend selection
2. source-of-truth classification (`context-light`, `context-partial`, `context-rich`)
3. Orch routing that knows when the project is under-documented
4. minimal viable story/sprint normalization rather than assuming fully prepared docs

## Current Gap

The repo already had most of the building blocks, but not one clear Orch entrypoint for this case.

This is why `bootstrap-existing-project` is added as the dedicated supportive workflow, while `pivot-project` handles change-navigation after viable context already exists.
