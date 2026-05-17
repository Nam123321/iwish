---
name: create-ui-spec
description: Generate per-story UI specification — the Discovery Track artifact for Dual-Track Agile. Requires Design System GATE and produces 5 visual options with Stitch MCP.
---

# Create UI Spec Workflow Entry

**Goal:** Generate a per-story UI specification with component hierarchy, responsive layout, design tokens, and interaction patterns. User must approve the UI spec before the story proceeds to `Vegeta-story`.

**This is the "Discovery Track" workflow** — it runs between `create-story` and `Vegeta-story` for stories that have frontend UI components.

**Enhanced with:** Design System GATE prerequisite, 5-Option Framework with Stitch MCP + Nano Banana Pro, and MKT Material Capture Pipeline.

---

## PREREQUISITES

Before running this workflow:
1. A story file must exist (created by `create-story` workflow)
2. The UX Design Specification must exist at `{planning_artifacts}/ux-design-specification.md`
3. The Feature Hierarchy should exist at `{planning_artifacts}/feature-hierarchy.md`

### 🚨 DESIGN SYSTEM GATE CHECK (HARD PREREQUISITE)

**Before proceeding, the agent MUST verify the Design System exists for the story's target portal:**

```
1. Read the story file to determine which portal this story belongs to
2. Map portal to slug: Admin → "admin-portal", Webstore → "webstore", Sales → "sales-app", SaaS → "saas-dashboard"
3. CHECK: Does `{planning_artifacts}/design-system/{portal-slug}/MASTER.md` exist?

IF EXISTS → ✅ Proceed with workflow
IF NOT EXISTS → ❌ BLOCK with message:
   "⚠️ Design System chưa có cho portal '{portal_name}'.
    Vui lòng chạy /create-ux-design trước để tạo Design System.
    Story UI Spec không thể được tạo khi chưa có Design System."
```

**The agent MUST NOT skip this check.** No story UI spec can exist without a portal Design System.

### 🧑‍💼 USER SIMULATION GATE (MANDATORY for UI Stories)

**After Design System GATE passes, the agent MUST run user simulation:**

```
1. Load SKILL: {project-root}/.agent/skills/user-simulation-guardian/SKILL.md
2. Identify which personas are relevant for this story's portal:
   - Webstore → P1 (Chủ tiệm) + P5 (Consumer)
   - Sales Web/App → P2 (NVBH — pick relevant sub-type)
   - Admin Portal → P3 (Admin) + P4 (Supervisor)
3. Run REAL-USER Protocol (8 dimensions) for MIN 3 personas
4. Apply scenario overlays: rush-hour, low-connectivity, first-time-user (pick ≥2)
5. Check: feature-validation checklist ({project-root}/.agent/skills/user-simulation-guardian/checklists/feature-validation.md)

IF PASS → ✅ Proceed — include simulation findings in UI spec
IF FAIL → Fix non-linear paths BEFORE generating UI spec options
```

**The agent MUST include the simulation findings in the UI spec output** — section "User Simulation Results" with personas tested, scenarios applied, and non-linear paths identified.

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `output_folder`, `planning_artifacts`, `implementation_artifacts`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `date` as system-generated current datetime

### Paths

- `installed_path` = `{project-root}/_bmad/bmm/workflows/4-implementation/create-ui-spec`
- `template_path` = `{installed_path}/template.md`
- `output_folder` = `{implementation_artifacts}/ui-specs`
- `default_output_file` = `{output_folder}/{story_key}-ui-spec.md`
- `design_system_path` = `{planning_artifacts}/design-system/{portal-slug}/MASTER.md`
- `mkt_materials_dir` = `{output_folder_root}/mkt-materials/`

### UI/UX SKILL Integration

If `{project-root}/.agent/skills/ui-ux/SKILL.md` exists:
- Load the SKILL instructions for design system intelligence
- Use `--design-system` command for portal-specific style recommendations
- Cross-reference with existing UX spec design tokens

### Stitch MCP Integration

Load the portal's existing Stitch project (if any) from Design System metadata:
- Read `{planning_artifacts}/design-system/{portal-slug}/stitch-project.json` for project ID
- Use this Stitch project for generating story-specific screens

## 5-OPTION FRAMEWORK

Each story UI spec MUST include **5 visual options** for the story's key screen(s):

| Option | Method | Requirement |
|--------|--------|-------------|
| Option 1 | Stitch Flash → Nano Banana Pro | Dark variant |
| Option 2 | Stitch Flash → Nano Banana Pro | Light variant |
| Option 3 | Stitch Flash → Nano Banana Pro | Hybrid/Creative variant |
| Option 4 | `generate_image` AI mockup | High-fidelity static |
| Option 5 | HTML/CSS prototype | Interactive prototype |

**Context Injection for Stitch calls:**
```
Product: {project_name}
Portal: {portal_name}
Story: {story_key} — {story_title}
Acceptance Criteria: {acceptance_criteria_bullets}
Persona: {persona} — {device}
Design System: loaded from {design_system_path}
```

**Comparison table MUST be included in the UI spec:**

| Criteria | Opt 1 | Opt 2 | Opt 3 | Opt 4 | Opt 5 |
|----------|-------|-------|-------|-------|-------|
| PRD Alignment | ? | ? | ? | ? | ? |
| Persona Fit | ? | ? | ? | ? | ? |
| Accessibility | ? | ? | ? | ? | ? |
| Implementability | ? | ? | ? | ? | ? |
| Design System Compliance | ? | ? | ? | ? | ? |

## MKT MATERIAL CAPTURE

After user approves a design option:
- Execute MKT Capture Pipeline: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/mkt-capture-pipeline.md`
- Capture approved screen screenshot, design rationale, and MKT story
- Update knowledge base with design decision

## STITCH HTML FIDELITY PIPELINE ⚠️ MANDATORY

> [!IMPORTANT]
> **This pipeline closes the design-to-code visual gap.** After Stitch screens are approved, the agent MUST extract HTML/CSS to ensure coded output pixel-matches the approved design.

### Screen Selection Strategy (100% Stitch Coverage)

> [!CAUTION]
> **ALL screens MUST have a Stitch representation before code extraction.** No screen may be coded without a Stitch-approved visual. If a screen doesn't exist in Stitch yet, it MUST be generated via `generate_screen_from_text` and approved by the user.

Use this decision matrix to determine HOW each screen enters Stitch:

| Screen Type | Stitch Method | Example |
|---|---|---|
| **New layout** — no existing pattern in codebase | ✅ Generate on Stitch (manual design) | List page, Create gallery, Form with review panel |
| **Mode variant** — light/dark of a key layout | ✅ Generate variant on Stitch | Dark mode list page |
| **State variant** — loading, empty, error states | ✅ Generate on Stitch via `generate_screen_from_text` referencing parent screen | Loading skeleton, empty state |
| **Responsive** — mobile/tablet breakpoint | ✅ Generate on Stitch with `deviceType: MOBILE/TABLET` | Mobile list view |
| **Sub-flow** — modal, drawer, popover, toast | ✅ Generate on Stitch via `generate_screen_from_text` | Delete confirmation, filter drawer |

**Rule:** Create key screens manually on Stitch first (Tier 1). Generate remaining screens via `generate_screen_from_text` referencing Tier 1 as style anchors (Tier 3 → approved → becomes Tier 1). See `/stitch-to-code` workflow for full Tier model.

**Screen Mapping Table (REQUIRED in UI Spec output):**

| # | Screen Name | UI Spec Section | Stitch Screen ID | Tier | Status |
|---|-------------|----------------|------------------|------|--------|
| 1 | Example | §X | abc123... | 1 | ✅ Approved |

### HTML Export Extraction (Post-FINAL-Approval)

> [!CAUTION]
> **HTML must be extracted from the FINAL approved version of Stitch screens.**
> If user requests changes → edit screens on Stitch → get re-approval → THEN extract HTML.
> Never extract HTML from the initial generation if edits were made afterward.

**Feedback loop:**
```
1. Generate Stitch screens → Present to user
2. IF user requests changes:
   a. Use `mcp_StitchMCP_edit_screens` to modify screens per feedback
   b. Present updated screens to user
   c. Repeat until user approves (FINAL approval)
3. ONLY AFTER final approval → proceed to HTML extraction
```

**HTML extraction procedure (after FINAL approval):**

```
1. For EACH approved Stitch screen:
   a. Use `mcp_StitchMCP_get_screen` to get the screen's `htmlCode.downloadUrl`
   b. Use `read_url_content` to download the HTML file
   c. Parse and extract CSS properties:
      - Colors (hex, rgb, rgba)
      - Font sizes, weights, families
      - Padding, margin, gap values
      - Border radius, border colors
      - Box shadows
      - Background gradients
      - Transition/animation values
   d. Create CSS Mapping Table in the UI spec:

      | Stitch CSS Value | → Admin Token | Usage |
      |---|---|---|
      | `#4799EB` | `var(--admin-primary)` | CTA buttons, links |
      | `#F8FAFC` | `var(--admin-bg)` | Page background |
      | `16px` | `gap-4` | Section spacing |
      | ... | ... | ... |

2. Embed Stitch screen IDs and HTML download URLs in the UI spec under "## Stitch Screens" section
3. Save CSS mapping as `{output_folder}/{story_key}-stitch-css-mapping.md`
4. This mapping becomes the AUTHORITATIVE reference for Vegeta-story coding
```

### Visual Diff Verification (Post-Coding)

After coding FE tasks in `Vegeta-story`:

```
1. Run Vegeta server (`npm run Vegeta` or equivalent)
2. Use `browser_subagent` to navigate to the implemented page
3. Capture screenshot of coded output
4. Compare visually against Stitch approved screenshot
5. Identify and fix discrepancies:
   - Color mismatches (check CSS mapping was applied)
   - Spacing/layout drift (check gap/padding values)
   - Typography differences (check font-size/weight)
   - Border/shadow deviations
6. Re-screenshot and verify until match is acceptable
7. Document any intentional deviations with justification
```

### Stitch-to-Vegeta Handoff Amendment

After Stitch screens are approved by user, **APPEND** this section to the UI Spec:

```
## §{N}. Stitch-to-Vegeta Handoff
> Auto-generated by /stitch-first-Vegeta after Stitch approval ({date})

### Screen Registry
| # | Screen | Stitch ID | Version | Tier | Previous Version | Device |
|---|--------|-----------|---------|------|------------------|--------|
(Map every screen to Stitch ID, include previous version for variant tracking)

### Component-to-Code Mapping
| Stitch Component | Project Component | Library | Import |
|-----------------|-------------------|---------|--------|
(Map visual elements → antd/custom components, icon library, exact imports)

### New CSS Variables (if any)
| Variable | Value | Usage |
|----------|-------|-------|
(Only tokens not yet in var(--admin-*) system)

### Key Visual Rules
- [ ] {Specific, checkable rule from Stitch — e.g., "Cards use 2×2 grid NOT linear row"}
(These become validator items in Vegeta-story checklist)

### Icon Assignment
| Location | Icon | Library | Import |
|----------|------|---------|--------|
(Every icon in Stitch → exact project import)
```

> [!IMPORTANT]
> This handoff section is the **SINGLE SOURCE OF TRUTH** for Vegeta-story implementation.
> Vegeta agent reads ONE file (UI Spec + Amendment) — no hunting across multiple docs.
> See `/stitch-first-Vegeta` workflow for full scoring and variant logic.

## EXECUTION

- ✅ YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- ✅ VERIFY Design System GATE before proceeding
- Load the workflow config: `{installed_path}/workflow.yaml`
- Load and follow the instructions: `{installed_path}/instructions.xml`
