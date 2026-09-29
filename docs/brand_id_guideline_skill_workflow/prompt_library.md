# Prompt Library for Brand Identity & Brand Guideline Workflow

Use these production prompts to guide visual and textual generative models after completing the intake questionnaire.

---

## 1. Logo Brainstorming & Options Generation
*Use this prompt to generate the initial logo design concepts.*

```text
You are a principal brand designer. Based on the brand brief below, brainstorm and generate exactly [number, default: 5] distinct logo options.

Brand Strategic Context (Kapferer's Brand Prism):
- Culture: [brand values and origin]
- Personality: [brand tone and human traits]
- Physique Mood: [color preferences, typography mood]
- Relationship: [how the brand interacts with users]
- Reflection: [target customer image]
- Self-Image: [how using the product makes the user feel]

For EACH logo option, you must output:
1. Option Name & Conceptual Metaphor
2. Visual Description:
   Describe the visual mark (monogram, abstract geometry, emblem, line art). Specify primary, secondary, and neutral hex codes.
3. Component Breakdown (Visual-Verbal Grid):
   Specify the visual components that make up the logo mark, the symbolic meaning of each component, and how they are arranged. For example:
   * Component A: [e.g. interlocking circles] -> Meaning: [e.g. human-AI collaboration]
   * Component B: [e.g. upward terminal vector] -> Meaning: [e.g. speed and progress]
   * Arrangement: [e.g. horizontal alignment, intersecting at 45 degrees]
4. Typography Pairing:
   Explain the typography selection for the wordmark (font-family style, weight, kerning rules) and how it complements the logo symbol.
5. Technical Notes:
   Specify legibility at 16x16px (favicon scale) and outline considerations for dark mode adaptation.

At the end of your response, ask the user:
"Would you like me to generate specialized prompts optimized for external design tools (such as Recraft.ai, Midjourney, ChatGPT, or any other tool of your choice) to test and generate visual assets for these 5 options?"
```

---

## 2. Logo Refactoring & Modernization
*Use this prompt when upgrading an existing user logo.*

```text
You are a senior vector artist and design systems architect. You are refactoring an existing logo for [brand name] following [Path A: Grid Cleanup / Path B: Evolutionary Upgrade / Path C: Complete Redesign].

Existing Logo Audit details:
- File format limits: [e.g. raster only, messy curves]
- Active fonts: [fonts to replace or preserve]
- Technical problems: [e.g. poor small-scale legibility, low contrast]

Your task is to propose 3 refactoring directions based on the chosen path:

If Path A (Grid Cleanup):
Detail how to redraw the existing mark using exact geometric forms (perfect circles, strict angles, balanced grid grids). Fix typographical spacing and kerning. Do not change the core concept.

If Path B (Evolutionary Upgrade):
Detail how to simplify the shape components, optimize strokes for responsive display, update the font pairings to modern web-safe families, and establish dark-mode/monochrome compliance while retaining overall brand equity.

If Path C (Complete Redesign):
Propose a brand-new concept that respects the brand name but uses fresh modern design systems and assets.

For each direction, show:
- Visual adjustments (before vs after description).
- Geometric grid layout.
- Naming specifications for vector files.
```

---

## 3. Sequential Gating Validation Prompt
*Use this prompt to ensure the logo is locked before expanding the brand.*

```text
You are a design QA validator. Review the current project status for [brand name].

Current State:
- Has the user formally approved and signed off on a final logo option? [Yes / No]
- Approved Logo File: [Path/link to SVG logo asset]

If the logo is NOT approved (or is still in draft state):
- DO NOT proceed to develop colors, fonts, layouts, website banners, or email templates.
- Output: "BLOCK: Logo system must be approved and locked before extending the design system. Please request approval from the user on one of the brainstormed logo options."

If the logo IS approved:
- Confirm that the monochrome, reversed, and dark-mode assets are verified.
- Proceed to generate Phase 5 deliverables (Color palette, Type scale, Design tokens JSON).
```

---

## 4. Design Tokens JSON Structure Prompt
*Use this prompt to generate W3C / Style Dictionary compliant design tokens.*

```text
Generate a comprehensive `design-tokens.json` file for the approved brand identity of [brand name].
Use the W3C Design Tokens Community Group specification. The tokens must cover:
- Colors (primary, secondary, neutrals, semantic states: success, warning, error, info, automation-active)
- Typography (font families, font weights, font sizes, line heights, letter spacing)
- Spacing (scale ratios)
- Borders (radius rules, stroke widths)

Ensure the JSON is structured to be read directly by Amazon's Style Dictionary CLI to compile CSS and JS variables.
```

---

## 5. Website Hero & UI Mockup Prompts
*Use these prompts after the logo and tokens are locked.*

```text
Create a modern, conversion-focused website hero section for [brand name] using the approved brand guidelines.
- Approved Logo: [symbol description]
- Brand Colors: [primary/secondary hex]
- Typographic Mood: [typography pairing]

Layout Grid:
Desktop 12-column layout. Light background / dark mode options.
Hero typography: H1 display font, prominent, heavy weight.
Call-To-Action (CTA): Primary button with brand accent color.
UI Mockup Preview: Embed a detailed dashboard screen showing AI workflows and real-time project analytics using semantic tokens.
```

---

## 6. Design Tool Connection Verification Prompt
*Use this prompt when starting Phase 4 to verify the design connection.*

```text
You are a system integrations agent. Check the current environment for active design plugins or MCP connections.

If no active tool is found:
Formally ask the user:
"I noticed that no design tool or system is currently active in this workspace. To enable automatic design system updates and mockup generation, please select one of the pre-setup design adapters from the I-Wish registry:
1. stitch (Stitch-first design generation & sync)
   -> Run `npx iwish-db add stitch`
2. figma (Figma-based design inspection & handoff)
   -> Run `npx iwish-db add figma-first-dev`
3. claude-design (Design-oriented generation & handoff)
   -> Run `npx iwish-db add claude-design-first-dev`
4. canva (Canva-based design authoring & handoff)
   -> Run `npx iwish-db add canva-first-dev`
5. Local File Exporter only (Saves SVGs and JSON tokens to `/assets/` directory only)

Please reply with the option of your choice to proceed."
```
