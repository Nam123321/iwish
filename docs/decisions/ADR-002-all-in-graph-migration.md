# ADR-002: ALL-IN Graph Migration — FeatureGraph + CodeGraph as Single Source of Truth

- **Status:** Approved
- **Date:** 2026-04-01
- **Supersedes:** ADR-001 (extends, does not invalidate)
- **Decision By:** Master Roshi + User consensus

## Context

ADR-001 established a 2-Tier data workflow with markdown dependency maps. Analysis showed:
- FeatureGraph already had `DataEntity` nodes and 6 MCP tools in FalkorDB
- Markdown-based queries cost ~1500 tokens vs FeatureGraph query ~150 tokens (**90% savings**)
- `/fix-bug` and `/impact-analysis` already used FeatureGraph exclusively
- Maintaining dual systems (markdown + graph) creates staleness risk

## Decision

**Replace ALL markdown-based dependency map queries/updates with FeatureGraph + CodeGraph.**

### What Changed (from ADR-001)

| Component | ADR-001 | ADR-002 |
|-----------|---------|---------|
| Data-spec validation source | `{output_folder}/data-specs/*.md` | FeatureGraph `DataEntity` nodes |
| Event flow tracking | `cross-epic-dependency-map.md` | FeatureGraph `Event` nodes |
| Code-review step 7 query | Grep markdown files | Cypher: `MATCH (s:Story)-[:USES_ENTITY]->(de)` |
| Backward update target | Edit markdown file | `add_data_entity()` MCP tool |
| Step-04b primary output | Markdown files | FeatureGraph nodes |

### FeatureGraph Schema Extensions

New node types: `Event`, `SeedData`
New relationships: `PRODUCES`, `CONSUMES`, `HAS_SEED`
New MCP tools: `add_data_entity` (Tool 7), `add_event` (Tool 8), `add_seed_data` (Tool 9)

### Dual-Graph Freshness Protocol

| Layer | CodeGraph | FeatureGraph |
|-------|-----------|-------------|
| L1 Auto-watch | ✅ `ENABLE_AUTO_WATCH` | N/A |
| **L2 Per-workflow** | `add_code_to_graph()` | **`add_data_entity()` / `add_event()` / `add_seed_data()`** |
| L3 Full re-index | `cgc index --force` | `featuregraph-indexer.sh` |
| L4 Validate | `/codebase-health` | `featuregraph-validate.sh` |

**L2 Update Points:**
- `step-03` → Tier 1 tags (read-only)
- `step-04b` → Write DataEntity + Event + SeedData to FeatureGraph
- `/create-data-spec` → Update DataEntity per-story
- `/code-review` step 7 → Query for validation
- `/code-review` step 8 → Backward update via MCP tools
- `/fix-bug` step 16c → Tier-based graph sync

### Graceful Degradation

All FeatureGraph-dependent steps MUST check tool availability first:
- Available → Use FeatureGraph queries/updates
- Unavailable → Log WARNING, skip data validation, continue workflow
- NEVER crash or block workflow due to FalkorDB being offline

## Consequences

- Single source of truth for all data architecture information
- 80-95% token savings per data-spec query
- No more stale markdown files
- FalkorDB becomes required infrastructure for full data validation
- Markdown dep-maps become optional human-readable exports (not source of truth)
