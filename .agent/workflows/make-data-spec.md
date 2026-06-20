---
description: Generate data requirements specification from a story file using Kira Data data-architect-agent workflows
---

# /make-data-spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

<steps CRITICAL="TRUE">
1. Locate and load the target story file (e.g. `_iwish-output/stories/Epic-{epic_id}/Story-{story_id}/story.md` or `_iwish-output/stories/story-{story_id}.md`).
2. Read policy from `.agent/fragments/graph-backend-selection-policy.md`.
3. Activate data-architect-agent behavior from `.agent/agents/data-architect-agent.md`.
4. Parse data requirements.
5. Compare with Database Specification `_iwish-output/2. Product Planning/2.2. database-spec.md` if exists.
6. Save the Data Spec file in the same directory as the target story file:
   - For hierarchical story folders (e.g. `_iwish-output/stories/Epic-{epic_id}/Story-{story_id}/`): save as `database-spec.md`.
   - For flat legacy story files: save as `_iwish-output/stories/data-spec-story-{story_id}.md`.
   Ensure it includes standard OKF frontmatter.
</steps>

