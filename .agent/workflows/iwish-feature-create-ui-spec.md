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
0. **[IMMUTABLE FILE PATTERN - HARD GATE]**: Before performing any generation, you MUST run a shell command to create an empty read-only placeholder for the final spec to prevent accidental direct writes.
   `touch <path-to-ui-spec.md> && chmod 444 <path-to-ui-spec.md>`
   If you try to bypass the script and write directly to `ui-spec.md`, the OS will reject it with `Permission denied`. You MUST use the `ui-spec-draft.md` pattern.
1. Locate and load the target story file. This could be in `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md`, `_iwish-output/stories/story-{story_id}.md`, or `.agent/evolution-lab/stories/story-{story_id}.md`.
2. Read Feature Hierarchy `_iwish-output/2. Product Planning/2.5. feature-hierarchy.md`. Halt if missing.
3. Apply rules in UI Spec Protocol: `.agent/workflows/references/create-ui-spec-protocol.md`.
4. Call Design Consultation skill from `.agent/skills/design-consultation/SKILL.md` to audit spec.
5. Run Socratic Debate on Platform AI's UX recommendations using `ux-agent` and `dev-agent`, and embed the outcomes into the `Platform AI Consultation & Debate Report` section.
5.5. **[CONTINUOUS UX DISCOVERY GATE (SBUP)]**:
   - During the generation of the UI Spec, if the `ux-guardian` or Design Consultation reveals a novel UI component, layout pattern, or complex interaction behavior (e.g., a new filter builder, multi-step wizard, custom drag-and-drop hierarchy) that is NOT already standardized in the global `DESIGN.md`, you MUST trigger the Structured Behavioral Update Process (SBUP).
   - Log this as a "Candidate UX Pattern" inside the spec and propose updating the global `DESIGN.md` (or `project-context.md`) to standardize it for future reuse.
6. **[MANDATORY HTML PREVIEW GATE]**: Generate a static zero-logic HTML/CSS preview file at `html-preview-story-{story_id}.html` (in the same directory where the UI spec will go) and prompt the user to open it in their browser for visual review. Do NOT proceed to the next step until the user approves this preview layout.

6.1. **[SEMANTIC AST LAYOUT GENERATION]**: Immediately after the user approves the HTML Preview, you MUST parse the visual structure and generate a strict Semantic Layout AST JSON file at `ast-constraint-story-{story_id}.json`.
   - This JSON must map the approved HTML into structural zones to serve as an architectural law for the Dev-Agent.
   - **Supported Primitives:** `HStack`, `VStack`, `Flex`, `ZStack` (for explicit overlapping), `GridArea` (for 2D layouts), and `ResponsiveZone` (for breakpoint mutations).
   - **Semantic Tagging:** Each node must explicitly state its semantic intent to avoid semantic downgrade (e.g., `{ type: 'VStack', as: 'section', role: 'region' }`).
   - **Governed Escape Hatches:** If the layout requires complex/irregular CSS that cannot be expressed purely by layout primitives, you may insert a `CustomLayoutNode`. Any `CustomLayoutNode` MUST include an `annotation` field explaining the necessity for manual CSS.
   - Embed a reference to this JSON inside the UI Spec Draft.

6.2. **[DETERMINISTIC AST JSON MANIFEST]**: The `ast-constraint-story-{story_id}.json` MUST follow this deterministic structure, mapping UI elements to `data-testid` or `required_fields`, bounded by Component file scope (`file`), and optionally hierarchical (`children`).
   - The `data-testid` and `required_fields` will be evaluated by `spec-compliance-checker.py` as a Category A script check.
   - Example format:
   ```json
   {
     "TopicHeader": {
       "file": "components/TopicHeader.tsx",
       "data-testid": "topic-header",
       "required_fields": ["topic-title", "privacy-icon", "more-options-btn"]
     },
     "CreateTopicModal": {
       "file": "components/CreateTopicModal.tsx",
       "data-testid": "create-topic-modal",
       "children": [
         { "data-testid": "topic-name-input" },
         { "data-testid": "privacy-toggle" }
       ]
     }
   }
   ```

6.3. **[AST CONSTRAINT CLEAN-UP RULE]**: Ensure the UI spec includes an instruction for the `dev-agent` to configure Vite/Babel plugin (e.g. `babel-plugin-jsx-remove-data-test-id` or Vite `esbuild` drop rules) to automatically strip `data-testid` from the DOM during production builds to maintain zero runtime bloat.
6.5. **[STRICT GATE GUARDIAN]** Save the UI Spec Draft:
   - **DO NOT save directly as `ui-spec.md`**. You MUST save the file as a draft: `ui-spec-draft.md` (or `ui-spec-draft-story-{story_id}.md` for flat layouts).
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
   - After saving the draft, you MUST execute the finalizer script to promote it:
     `node .agent/scripts/finalize-ui-spec.js --story={story_id} --draft=<path-to-draft> --out=<path-to-final-ui-spec>`
   - The script will physically verify that the HTML file exists. If it does not, the script will DELETE your draft and abort.
7. Run scanner on the generated UI Spec file:

   `node .agent/scripts/design-compliance-scanner.js --spec <path-to-generated-ui-spec.md> --design DESIGN.md`
8. Ensure scanner passes (Exit Code 0).
</steps>
