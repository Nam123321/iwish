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

### 2. Create Stitch Design System Project

**Agent Actions:**
1. Call `mcp_StitchMCP_create_project` with title: `"Distro {portal_name} Design System"`
2. Set device type matching portal:
   - Admin Portal → `DESKTOP`
   - Webstore → `DESKTOP` (responsive)
   - Sales App → `MOBILE`
   - SaaS Dashboard → `DESKTOP`

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

**Stitch Context Template (inject into EVERY screen generation):**
```
Product: Distro — AI-Embedded Light DMS for Vietnamese distributors
Portal: {portal_name}
Design Direction: {visual_direction_from_step_00}
Style: Glassmorphism, {color_mode}, Plus Jakarta Sans / Manrope
Purpose: Design System component showcase — {category_name}
Requirements: Show all {category_description} states and variants
Color Palette: {primary_color}, {secondary_color}, {accent_color}
```

### 4. Compile Design System Document

After all 9 categories are approved:

```markdown
## Design System — {Portal Name}

### Stitch Project
- Project ID: {stitch_project_id}
- Project URL: [View in Stitch](https://stitch.google.com/projects/{stitch_project_id})

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

### 5. Save Design System

**Agent Actions:**
1. Save Design System doc to `{planning_artifacts}/design-system/{portal-slug}/MASTER.md`
2. Create `{planning_artifacts}/design-system/{portal-slug}/stitch-project.json` with project metadata
3. Execute MKT Capture Pipeline (read `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/mkt-capture-pipeline.md`)
4. Update `{planning_artifacts}/ux-design-specification.md` with Design System summary

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
CHECK: Does `{planning_artifacts}/design-system/{portal-slug}/MASTER.md` exist?
IF NOT → BLOCK with message: 
  "⚠️ Design System chưa có cho portal '{portal_name}'. 
   Vui lòng chạy /create-ux-design trước để tạo Design System."
```

## SUCCESS METRICS:

✅ Stitch project created for target portal
✅ All 9 design system categories covered
✅ 3 Nano Banana Pro variants per category
✅ User approved each category selection
✅ Design System document saved as MASTER.md
✅ MKT materials captured for all approved selections
✅ Gate verification endpoint documented

## NEXT STEP:

After user selects 'C', load `./step-01-init.md` to begin the standard UX design workflow (now with Design System as foundation).
