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
To generate the UI Spec systematically, you MUST read and rigidly obey the 5-Option Framework and extraction rules defined in: [UI Spec Protocol](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/.agent/workflows/references/create-ui-spec-protocol.md).
Do NOT attempt to run this workflow without reading the protocol!

> [!IMPORTANT]
> **DESIGN COMPLIANCE GATE CHECK (MANDATORY):**
> Right after generating the UI Spec, you MUST run the Design Compliance Scanner:
> `node .agent/scripts/design-compliance-scanner.js --spec <path-to-ui-spec.md> --design <path-to-design.md>`
> Ensure the scan passes with Exit Code 0. If it fails, you must fix all unauthorized design tokens (e.g. replacing default violet colors like `#7C3AED` with allowed tokens from `DESIGN.md` such as `#00DF9A` or `#059669`) and re-run the check. Do NOT proceed to design generation or coding with compliance violations.

<steps CRITICAL="TRUE">
1. Load target story `_iwish-output/stories/story-N.M.md`.
2. Read Feature Hierarchy `_iwish-output/2. Product Planning/2.5. feature-hierarchy.md`. Halt if missing.
3. Apply rules in UI Spec Protocol: `.agent/workflows/references/create-ui-spec-protocol.md`.
4. Call Design Consultation skill from `.agent/skills/design-consultation/SKILL.md` to audit spec.
5. Write spec to `_iwish-output/3. Development/2. Functional Design/3.2. ui-spec-story-N.M.md`.
6. Run scanner: `node .agent/scripts/design-compliance-scanner.js --spec _iwish-output/3. Development/2. Functional Design/3.2. ui-spec-story-N.M.md --design DESIGN.md`.
7. Ensure scanner passes (Exit Code 0).
</steps>
