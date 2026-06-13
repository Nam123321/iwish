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

