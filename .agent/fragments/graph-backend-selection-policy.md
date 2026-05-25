# Graph Backend Selection Policy

## Purpose

BMAD uses graph intelligence across three surfaces:

- `CodebaseGraph`: code symbols, imports, call chains, dead-code and blast-radius analysis.
- `FeatureGraph`: features, data entities, events, seed data, cross-feature impact, and workflow validation.
- `MemoryGraph`: project memory, learning provenance, capability lineage, and evolution context selection.

Every BMAD project must treat graph backend selection as a project architecture decision, not a hidden user preference.

## Graph Profiles

| Profile | Recommendation | Required Runtime | Best Fit | Trade-Off | Legal / Data Handling |
|---|---|---|---|---|---|
| `falkordb-full` | Recommended full BMAD mode | FalkorDB plus CodeGraphContext/FeatureGraph tooling | Long-lived projects, multi-agent execution, self-evolution, cross-feature data validation | Requires Docker/service health, backups, and freshness checks | Keep graph data project-local by default; review retention, backup, and private-source policy before team sharing |
| `lite-static` | Recommended low-setup mode | Markdown/static indexes and shell search | Small repos, offline work, early discovery, demos | Lower recall, weaker graph queries, advisory-only graph evidence | Lowest extra data movement; still avoid committing private memory/provenance snapshots unless approved |
| `custom-adapter` | Advanced/experimental | User-provided backend adapter | Teams with existing graph infra | Must pass adapter contract before trusted use | Requires license, hosting, access-control, retention, export, and deletion review before trusted use |

Default rule:

- If the project enables HSEA, evolution lab, FeatureGraph data validation, or multi-agent implementation workflows, recommend `falkordb-full`.
- If the project is small, offline, exploratory, or cannot run services, recommend `lite-static`.
- If the user brings another graph solution, use `custom-adapter` only after adapter evaluation.

## Project Persistence

The selected profile must be stored in project-scoped configuration or project memory, not in user preference memory.

Recommended keys:

```yaml
graph_profile: "falkordb-full" # falkordb-full | lite-static | custom-adapter
graph_surfaces:
  codebasegraph: "falkordb-full"
  featuregraph: "falkordb-full"
  memorygraph: "falkordb-full"
graph_backend_status:
  health: "unknown" # healthy | stale | offline | partial | unknown
  last_checked_at: null
```

If the project also persists a runtime-side mirror outside canonical repo config, use:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/runtime-config/graph-profile.yaml
```

`USER.md` may remember that a user prefers low-setup tools, but it must not override a project's selected graph architecture.

## Adapter Contract

A backend is trusted only for the graph surfaces it explicitly supports.

### CodebaseGraph Requirements

- Query callers, callees, call chains, file symbols, and text/symbol search.
- Update changed files after dev-story and fix-bug flows.
- Report freshness using graph file count versus filesystem file count with shared ignore rules.
- Export or rebuild graph state for migration/recovery.
- Provide health status: `healthy`, `stale`, `offline`, `partial`, or `unknown`.
- Report degraded mode with the fallback used and affected query type.
- Report unavailable evidence without claiming no impact.

### FeatureGraph Requirements

- Query feature impact and cross-feature relationships.
- Query and update DataEntity, Event, SeedData, and feature relationship nodes.
- Validate PRD/epic/story data-spec consistency.
- Provide health status for the FeatureGraph namespace/keyspace.
- Report freshness for feature/story/spec ingestion, including last indexed artifact or timestamp.
- Export/import or rebuild feature graph state for migration/recovery.
- Report degraded mode with the fallback used and affected feature/data validation.
- Distinguish absent graph tooling from "no dependency found."
- Support isolated featuregraph keyspace or equivalent namespace.

### MemoryGraph Requirements

- Store project-scoped memory nodes and relationships.
- Update memory admission, superseded/stale state, and source relationships.
- Store provenance links for generated skills, workflows, agents, and evolution candidates.
- Track confidence, sensitivity, stale/superseded state, and source refs.
- Provide health status for memory read/write operations.
- Report freshness for project memory and provenance lineage.
- Block private/security-sensitive sources from automatic promotion/evolution unless curator-approved.
- Export/import lineage/provenance enough to recreate candidate context.
- Report degraded mode when memory retrieval, admission scoring, or lineage lookup is advisory-only.

## Custom Adapter Evaluation

Custom backends must be evaluated as:

- `pass`: supports all required operations for declared surfaces.
- `partial`: supports only some surfaces; unsupported surfaces must use fallback.
- `experimental`: usable for advisory context only; not trusted for blocking validation.
- `fail`: cannot be used; fall back to `lite-static` or `falkordb-full`.

Evaluation checklist:

- Health check command exists.
- Freshness/staleness check exists.
- Read operations exist for declared graph surfaces.
- Write/update operations exist for declared graph surfaces.
- Export/import or rebuild path exists.
- Security/sensitivity policy exists for MemoryGraph sources.
- Failure mode is explicit and non-silent.

## Graph-Unavailable Policy

When graph tooling is offline, stale, missing, or unsupported:

- Log `graph_status` and affected surface.
- Use the approved fallback path for the selected profile.
- Treat graph evidence as unavailable, not as proof of no dependency/no impact.
- Keep advisory workflows non-blocking when the graph is optional.
- Block workflows only when the story, AC, or workflow explicitly requires graph-indexed validation.

## Init/Readiness Prompt

During project init or readiness check, BMAD should ask once:

```text
Select graph intelligence profile:
1. falkordb-full (recommended for long-lived BMAD, multi-agent, self-evolution, FeatureGraph validation)
2. lite-static (recommended for small/offline/low-setup projects)
3. custom-adapter (provide backend details; BMAD will evaluate before trusting it)
```

If the user presses Enter:

- Default to `falkordb-full` when BMAD full mode, FeatureGraph, MemoryGraph, or HSEA is enabled.
- Default to `lite-static` for source/template, small, or offline-only mode.
