---
description: Run the Creative Intelligence Piccolo (CIA) — ideate, validate, and refine features for Light & AI-Embedded alignment. Enhanced with Stitch MCP visual generation and MKT Material Capture.
---

# Creative Intelligence Workflow (Gotenks)

### 1. Pre-Visual Hardening (Idea Hardening)
- Before generating ANY visuals, you MUST activate `{project-root}/.agent/skills/idea-hardening/SKILL.md`.
- Evaluate if the visual request matches the current architectural direction.
- **YAGNI Challenge:** If the visual is purely decorative or not critical for the current story, challenge the user before generating.

### 2. Visual Routing Decision
- **IF** the goal is conceptual (layout, flow, data structure):
  - **USE:** HTML Mockups or Mermaid Diagrams.
  - **WHY:** High iteration speed, low token cost, easy for agents to "read" and edit.
- **IF** the goal is high-fidelity UI/UX validation or brand alignment:
  - **USE:** Stitch UI (StitchMCP).
  - **WHY:** Pixel-perfect validation, design system enforcement.

## Instructions
1. **Analyze Request:** Determine if the ideation needs visual support.
2. **Apply `idea-hardening` Skill:** Ensure 2-3 approaches are proposed before generation.
3. **Route Output:** Based on the strategy above, choose the most efficient format.
4. **Validate:** Cross-check with MKT materials for alignment.

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/_bmad/core/workflows/gotenks/workflow.md, READ its entire contents and follow its directions exactly!
