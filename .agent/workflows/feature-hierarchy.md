---
name: 'feature-hierarchy'
description: 'Generate or regenerate the Feature Hierarchy document that maps portals, features, epics, and stories for navigation context and cross-feature dependency visualization.'
---

# /feature-hierarchy

Generate or update the `feature-hierarchy.md` document — the canonical portal-level feature mapping used by FeatureGraph, UI Spec, Dev Story, and Impact Analysis workflows.

## Prerequisites

Before running this workflow, ensure:
- PRD (canonical: `2. Product Planning/2.1. product-brief-or-prd.md` or any file matching `*prd*.md` or `*product-brief*.md` via keyword/glob search) exists
- Architecture document exists (if applicable)
- Epics & Stories (canonical: `2. Product Planning/2.4. epics-and-stories.md` or any file matching `*epic*.md`, `*stories*.md` or `epics.md` via keyword/glob search) exist

> [!IMPORTANT]
> If epics and stories do not exist yet, run `/create-epics-and-stories` first — it will auto-generate the feature hierarchy as part of Step 5c.

## Execution Steps

### Step 1: Load Sources
1. Read the PRD (canonical: `2. Product Planning/2.1. product-brief-or-prd.md` or any file matching `*prd*.md` or `*product-brief*.md` resolved dynamically via keyword/glob search) to extract all Functional Requirements (FR##).
2. Read project context (`*project-context.md`) and strategy (`*product-strategy.md`) (if available) to understand the high-level vision and constraints.
3. Read Architecture (`*architecture.md` e.g. `4.1. architecture.md` or `2.0. architecture.md`) to identify portal/module structure.
4. Read UI/UX Design Specs (`3. Product Design/` or `*ui-spec.md`) if available to match navigation patterns.
5. Read Epics & Stories (canonical: `2. Product Planning/2.4. epics-and-stories.md` or any file matching `*epic*.md`, `*stories*.md` or `epics.md` resolved dynamically via keyword/glob search) to map epic→story→FR coverage.

### Step 2: Generate Feature Hierarchy
Load and follow the generation template:
```
templates/library/code-intelligence-pack/featuregraph/feature-hierarchy-template.md
```

The template produces:
- **Portal Overview** — table of all portals/modules with FR coverage
- **Per-Portal Sidebar/Menu Tree** — navigation hierarchy with FR##/E#/S#.# traceability
- **Cross-Portal Feature Summary** — shared entities, events, and cross-cutting features
- **PBAC/RBAC Access Tree** — Defines which epics/features require access control, mapped as a tree (main feature -> sub features) with default roles and drill-down config structure.

### Step 3: Save & Index
1. Save to `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md`
2. Run `iwish featuregraph-index` to populate FalkorDB (if available)
3. Run `iwish gen-dashboard` to update the dashboard Feature Graph tab

## When to Run

| Trigger | Action |
|---------|--------|
| After `/create-epics-and-stories` | Auto-generated via Step 5c |
| After `/project-expansion-review` | Mandatory regeneration |
| After `/pivot-project` (epic/plan severity) | Mandatory regeneration |
| After `/reconcile-change` with `feature_hierarchy` | Triggered by reconciliation queue |
| Manual user request | Run this workflow directly |

## Retrofit for Existing Projects

For existing projects that don't have a feature hierarchy:
```bash
iwish featuregraph-retrofit
```
This command scans the project, reports gaps, and provides a migration checklist.

## Downstream Consumers

| Consumer | How it uses Feature Hierarchy |
|----------|------------------------------|
| `/make-ui-spec` | Navigation structure source-of-truth (Hard Gate) |
| `/dev-agent-story` | Route paths, sidebar states, breadcrumbs |
| `/impact-analysis` | Portal-level feature mapping |
| `/review` (Layer 3) | Cross-story alignment validation |
| Dashboard | Feature Graph tab visualization |
| `iwish doctor` | Health check (WARN if missing) |
