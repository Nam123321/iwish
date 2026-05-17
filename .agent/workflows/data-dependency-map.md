---
description: Map cross-story and cross-epic data dependencies with visual dependency graph using Kira Data Piccolo
---

# Data Dependency Map

This workflow maps all cross-story data dependencies and generates execution ordering recommendations.

> [!IMPORTANT]
> **Graph Backend Policy:** Load `.agent/fragments/graph-backend-selection-policy.md` before querying FeatureGraph or CodebaseGraph. If the selected graph profile is `lite-static`, produce a markdown/static dependency map and mark graph evidence advisory.

## Activation

1. Load the Piccolo agent persona from `{project-root}/.agent/agents/piccolo.md` and apply Kira Data Piccolo behavior from this workflow.
2. Load config from `{project-root}/_bmad/bmm/config.yaml`
3. Execute the workflow: `{project-root}/_bmad/bmm/workflows/3-solutioning/data-dependency-map/workflow.md`
