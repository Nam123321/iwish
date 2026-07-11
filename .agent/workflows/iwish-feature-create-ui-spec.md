---
legacy_name: create-ui-spec
description: Generate per-story UI spec with component hierarchy, responsive
  layout, and design tokens. UX Designer agent review gate before development.
disable-model-invocation: true
---

# 🎨 `/make-ui-spec` (Create UI Spec Workflow)

> [!IMPORTANT]
> **DESIGN CONSULTATION GATE (MANDATORY):**
> Before finalizing ANY UI spec, you MUST use `view_file` to load `/.agent/skills/design-consultation/SKILL.md` and execute the Design Army Pattern (5 specialist lenses: Typography, Color, Layout, Interaction, IA). Embed the Design Consultation Report in the final spec output.
**[CRITICAL COMPLIANCE REQUIREMENT]**
To generate the UI Spec systematically, you MUST read and rigidly obey the 5-Option Framework and extraction rules defined in: [UI Spec Protocol](references/create-ui-spec-protocol.md).
Do NOT attempt to run this workflow without reading the protocol!


> [!IMPORTANT]
> **DESIGN COMPLIANCE GATE CHECK (MANDATORY):**
> Right after generating the UI Spec, you MUST run the Design Compliance Scanner:
> `node .agent/scripts/design-compliance-scanner.js --spec <path-to-ui-spec.md> --design <path-to-design.md>`
> Ensure the scan passes with Exit Code 0. If it fails, you must fix all unauthorized design tokens (e.g. replacing default violet colors like `#7C3AED` with allowed tokens from `DESIGN.md` such as `#00DF9A` or `#059669`) and re-run the check. Do NOT proceed to design generation or coding with compliance violations.

<steps CRITICAL="TRUE">
1. Locate and load the target story file. This could be in `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md`, `_iwish-output/stories/story-{story_id}.md`, or `.agent/evolution-lab/stories/story-{story_id}.md`.
2. Read Feature Hierarchy `_iwish-output/2. Product Planning/2.5. feature-hierarchy.md`. Halt if missing.
3. Apply rules in UI Spec Protocol: `.agent/workflows/references/create-ui-spec-protocol.md`.
4. Call Design Consultation skill from `.agent/skills/design-consultation/SKILL.md` to audit spec.
5. Run Socratic Debate on Platform AI's UX recommendations using `ux-agent` and `dev-agent`, and embed the outcomes into the `Platform AI Consultation & Debate Report` section.
6. Save the UI Spec file based on the parent story's location:
   - For hierarchical story folders: save as `ui-spec.md` in the same directory (strictly using dash `-`).
   - For flat story layouts (`_iwish-output/stories/`): save as `_iwish-output/stories/ui-spec-story-{story_id}.md` (strictly using dash `-`).
   - For Evolution Lab Layout (`.agent/evolution-lab/stories/`): save as `.agent/evolution-lab/stories/ui-spec-story-{story_id}.md`.
   - **CRITICAL - OKF FRONTMATTER**: You MUST start the generated file with this exact YAML frontmatter structure to ensure Graph connectivity:
     ```yaml
     ---
     type: I-Wish UI Spec
     title: "UI Specification: Story {story_id} — {story_title}"
     description: "UI specification for Story {story_id}"
     resource: "file://{absolute_path_to_this_file}"
     tags: ["ui-spec", "design"]
     timestamp: "{current_date}"
     links_to: ["<path_to_parent_story_file>"] # Adjust to actual path of the parent story
     dependencies: [] # Add any dependent story IDs if applicable
     storyId: '{story_id}'
     status: 'complete'
     ---
     ```
6.5. **[MANDATORY HTML PREVIEW GATE]**: Generate a static zero-logic HTML/CSS preview file at `_iwish-output/stories/html-preview-story-{story_id}.html` (or equivalent directory based on active layout) and prompt the user to open it in their browser for visual review. Do NOT proceed to the next step until the user approves this preview layout.
7. Run scanner on the generated UI Spec file:

   `node .agent/scripts/design-compliance-scanner.js --spec <path-to-generated-ui-spec.md> --design DESIGN.md`
8. Ensure scanner passes (Exit Code 0).
</steps>
