# Step 00b: Holistic Design System — GATE Prerequisite

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: ALWAYS read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure the entire file is read and understood before proceeding
- ✅ ALWAYS treat this as collaborative discovery between UX facilitator and stakeholder
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## GATE RULE:

> 🚨 **HARD GATE**: No Story UI Spec can be created for a portal until this step produces a complete Design System for that portal. The `create-ui-spec` workflow MUST check for the existence of the design system before proceeding.

## EXECUTION PROTOCOLS:

- 🎯 Show your analysis before taking any action
- ⚠️ Present A/P/C menu after generating each design system category
- 💾 ONLY save when user chooses C (Continue)
- 📖 Update output file frontmatter, adding this step to stepsCompleted.
- 🚫 FORBIDDEN to load next step until C is selected AND all categories are covered

## YOUR TASK:

Create a comprehensive, portal-specific Design System using Stitch MCP with Nano Banana Pro polish. This system serves as the visual source of truth for all subsequent per-story UI specs.

## CONTEXT BOUNDARIES:

- Approved brand guidance, upstream visual-foundation constraints, and I-Wish authority rules remain active during Design System Gate preparation
- `ux-pro-max` may be invoked here only as a concise Stitch seed advisor
- The UI/UX Pro Max seed block is advisory prompt context only
- Approved Stitch selections and the saved portal Design System remain the final source of truth after user approval

## DESIGN SYSTEM PRODUCTION SEQUENCE:

### 1. Identify Target Portal

Ask user which portal to create the Design System for:
"Which portal are we creating the Design System for?

| Portal | Status | Priority |
|--------|--------|----------|
| Admin Portal | Not started / In progress / Complete | 🔴 P0 |
| Webstore | Not started / In progress / Complete | 🟡 P1 |
| Sales App | Not started / In progress / Complete | 🟡 P1 |
| SaaS Dashboard | Not started / In progress / Complete | 🟢 P2 |"

### 1.5 Check for Brand Identity & Guidelines

**Agent Actions:**
1. Check for `_iwish-output/brand-identity/brand-guidelines.md` FIRST (as it is LLM-readable). Only check `_iwish-output/brand-identity/brand-guideline.html` if `.md` is missing.
2. If it exists, read the guidelines to extract the approved brand identity (colors, typography, logo system, and visual direction). Incorporate this into `active_brand_or_bmad_constraints`.
3. Check for any image assets in `_iwish-output/brand-identity/assets/` (e.g., logo SVGs, icons) and pass their paths as explicit `Brand Assets` requirements in the Stitch Context Template.
4. If the user provides a raw logo without a brand guideline, propose running the `/brand` workflow first to ensure consistency.
5. If no brand guideline exists and the user declines to run `/brand`, proceed with the standard generation flow.

### 2. Create Stitch Design System Project

**Agent Actions:**
1. Call `mcp_StitchMCP_create_project` with title: `"Distro {portal_name} Design System"`
2. Set device type matching portal:
   - Admin Portal → `DESKTOP`
   - Webstore → `DESKTOP` (responsive)
   - Sales App → `MOBILE`
   - SaaS Dashboard → `DESKTOP`

### 2.5 UI/UX Pro Max Stitch Seed Gate

Before preparing the Stitch context template, verify the seed input context:
- product type
- portal name
- target users or primary operator persona
- desired emotional response or visual direction

If approved brand guidance, upstream visual-foundation seed direction, or other I-Wish authority constraints already exist:
- carry them forward into the specialist request
- do not allow the specialist to override them
- if conflict appears, keep the higher-authority I-Wish or brand decision active and treat the specialist output as advisory only

If required context is missing:
- do not fabricate a UI/UX Pro Max seed block
- gather the missing context first before Stitch generation starts
- do not proceed to category screen generation until the missing context is resolved
- use a blocking clarification step instead of empty `uiux_*` placeholders in the Stitch template

If required context is present:
- invoke `ux-pro-max` for a concise Design System Gate seed block before any Stitch-specific generation starts
- keep the response concise and Stitch-oriented

The seed block MUST cover:
- `Style Direction`
- `Palette Mood`
- `Typography Mood`
- `Key Effects`
- `Anti-Patterns`

The referenced or saved recommendation structure MUST also preserve:
- `Conflict Status`
- `Winning Authority`
- `I-Wish Conflict Check`

Authority guard:
- This seed block is advisory prompt context only
- It MUST NOT become the portal Design System source of truth on its own
- Once a Stitch variant is approved and the Design System is saved, the approved Stitch/Design System values supersede the seed block

Execution rule:
- Use one of the Stitch context template variants below
- Variant A: required context present and specialist seed block available
- Variant B: required context missing, so Stitch generation is blocked until the missing context is gathered

### 3. Generate Design System Screens (9 Categories)

For EACH category below, the agent MUST:
1. Generate initial screen with **Gemini Flash** (`mcp_StitchMCP_generate_screen_from_text`)
2. Create **3 Nano Banana Pro variants** (`mcp_StitchMCP_generate_variants` or `mcp_StitchMCP_edit_screens` with `modelId: GEMINI_3_PRO`)
3. Present all 3 variants to user
4. User selects preferred variant
5. Save selection rationale for MKT material

#### Category Screens:

| # | Category | Stitch Prompt Must Include |
|---|----------|---------------------------|
| 1 | **Color Palette** | Primary, Secondary, Accent, Neutral, Semantic colors + gradient definitions |
| 2 | **Typography** | Font family, heading scale (H1-H6), body text, captions, monospace |
| 3 | **Button System** | Primary/Secondary/Ghost/Danger buttons × Default/Hover/Active/Disabled states |
| 4 | **Card Components** | Data card, stat card, list card, glassmorphism card with border effects |
| 5 | **Form Elements** | Input, Select, DatePicker, Toggle, Checkbox, Radio × states |
| 6 | **Navigation** | Sidebar, Header, Tabs, Breadcrumb, Bottom bar (if mobile) |
| 7 | **Data Display** | Table, List, Grid, Charts (bar, line, pie), Metrics |
| 8 | **Feedback & Overlays** | Toast, Alert, Modal, Drawer, Popover, Empty State, Loading/Skeleton |
| 9 | **Icon & Illustration** | Feature icons, status icons, action icons, empty state illustrations |

**Stitch Context Template (inject into EVERY screen generation only after required context is complete):**

Variant A — specialist seed block available:
```
Product: Distro — AI-Embedded Light DMS for Vietnamese distributors
Portal: {portal_name}
Design Direction: {visual_direction_from_step_00}
Style Direction Source: Use the active I-Wish-approved visual direction plus the UI/UX Pro Max seed block below. Do not override approved brand or I-Wish authority constraints.
Purpose: Design System component showcase — {category_name}
Requirements: Show all {category_description} states and variants
Active Brand / I-Wish Constraints: {active_brand_or_bmad_constraints}
Brand Assets: {brand_assets_from_step_1_5}
Active Color Direction: {active_color_direction}
Active Typography Direction: {active_typography_direction}

UI/UX Pro Max Seed Block (advisory only):
- Style Direction: {uiux_style_direction}
- Palette Mood: {uiux_palette_mood}
- Typography Mood: {uiux_typography_mood}
- Key Effects: {uiux_key_effects}
- Anti-Patterns: {uiux_anti_patterns}
- Conflict Status: {uiux_conflict_status}
- Winning Authority: {uiux_winning_authority}
- I-Wish Conflict Check: {uiux_bmad_conflict_check}
- Constraint Status: {uiux_constraint_status}
- Advisory Status: Seed prompt context only; approved Stitch/Design System values supersede this block after user approval.
```

Variant B — required context missing, do not generate Stitch screens yet:
```text
BLOCK STITCH GENERATION
Missing Context: {missing_design_system_seed_context}
Required Action: Gather the missing context before invoking `ux-pro-max` or generating any Design System category screen.
Do not use empty `uiux_*` placeholders.
```

### 4. Compile Design System Document

After all 9 categories are approved:

```markdown
## Design System — {Portal Name}

### UI/UX Pro Max Stitch Seed Record
- Advisory Status: Seed prompt context only
- Style Direction: {uiux_style_direction}
- Palette Mood: {uiux_palette_mood}
- Typography Mood: {uiux_typography_mood}
- Key Effects: {uiux_key_effects}
- Anti-Patterns: {uiux_anti_patterns}
- Conflict Status: {uiux_conflict_status}
- Winning Authority: {uiux_winning_authority}
- I-Wish Conflict Check: {uiux_bmad_conflict_check}
- Constraint Status: {uiux_constraint_status}
- Active Constraint Source: {uiux_active_constraint_source}
- Supersession Note: Approved Stitch selections and the saved portal Design System supersede this advisory seed record.

If the specialist seed block was not available yet at the moment this gate first ran, record that the workflow paused for missing context before Stitch generation instead of fabricating seed values.

### Design Platform Project
- Platform: {design_platform_name} (e.g., Stitch, Figma, Canva, Claude Design)
- Project ID: {design_project_id}
- Project URL: [View in Platform]({design_project_url})

### Color Palette
[Selected variant description + token values]

### Typography
[Selected variant + CSS var mapping]

### Button System
[Selected variant + component specs]

### Card Components
[Selected variant + border/shadow/blur values]

### Form Elements
[Selected variant + validation states]

### Navigation
[Selected variant + responsive behavior]

### Data Display
[Selected variant + chart recommendations]

### Feedback & Overlays
[Selected variant + animation specs]

### Icon Guide
[Selected variant + icon mapping per feature]

### Cross-Portal Token Map
| Token | {Portal} Value | Shared/Override |
```

### 4.5 Page Override Convention

When a page requires a justified deviation from the portal Design System:
- derive a stable page identifier first:
  - `page` = human-readable page or page-state name
  - `page-slug` = normalized lowercase slug for filesystem use
- record the override under `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md`
- treat the override as a child rule of `DESIGN.md`, not a second portal-wide master
- document:
  - which master rules change
  - why the deviation is justified
  - which master rules still apply unchanged
  - whether the override is intended to shape future generation only

Use this page override shape:

```markdown
## Page Override — {page}

Page Scope: {page}
Page Slug: {page-slug}
Story Scope: {story_key_or_story_group_if_known}
Parent Design System: `design-system/{portal-slug}/DESIGN.md`
Override Intent: [why this page needs a justified deviation]

### Changed Rules
- [master rule or token being changed]

### Why It Changes
- [page-specific rationale]

### Master Rules Still In Force
- [rules inherited unchanged from DESIGN.md]

### Stitch Precedence Note
- If an approved Stitch screen already exists for this exact page state, that approved Stitch visual contract remains authoritative until a newer screen is approved.
- This page override may shape future generation only when no approved page-state Stitch artifact already exists.
```

### 5. Save Design System

**Agent Actions:**
1. Save Design System doc to `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`
2. Create `{planning_artifacts}/design-system/{portal-slug}/stitch-project.json` with project metadata
3. Execute MKT Capture Pipeline (read `{project-root}/.agent/workflows/mkt-capture-pipeline.md`)
4. Update `{planning_artifacts}/ux-design-specification.md` with Design System summary
5. Preserve the UI/UX Pro Max seed record as advisory context only; do not treat it as active authority after approval
6. If any justified page-specific deviation is discovered, persist it separately under `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md` using the page override shape above

### 6. Present Content and Menu

"I've completed the Design System for {portal_name}! All 9 component categories have been designed, reviewed, and polished with Nano Banana Pro.

**Design System Summary:**
- Stitch Project: {project_link}
- Categories: 9/9 complete
- Total Screens: {screen_count}
- Nano Banana variants reviewed: {variant_count}

**What would you like to do?**
[A] Advanced Elicitation - Let's refine specific components
[P] Party Mode - Get multi-agent review of the Design System
[C] Continue - Save and proceed to Step 1 (Initialization)"

## GATE VERIFICATION:

Before allowing `create-ui-spec` to proceed for any story:
```
CHECK: Does `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md` exist?
IF NOT → BLOCK with message: 
  "⚠️ Design System chưa có cho portal '{portal_name}'. 
   Vui lòng chạy /create-ux-design trước để tạo Design System."
```

## SUCCESS METRICS:

✅ Stitch project created for target portal
✅ UI/UX Pro Max seed block prepared before Stitch generation when required context exists
✅ Seed block stays concise and Stitch-oriented
✅ Stitch generation is blocked rather than fabricated when required seed context is missing
✅ All 9 design system categories covered
✅ 3 Nano Banana Pro variants per category
✅ User approved each category selection
✅ Design System document saved as DESIGN.md
✅ Page-specific deviations are stored as separate page override files rather than mutating `DESIGN.md`
✅ MKT materials captured for all approved selections
✅ Gate verification endpoint documented
✅ Approved Stitch and saved Design System values supersede the advisory seed block

## NEXT STEP:

After user selects 'C', load `./step-02-discovery.md` to begin the standard UX design workflow (now with Design System as foundation).
