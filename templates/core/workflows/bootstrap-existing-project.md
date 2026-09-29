---
description: 'Bootstrap an existing or brownfield project into I-Wish when PRD, epics, stories, sprint tracking, project-context, or graph indexing are missing or incomplete.'
---

# /bootstrap-existing-project

## Purpose

Provide a single I-Wish entrypoint for existing projects that were not started with the full delivery framework.

This workflow turns a partially documented or legacy codebase into an Orch-operable project by building the minimum viable source-of-truth and graph/tool setup needed for safe routing.

## When to Use

Use this when the project already exists and one or more of these are missing:

- PRD
- architecture
- epic or story files
- sprint tracking
- project-context
- graph profile
- codebase indexing or graph evidence

## Bootstrap Sequence

### 1. Assess Current State

Check whether the project already has:

- `project-context.md`
- PRD or product brief
- architecture or ADRs
- stories / epics / sprint files
- graph profile
- tool profile

Classify the project into one of 3 states:

1. `context-light`
   Has code, but little or no planning/source-of-truth.
2. `context-partial`
   Has some planning docs, but they are incomplete or stale.
3. `context-rich`
   Has meaningful artifacts, but they need normalization and graph/tool setup.

### 2. Choose Bootstrap Depth

- `light`: Create project-context and minimal story backlog only
- `standard`: Document project + generate project-context + create missing planning skeletons
- `deep`: Full brownfield documentation and graph-backed onboarding

### 3. Establish Tool and Graph Baseline

Before deeper orchestration:

- ask for graph backend selection
- ask for browser/design tools only if the near-term work requires them
- record tool selections and graph profile

### 4. Build Brownfield Understanding

Use the strongest existing supportive capabilities:

- `analyze-codebase`
- `iwish-feature-document-project`
- `iwish-feature-generate-project-context`
- `research-project-modules`

### 5. Normalize the Delivery Spine

Based on what is missing:

- create or refine a product brief / PRD if strategic intent is unclear
- create architecture if technical direction is unclear
- create epics and stories for the immediate delivery horizon
- create or update sprint tracking

### 5b. Feature Hierarchy & FeatureGraph Setup

After epics and stories exist (from Step 5), check for and generate the feature hierarchy:

- Check if `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md` (or dynamic fallback like `2.8. feature-hierarchy.md`) exists
- If MISSING: Run `iwish featuregraph-retrofit` to assess the gap, then ask the Piccolo Agent to generate feature-hierarchy.md from PRD + Architecture + Epics using the template at `templates/library/code-intelligence-pack/featuregraph/feature-hierarchy-template.md`
- If EXISTS: Validate it is not stale (compare FR count with PRD)
- Optionally run `iwish featuregraph-index` if FalkorDB is configured (from Step 3 graph setup)

> [!NOTE]
> The feature-hierarchy provides sidebar navigation context for UI Spec generation and Vegeta Story execution. Without it, agents will produce inconsistent navigation structures.

### 6. Gate Readiness

Run readiness thinking before implementation:

- `iwish-feature-check-implementation-readiness` when enough planning exists
- if still under-documented, record readiness gaps instead of pretending the project is ready

### 7. Hand Off to Mainline Delivery

After bootstrap, Orch should route into the normal spine:

- `plan`
- `make-story`
- `make-ui-spec`
- `code`
- `review`

## Outputs

- normalized brownfield bootstrap summary
- minimum viable source-of-truth
- tool and graph selections
- recommended next workflow

## Notes

- This is a supportive Orch-first bootstrap, not a replacement for planning or implementation workflows.
- For very small fixes, Orch may still choose a quick path after establishing minimal context.
