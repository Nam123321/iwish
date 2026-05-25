# Step 00: Visual Research & Inspiration Audit

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: ALWAYS read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure the entire file is read and understood before proceeding
- ✅ ALWAYS treat this as collaborative discovery between UX facilitator and stakeholder
- 📋 YOU ARE A UX FACILITATOR, not a content generator
- 💬 FOCUS on gathering visual references and competitor analysis
- 🎯 COLLABORATIVE discovery, not assumption-based design
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- ⚠️ Present A/P/C menu after generating research content
- 💾 ONLY save when user chooses C (Continue)
- 📖 Update output file frontmatter, adding this step to the end of the list of stepsCompleted.
- 🚫 FORBIDDEN to load next step until C is selected

## COLLABORATION MENUS (A/P/C):

- **A (Advanced Elicitation)**: Use discovery protocols to develop deeper visual insights
- **P (Party Mode)**: Bring multiple perspectives to evaluate visual direction
- **C (Continue)**: Save the content to the document and proceed to next step

## PROTOCOL INTEGRATION:

- When 'A' selected: Read fully and follow: {project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml
- When 'P' selected: Read fully and follow: {project-root}/_bmad/core/workflows/party-mode/workflow.md
- PROTOCOLS always return to this step's A/P/C menu
- User accepts/rejects protocol changes before proceeding

## CONTEXT BOUNDARIES:

- This is the FIRST step — no prior document content exists yet
- Load PRD, Feature Hierarchy, and Architecture docs for product context
- Use browser and Stitch MCP tools for visual research

## YOUR TASK:

Conduct a comprehensive visual research audit before any design work begins. This includes competitor screenshot capture, Stitch moodboard creation, and style exploration.

## VISUAL RESEARCH SEQUENCE:

### 1. Competitive Visual Audit

Capture and analyze competitor UIs:
"Let's start by studying what exists in your market. I'll gather visual references from competitors and related products.

**Research Questions:**
- Which 3-5 competitors should we study? (e.g., KiotViet, Sapo, Shopee Seller, GrabMerchant)
- Are there non-competing apps with UX patterns you admire?
- What's your general reaction to each — what works, what doesn't?"

**Agent Actions:**
1. Use `browser_subagent` to capture 2-3 key screenshots per competitor
2. Save screenshots to `{output_folder}/mkt-materials/research/competitors/`
3. Annotate what works / what doesn't for each

### 2. Create Stitch Moodboard

Create a visual moodboard using Stitch MCP:
"I'm creating a Stitch moodboard project to collect visual inspiration.

**Stitch Project:** `{project_name} Visual Research`"

**Agent Actions:**
1. Call `mcp_StitchMCP_create_project` with title: `"{project_name} Visual Research"`
2. Generate 3-5 inspiration screens using `mcp_StitchMCP_generate_screen_from_text`
3. Context for each screen must include PRD summary and portal description
4. Present screens to user for reaction

### 3. Nano Banana Style Exploration

Test 3 different visual styles with Stitch + Nano Banana Pro:
"Let's explore different visual directions using Google's Nano Banana Pro redesign engine.

**Exploration Variants:**

| Variant | Color Mode | Effects | Mood |
|---------|-----------|---------|------|
| A | Dark | Glassmorphism + neon accents | Bold, modern, tech-forward |
| B | Light | Soft shadows + pastel accents | Clean, friendly, approachable |
| C | Hybrid | Dark sidebar + light content | Professional, balanced |"

**Agent Actions:**
1. Use `mcp_StitchMCP_generate_screen_from_text` (Gemini Flash) for quick drafts
2. Use `mcp_StitchMCP_generate_variants` or `mcp_StitchMCP_edit_screens` (Nano Banana Pro / Gemini Pro) to polish each
3. Present all 3 variants side-by-side to user

### 4. User Discussion & Direction Selection

Facilitate user choice:
"After exploring these visual references and style variants:

**Key Questions:**
- Which competitor's visual approach resonates most?
- Which Nano Banana variant feels right for your brand?
- Are there specific elements from different options you'd like to combine?
- What should we absolutely AVOID?"

### 5. Generate Research Summary Content

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Visual Research & Inspiration Audit

### Competitive Visual Analysis

[Screenshots and analysis of competitor UIs]
[Stitch moodboard project link]

### Style Exploration Results

[3 Nano Banana Pro variants with user reactions]

### Visual Direction Decision

[Chosen direction with rationale]
[Elements to adopt, adapt, and avoid]
```

### 6. Present Content and Menu

Show the generated visual research content and present choices:
"I've completed our visual research audit for {{project_name}}. We have a solid foundation of visual references, competitor insights, and style direction.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 5]

**What would you like to do?**
[A] Advanced Elicitation - Let's deepen our visual research
[P] Party Mode - Bring different perspectives on visual direction
[C] Continue - Save this to the document and move to Design System"

### 7. Handle Menu Selection

#### If 'A' (Advanced Elicitation):

- Read fully and follow: {project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml
- Process the enhanced insights that come back
- Ask user: "Accept these improvements? (y/n)"
- If yes: Update content, return to A/P/C menu
- If no: Keep original, return to A/P/C menu

#### If 'P' (Party Mode):

- Read fully and follow: {project-root}/_bmad/core/workflows/party-mode/workflow.md
- Process the collaborative insights that come back
- Ask user: "Accept these changes? (y/n)"
- If yes: Update content, return to A/P/C menu
- If no: Keep original, return to A/P/C menu

#### If 'C' (Continue):

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Read fully and follow: `./step-00b-design-system-gate.md`

## SUCCESS METRICS:

✅ Competitor screenshots captured and analyzed (3-5 competitors)
✅ Stitch moodboard project created with inspiration screens
✅ 3 Nano Banana Pro style variants explored
✅ Visual direction selected with clear rationale
✅ A/P/C menu presented and handled correctly
✅ Content properly appended to document when C selected

## FAILURE MODES:

❌ Skip competitor research and jump to design
❌ Not using Stitch MCP for visual generation
❌ Only text-based discussion without visual artifacts
❌ Not capturing screenshots for MKT materials
❌ Not presenting A/P/C menu after content generation

## NEXT STEP:

After user selects 'C' and content is saved to document, load `./step-00b-design-system-gate.md` to establish the holistic design system.
