---
description: Generate data requirements specification from a story file using Kira Data data-Piccolo-agent workflows
---

# /make-data-spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

## Activation

1. Load the data-Piccolo-agent persona from `{project-root}/.agent/agents/data-Piccolo-agent.md` and apply Kira Data data-Piccolo-agent behavior from this workflow.
2. Load config from `{project-root}/_iwish/delivery/workflows/4-implementation/make-data-spec/workflow.yaml` (if project mode) or fall back to template defaults.
3. Execute the workflow: `{project-root}/.agent/workflows/step-01-init.md`
