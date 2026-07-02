---
description: Generate data requirements specification from a story file using Kira Data data-architect-agent workflows
---

# /make-data-spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

<steps CRITICAL="TRUE">
1. Locate and load the target story file (e.g. `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md` or `_iwish-output/3. Development/1. Epic & Story/story-{story_id}.md`).
2. Read policy from `.agent/fragments/graph-backend-selection-policy.md`.
3. Activate data-architect-agent behavior from `.agent/agents/data-architect-agent.md`.
4. Parse data requirements.
5. Compare with Database Specification `_iwish-output/2. Product Planning/2.2. database-spec.md` if exists.
6. Save the Data Spec file:
   - For hierarchical story folders (e.g. `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/`): save as `data-spec.md` (strictly using dash `-`, not underscore `_` or any other naming like `data_spec.md` or `database-spec.md`).
   - For flat story layouts: save as `_iwish-output/stories/data-spec-story-{story_id}.md` (strictly using dash `-`, not underscore `_`).
   - **CRITICAL - OKF FRONTMATTER**: You MUST start the generated file with this exact YAML frontmatter structure to ensure Graph connectivity:
     ```yaml
     ---
     type: I-Wish Data Spec
     title: "Data Specification: Story {story_id} — {story_title}"
     description: "Data specification for Story {story_id}"
     resource: "file://{absolute_path_to_this_file}"
     tags: ["data-spec", "database"]
     timestamp: "{current_date}"
     links_to: ["_iwish-output/stories/story-{story_id}.md"] # Adjust to actual path of the parent story
     dependencies: [] # Add any dependent story IDs if applicable
     storyId: '{story_id}'
     status: 'complete'
     ---
     ```

</steps>

