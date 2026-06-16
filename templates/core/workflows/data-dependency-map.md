---
description: Map cross-story and cross-epic data dependencies with visual dependency graph using Kira Data Piccolo-agent
---

# Data Dependency Map

This workflow maps all cross-story data dependencies and generates execution ordering recommendations.

> [!IMPORTANT]
> **Graph Backend Policy:** Load `.agent/fragments/graph-backend-selection-policy.md` before querying FeatureGraph or CodebaseGraph. If the selected graph profile is `lite-static`, produce a markdown/static dependency map and mark graph evidence advisory.

## Activation

1. Load the Piccolo-agent agent persona from `{project-root}/.agent/agents/Piccolo-agent.md` and apply Kira Data Piccolo-agent behavior from this workflow.
2. Load config from `{project-root}/_iwish/config.yaml`
3. Execute the workflow: `{project-root}/.agent/workflows/step-01-map.md`
