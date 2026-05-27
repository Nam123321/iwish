---
description: Generate data requirements specification from a story file using Kira Data architect-agent workflows
---

# Create Data Spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

## Activation

1. Load the architect-agent agent persona from `{project-root}/.agent/agents/architect-agent.md` and apply Kira Data architect-agent behavior from this workflow.
2. Load config from `{project-root}/_iwish/bmm/config.yaml`
3. Execute the workflow: `{project-root}/.agent/workflows/step-01-init.md`
