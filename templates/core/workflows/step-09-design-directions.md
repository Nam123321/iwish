# Step 9: Design Direction Mockups

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input

- 📖 CRITICAL: ALWAYS read the complete step file before taking any action - partial understanding leads to incomplete decisions
- 🔄 CRITICAL: When loading next step with 'C', ensure the entire file is read and understood before proceeding
- ✅ ALWAYS treat this as collaborative discovery between UX facilitator and stakeholder
- 📋 YOU ARE A UX FACILITATOR, not a content generator
- 💬 FOCUS on generating and evaluating design direction variations
- 🎯 COLLABORATIVE exploration, not assumption-based design
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- ⚠️ Present A/P/C menu after generating design direction content
- 💾 Generate HTML visualizer for design directions
- 📖 Update output file frontmatter, adding this step to the end of the list of stepsCompleted.
- 🚫 FORBIDDEN to load next step until C is selected

## COLLABORATION MENUS (A/P/C):

This step will generate content and present choices:

- **A (Advanced Elicitation)**: Use discovery protocols to develop deeper design insights
- **P (Party Mode)**: Bring multiple perspectives to evaluate design directions
- **C (Continue)**: Save the content to the document and proceed to next step

## PROTOCOL INTEGRATION:

- When 'A' selected: Read fully and follow: {project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml
- When 'P' selected: Read fully and follow: {project-root}/_bmad/core/workflows/party-mode/workflow.md
- PROTOCOLS always return to this step's A/P/C menu
- User accepts/rejects protocol changes before proceeding

## CONTEXT BOUNDARIES:

- Current document and frontmatter from previous steps are available
- Visual foundation from step 8 provides design tokens
- Core experience from step 7 informs layout and interaction design
- **Design System from Layer 1** provides the component library and visual tokens
- **Stitch MCP tools** are available for generating real UI screens
- Focus on exploring different visual design directions using the **5-Option Framework**

## STITCH MCP + NANO BANANA PRO INTEGRATION:

This step uses the **Flash → Nano Banana Pro pipeline** for ≥3 of the 5 options:
1. Generate initial screens with **Gemini Flash** (fast draft): `mcp_StitchMCP_generate_screen_from_text`
2. Polish with **Nano Banana Pro** (quality redesign): `mcp_StitchMCP_edit_screens` with `modelId: GEMINI_3_PRO`
3. Create variants: `mcp_StitchMCP_generate_variants`

**Context Injection (MANDATORY for every Stitch call):**
```
Product: {project_name} — {project_description}
Portal: {portal_name}
PRD Context: {prd_executive_summary}
Feature: {feature_hierarchy_path}
Persona: {persona_name} — {tech_level}, {device}
Design System: {color_mode}, {primary_color}, {font}, {effects}
Design Direction: {chosen_direction_from_earlier_steps}
Must Include: {specific_ui_elements}
```

## YOUR TASK:

Generate **5 distinct design direction options** using the 5-Option Framework. At least 3 options MUST be created with Stitch MCP + Nano Banana Pro.

## 5-OPTION DESIGN DIRECTIONS SEQUENCE:

### 1. Generate 5 Design Direction Options

Create diverse visual explorations using the 5-Option Framework:

| Option | Method | Description |
|--------|--------|-------------|
| **Option 1** | Stitch Flash → Nano Banana Pro | Dark variant — glassmorphism + neon accents |
| **Option 2** | Stitch Flash → Nano Banana Pro | Light variant — clean design + soft shadows |
| **Option 3** | Stitch Flash → Nano Banana Pro | Hybrid variant — dark sidebar + light content |
| **Option 4** | `generate_image` AI mockup | High-fidelity static mockup |
| **Option 5** | HTML/CSS prototype | Interactive live prototype |

**For each Stitch option (1-3):**
1. Call `mcp_StitchMCP_generate_screen_from_text` with context injection (Flash draft)
2. Call `mcp_StitchMCP_edit_screens` with `modelId: GEMINI_3_PRO` (Nano Banana Pro polish)
3. Store screen IDs for comparison

### 2. Present 5-Option Comparison Table

Guide evaluation with structured comparison:
"Here are your 5 design direction options:

| Criteria | Opt 1 (Dark NB) | Opt 2 (Light NB) | Opt 3 (Hybrid NB) | Opt 4 (AI Image) | Opt 5 (HTML) |
|----------|-----------------|-------------------|---------------------|------------------|--------------|
| Visual Impact | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| PRD Alignment | ? | ? | ? | ? | ? |
| Persona Fit | ? | ? | ? | ? | ? |
| Accessibility | ? | ? | ? | ? | ? |
| Implementability | ? | ? | ? | ? | ? |
| **Total** | ?/25 | ?/25 | ?/25 | ?/25 | ?/25 |

✅ **Layout Intuitiveness** — Which information hierarchy matches your priorities?
✅ **Interaction Style** — Which fits your core experience?
✅ **Visual Weight** — Which density feels right for your brand?
✅ **Brand Alignment** — Which best supports your emotional goals?"

### 3. Facilitate Design Direction Selection

Help user choose or combine elements:
"After exploring all 5 design direction options:

**Which approach resonates most with you?**

- Pick a favorite direction as-is
- Combine elements from multiple directions
- Request modifications to any Stitch option (I can re-edit with Nano Banana Pro)
- Use one direction as a base and iterate

**Tell me:**
- Which layout feels most intuitive for your users?
- Which visual weight matches your brand personality?
- Are there elements from different options you'd like to combine?"

### 4. Document Design Direction Decision

Capture the chosen approach:
"Based on your exploration:

**Chosen Option:** Option {N} — {description}
**Key Elements:** {specific elements liked}
**Modifications Needed:** {any changes}
**Rationale:** {why this works}
**Rejected Options:** {why others weren't chosen}

This will become our design foundation moving forward."

### 5. Execute MKT Capture Pipeline

**MANDATORY after user approves an option:**
Read and execute: `{installed_path}/mkt-capture-pipeline.md`

This captures:
- Approved Stitch screen screenshot
- Design rationale (comparison analysis + selection reason)
- MKT story for future marketing use
- Knowledge base update with design decision

### 6. Generate Design Direction Content

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Design Direction Decision

### Design Directions Explored

[Summary of design directions explored based on conversation]

### Chosen Direction

[Chosen design direction based on conversation]

### Design Rationale

[Rationale for design direction choice based on conversation]

### Implementation Approach

[Implementation approach based on chosen direction]
```

### 7. Present Content and Menu

Show the generated design direction content and present choices:
"I've documented our design direction decision for {{project_name}}. This visual approach will guide all our detailed design work.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's refine our design direction
[P] Party Mode - Bring different perspectives on visual choices
[C] Continue - Save this to the document and move to user journey flows

### 8. Handle Menu Selection

#### If 'A' (Advanced Elicitation):

- Read fully and follow: {project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml with the current design direction content
- Process the enhanced design insights that come back
- Ask user: "Accept these improvements to the design direction? (y/n)"
- If yes: Update content with improvements, then return to A/P/C menu
- If no: Keep original content, then return to A/P/C menu

#### If 'P' (Party Mode):

- Read fully and follow: {project-root}/_bmad/core/workflows/party-mode/workflow.md with the current design direction
- Process the collaborative design insights that come back
- Ask user: "Accept these changes to the design direction? (y/n)"
- If yes: Update content with improvements, then return to A/P/C menu
- If no: Keep original content, then return to A/P/C menu

#### If 'C' (Continue):

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `./step-10-user-journeys.md`

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 6.

## SUCCESS METRICS:

✅ Multiple design direction variations generated
✅ HTML showcase created with interactive elements
✅ Design evaluation criteria clearly established
✅ User able to explore and compare directions effectively
✅ Design direction decision made with clear rationale
✅ A/P/C menu presented and handled correctly
✅ Content properly appended to document when C selected

## FAILURE MODES:

❌ Not creating enough variation in design directions
❌ Design directions not aligned with established foundation
❌ Missing interactive elements in HTML showcase
❌ Not providing clear evaluation criteria
❌ Rushing decision without thorough exploration
❌ Not presenting A/P/C menu after content generation
❌ Appending content without user selecting 'C'

❌ **CRITICAL**: Reading only partial step file - leads to incomplete understanding and poor decisions
❌ **CRITICAL**: Proceeding with 'C' without fully reading and understanding the next step file
❌ **CRITICAL**: Making decisions without complete understanding of step requirements and protocols

## NEXT STEP:

After user selects 'C' and content is saved to document, load `./step-10-user-journeys.md` to design user journey flows.

Remember: Do NOT proceed to step-10 until user explicitly selects 'C' from the A/P/C menu and content is saved!
