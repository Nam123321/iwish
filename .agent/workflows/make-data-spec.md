---
description: Generate data requirements specification from a story file using Kira Data data-architect-agent workflows
---

# /make-data-spec

This workflow generates a comprehensive Data Specification document for a story.

> [!IMPORTANT]
> **FeatureGraph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before graph-backed data-spec validation. If FeatureGraph is unavailable, label graph evidence unavailable and do not silently infer that no DataEntity/Event/SeedData dependency exists.

<steps CRITICAL="TRUE">
1. Locate and load the target story file. This could be in `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md`, `_iwish-output/stories/story-{story_id}.md`, or `.agent/evolution-lab/stories/story-{story_id}.md`.
2. Read policy from `.agent/fragments/graph-backend-selection-policy.md`.
3. Activate data-architect-agent behavior from `.agent/agents/data-architect-agent.md`.
4. Parse data requirements and strictly define **API Contract & DTO Specifications**:
   - MUST define the exact JSON payload structures for both Request and Response.
   - MUST define explicit type mappings at the API boundary (e.g., Prisma `Decimal` to TypeScript `number`, `DateTime` to `string`, and Nullable `?` to `| null`).
   - Output these definitions into a dedicated "API Contract & DTO Specifications" section in the data-spec.
5. Compare with Database Specification `_iwish-output/2. Product Planning/2.2. database-spec.md` if exists.
5.5. **[ZERO-TRUST AUDIT GATE]**: Before finalizing, you MUST write the spec to a temporary draft and run `python3 .agent/scripts/audit-trace-validator.py --file <path-to-draft-data-spec>`. If it exits with Code 1 (missing traceId/Audit for mutations), you MUST fix the spec and retry until it passes.
6. Save the Data Spec file based on the parent story's location:
   - For hierarchical story folders: save as `data-spec.md` in the same directory (strictly using dash `-`).
   - For flat story layouts (`_iwish-output/stories/`): save as `_iwish-output/stories/data-spec-story-{story_id}.md` (strictly using dash `-`).
   - For Evolution Lab Layout (`.agent/evolution-lab/stories/`): save as `.agent/evolution-lab/stories/data-spec-story-{story_id}.md`.
   - **CRITICAL - OKF FRONTMATTER**: You MUST start the generated file with this exact YAML frontmatter structure to ensure Graph connectivity:
     ```yaml
     ---
     type: I-Wish Data Spec
     title: "Data Specification: Story {story_id} — {story_title}"
     description: "Data specification for Story {story_id}"
     resource: "file://{absolute_path_to_this_file}"
     tags: ["data-spec", "database"]
     timestamp: "{current_date}"
     links_to: ["<path_to_parent_story_file>"] # Adjust to actual path of the parent story
     dependencies: [] # Add any dependent story IDs if applicable
     storyId: '{story_id}'
     status: 'complete'
     ---
     ```

</steps>

