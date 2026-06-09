# Feature Hierarchy Generation Template

> This template provides the canonical structure for `feature-hierarchy.md`. 
> It is referenced by Step 5c of `step-04-final-validation.md` and by `iwish featuregraph-retrofit`.

---

## Document Header

```markdown
# Feature Hierarchy Per Portal — {PROJECT_NAME}

**Author:** Architect + PM Agent (delegated by I-Wish)
**Date:** {YYYY-MM-DD}
**Source Documents:** [prd.md]({path_to_prd}), [architecture.md]({path_to_architecture}), [epics.md]({path_to_epics})

---

> [!NOTE]
> Each feature node includes: FR reference, Epic/Story mapping, Phase (MVP/Growth/Vision), and Tier requirement. Navigation patterns follow the Architecture specification.

---
```

## Section 1: Portal Overview Table

```markdown
## Portal Overview

| # | Portal | Tech Stack | Platform | Primary Users | Navigation |
|---|--------|-----------|----------|---------------|------------|
| 1 | **{Portal Name}** | {Tech stack} | {Platform} | {Primary users} | {Navigation pattern} |
| 2 | ... | ... | ... | ... | ... |
```

**Data Sources:**
- Portal definitions → Architecture doc `## Portals` or `## System Components` section
- Tech Stack → Architecture doc per-portal specifications
- Primary Users → PRD `## Target Users` + Architecture portal user mapping
- Navigation → Architecture doc or UX Design Specification (`3. Product Design/` or `ui-spec.md`)
- High-level constraints → `1. Project Context/project-context.md` and `2. Product Planning/2.2. product-strategy.md`

## Section 2: Per-Portal Sidebar/Menu Tree

For EACH portal defined in the Architecture, generate a sidebar tree:

```markdown
## {N}. {Portal Name}

**Users:** {Primary user roles}
**Design Direction:** {Design pattern if defined in UX spec}
**UX Pattern:** {UX reference if defined}

### Sidebar Menu Tree

{PORTAL_EMOJI} {Portal Name}
│
├── {GROUP_EMOJI} {Menu Group Name}
│   ├── {Feature Name}                                  {FR##} │ {E#/S#.#} │ {Phase} │ {Tier}
│   ├── {Sub-Feature Name}                              {FR##} │ {E#/S#.#} │ {Phase} │ {Tier}
│   │   ├── {Detail Feature}                            {FR##} │ {E#/S#.#} │ {Phase} │ {Tier}
│   │   └── {Detail Feature}                            {FR##} │ {E#/S#.#} │ {Phase} │ {Tier}
│   └── {Feature Name}                                  {FR##} │ {E#/S#.#} │ {Phase} │ {Tier}
│
├── {GROUP_EMOJI} {Next Menu Group}
│   ├── ...
│   └── ...
│
└── ⚙️ Settings / Account
    └── ...
```

**Format Rules:**
- Each line format: `Feature Name    FR## │ E#/S#.# │ Phase │ Tier`
- FR##: Functional Requirement ID from PRD
- E#/S#.#: Epic number / Story number mapping
- Phase: `MVP`, `Growth`, or `Vision`
- Tier: `Free`, `Starter`, `Pro`, `Enterprise` (or project-specific tiers)
- Use tree characters: `├──`, `│`, `└──` for hierarchy
- Use emojis for menu groups: 📊 Dashboard, 📦 Products, 🛒 Orders, 👥 Users, ⚙️ Settings, etc.

**Data Sources:**
- Feature names → PRD FRs grouped by functional area
- Menu grouping → Architecture navigation structure
- Phase → PRD `Phase` field per FR
- Tier → PRD `Tier` or priority field per FR
- Epic/Story mapping → Epics document FR references in story ACs

## Section 3: Cross-Portal Feature Summary

```markdown
## Cross-Portal Feature Summary

### Feature Distribution

| Portal | Total Features | MVP | Growth | Vision |
|--------|---------------|-----|--------|--------|
| {Portal 1} | {N} | {N} | {N} | {N} |
| {Portal 2} | {N} | {N} | {N} | {N} |
| **Total** | **{N}** | **{N}** | **{N}** | **{N}** |

### Tier Distribution

| Portal | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| {Portal 1} | {N} | {N} | {N} | {N} |
| ... | ... | ... | ... | ... |

### Shared Features (Cross-Portal)

| Feature | FR# | Portals | Notes |
|---------|-----|---------|-------|
| {Shared Feature Name} | FR## | {Portal A}, {Portal B} | {How it differs per portal} |
| ... | ... | ... | ... |
```

---

## Edge Case Variants

### Single-Portal (SPA) Variant

If the project has no multi-portal concept, use this simplified structure:

```markdown
## App Feature Hierarchy

### Navigation Tree

🖥️ {App Name}
│
├── {Feature Area 1}
│   ├── {Feature}                                       FR## │ E#/S#.# │ MVP │ Free
│   └── ...
│
├── {Feature Area 2}
│   └── ...
```

### Legacy Compatibility (No FR IDs)

If the PRD doesn't use FR## identifiers, map by Epic:

```markdown
[LEGACY-COMPAT] Feature hierarchy generated from Epic titles. 
Run `/create-prd` with FR numbering to upgrade to full traceability.

├── {Feature}                                           Epic {N} │ S{N}.{M} │ {Phase}
```

---

## Downstream Consumers

This document is consumed by:
1. **FeatureGraph Indexer** (`featuregraph-indexer.sh`) — Creates Portal nodes + DISPLAYED_ON edges
2. **UI Spec Generation** (`create-ui-spec-protocol.md`) — Navigation context for sidebar placement
3. **Dev Story Execution** (`instructions.xml`) — Feature placement + route paths
4. **Impact Analysis** (`impact-analysis.md`) — Fallback when FalkorDB unavailable
5. **MKT Capture Pipeline** (`mkt-capture-pipeline.md`) — Enriches with visual_spec_url
6. **Stitch Design Directions** (`step-09-design-directions.md`) — Feature context injection

Any changes to this document should trigger: `iwish featuregraph-index` + `iwish gen-dashboard`
