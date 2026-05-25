---
description: Run cross-epic data overview to generate architectural data blueprint (models, events, dependencies) across all epics. Runs once after create-epics-and-stories completes.
---

# Create Data Overview (Cross-Epic)

This workflow generates a cross-epic data architecture overview — running **once** after all epics and stories are created. It uses Tier 1 tags (`[DATA:]`, `[FLOW:]`, `[SEED:]`, `[KB-SYNC:]`) from Tier 1 Lite Scan as input.

> **ADR Reference:** See `docs/decisions/ADR-001-data-workflow-architecture.md` for the full decision rationale.

## When to Run
- **After** `/create-epics-and-stories` completes (Phase 3)
- **Before** starting Phase 4 implementation per-story
- Only needs to run **once** per project planning cycle

## What It Produces
- `{output_folder}/data-specs/cross-epic-dependency-map.md` — model + event flow diagram
- `{output_folder}/data-specs/{epic-key}-data-overview.md` — per-epic model overview
- `{output_folder}/test-specs/test-strategy-matrix.md` — test coverage matrix

## Activation

1. Load the Kira++ Data Architect agent from `{project-root}/.agent/agents/data-architect.md`
2. Load the Shinji Data Strategist agent from `{project-root}/.agent/agents/data-strategist.md`
3. Load config from `{project-root}/_bmad/bmm/config.yaml`
4. Execute the full Tier 2 analysis: `{project-root}/.agent/workflows/step-04b-data-and-test-spec.md`

## Relationship to Per-Story Data Spec
- This workflow = **macro** (architectural blueprint, cross-epic dependencies)
- `/create-data-spec` = **micro** (detailed per-story schema, runs in Phase 4)
- Per-story data-spec MUST reference this cross-epic map to detect conflicts
