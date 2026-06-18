---
description: Generate data requirements specification from a story file using Kira Data data-architect-agent workflows
---

# /make-data-spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

<steps CRITICAL="TRUE">
1. Load target story `_iwish-output/stories/story-N.M.md`.
2. Read policy from `.agent/fragments/graph-backend-selection-policy.md`.
3. Activate data-architect-agent behavior from `.agent/agents/data-architect-agent.md`.
4. Parse data requirements.
5. Compare with Database Specification `_iwish-output/2. Product Planning/2.2. database-spec.md` if exists.
6. Write Data Spec to `_iwish-output/3. Development/2. Functional Design/3.3. data-spec-story-N.M.md` with OKF frontmatter.
</steps>
