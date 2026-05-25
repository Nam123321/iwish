# I-Wish Graph Backend Selection and Adapter Contract

## Decision

I-Wish graph intelligence is project-scoped. A project should choose a graph profile during init/readiness and store that choice in project configuration or project memory.

FalkorDB remains the recommended full-mode default because current CodeGraphContext and FeatureGraph materials already align around FalkorDB. The default must still be explicit, because some projects need a lower-setup mode or a custom backend.

## Profiles

| Profile | Use When | Required Behavior |
|---|---|---|
| `falkordb-full` | Full I-Wish project, multi-agent implementation, HSEA/self-evolution, FeatureGraph validation | CodebaseGraph, FeatureGraph, and MemoryGraph should run on FalkorDB-backed or compatible graph services |
| `lite-static` | Small/offline/discovery projects | Markdown/static indexes and shell search are allowed; graph evidence is advisory |
| `custom-adapter` | User already has graph infrastructure | Backend must pass the adapter evaluation before trusted use |

Legal and data-handling posture:

- `falkordb-full`: keep graph data project-local by default; review backup, retention, access-control, and private-source rules before sharing graph services across users or projects.
- `lite-static`: has the lowest extra infrastructure and data movement, but generated indexes/memory snapshots still need review before committing or exporting.
- `custom-adapter`: requires explicit license, hosting, retention, export/deletion, and access-control review before trusted use.

## Recommendation Criteria

Recommend `falkordb-full` when the project has any of these:

- long-lived product development;
- multi-agent implementation/review loops;
- FeatureGraph data-spec validation;
- MemoryGraph provenance or HSEA learning loops;
- evolution lab scoring, lineage, or candidate context selection;
- team sharing or sprint-level graph freshness requirements.

Recommend `lite-static` when the project has any of these:

- small repo or early exploration;
- no Docker/service runtime available;
- offline-only work;
- graph intelligence is useful but not blocking.

Recommend `custom-adapter` only when the user can provide backend details and accepts adapter evaluation.

## Adapter Contract

Every backend must declare support for these surfaces:

| Surface | Minimum Trusted Operations |
|---|---|
| CodebaseGraph | callers, callees, call chains, symbol/file search, changed-file update, health, freshness check, export/rebuild, degraded-mode status |
| FeatureGraph | feature impact, cross-feature relationships, DataEntity/Event/SeedData query and update, data-spec validation, namespace health, artifact freshness, export/import or rebuild, degraded-mode status |
| MemoryGraph | project memory nodes, memory admission updates, provenance/lineage links, confidence/sensitivity/staleness, read/write health, memory freshness, export/import lineage context, degraded-mode status |

Partial support is allowed only when explicit:

```yaml
graph_profile: custom-adapter
graph_surfaces:
  codebasegraph: custom-adapter
  featuregraph: lite-static
  memorygraph: falkordb-full
graph_backend_status:
  health: partial
  unsupported_surfaces:
    - featuregraph
```

## Custom Backend Evaluation

Outcome values:

- `pass`: trusted for declared surfaces.
- `partial`: trusted only for declared supported surfaces.
- `experimental`: advisory only.
- `fail`: not used; choose fallback.

Required checks:

- health command exists;
- freshness/staleness command exists;
- read operations exist for declared surfaces;
- write/update operations exist for declared surfaces where workflows require them;
- export/import or rebuild path exists;
- MemoryGraph sensitivity/private-source policy exists;
- failures are explicit, logged, and non-silent.

## Graph-Unavailable Rule

If a graph surface is unavailable, workflows must say:

```text
graph_status: unavailable
surface: <codebasegraph|featuregraph|memorygraph>
meaning: graph evidence unavailable, not no-impact/no-dependency
fallback: <approved fallback path>
```

Blocking rule:

- Advisory graph checks may continue with fallback.
- Story or workflow requirements that explicitly require graph-indexed validation must block until the graph surface is healthy or the user approves a documented exception.

## Init Prompt

```text
Select graph intelligence profile:
1. falkordb-full (recommended for full I-Wish, multi-agent, HSEA, FeatureGraph validation)
2. lite-static (recommended for small/offline/low-setup projects)
3. custom-adapter (I-Wish evaluates before trusting)
```

Default:

- Full I-Wish/HSEA/FeatureGraph mode: `falkordb-full`.
- Small/source/offline mode: `lite-static`.

If the project wants a runtime-side mirror outside canonical repo config or project memory, use:

```text
${IWISH_HOME}/profiles/<profile-id>/projects/<project-slug>/runtime-config/graph-profile.yaml
```

## Related Assets

- `.agent/fragments/graph-backend-selection-policy.md`
- `.agent/workflows/analyze-codebase.md`
- `.agent/workflows/codebase-health.md`
- `templates/library/code-intelligence-pack/featuregraph/README.md`
- `_iwish-output/knowledge/codegraph-integration-key-learnings.md`
