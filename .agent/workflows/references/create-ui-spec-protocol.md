---
legacy_name: create-ui-spec-legacy
description: Generate per-story UI specification — the Discovery Track artifact
  for Dual-Track Agile. Requires Design System GATE and produces 5 visual
  options with Stitch MCP.
---

# Create UI Spec Workflow Entry

**Goal:** Generate a per-story UI specification with component hierarchy, responsive layout, design tokens, and interaction patterns. User must approve the UI spec before the story proceeds to `dev-agent-story`.

**This is the "Discovery Track" workflow** — it runs between `create-story` and `dev-agent-story` for stories that have frontend UI components.

**Enhanced with:** Design System GATE prerequisite, 5-Option Framework with Stitch MCP + Nano Banana Pro, and MKT Material Capture Pipeline.

---

## PREREQUISITES

Before running this workflow:
1. A story file must exist (created by `create-story` workflow)
2. The UX Design Specification must exist at `{planning_artifacts}/ux-design-specification.md`
3. The Feature Hierarchy MUST exist at `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md`

### 🚨 FEATURE HIERARCHY GATE CHECK (HARD PREREQUISITE)

**Before proceeding, the agent MUST verify the Feature Hierarchy exists:**

```
1. CHECK: Does `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md` exist?

IF EXISTS → ✅ Proceed to Feature Hierarchy Navigation Context loading (below)
IF NOT EXISTS → ❌ HALT with message:
   "⚠️ Feature Hierarchy chưa tồn tại.
    Vui lòng chạy /create-epics-and-stories trước để tạo Feature Hierarchy.
    UI Spec không thể được tạo khi chưa có Feature Hierarchy vì navigation context sẽ bị sai."
```

**The agent MUST NOT skip this check.** No story UI spec can be created without a Feature Hierarchy — proceeding without it leads to guessed navigation that causes inconsistencies.

### 📂 FEATURE HIERARCHY NAVIGATION CONTEXT (AFTER HIERARCHY GATE)

After the Feature Hierarchy GATE passes, the agent MUST extract navigation context:

```
1. Read `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md` in full using `view_file`
2. Identify which portal this story belongs to (Admin, Webstore, Sales, SaaS, etc.)
   - Match the story's portal to the corresponding section in feature-hierarchy.md
3. Extract the portal's sidebar/menu tree:
   - Top-level menu groups
   - Sub-menu items and their hierarchy
   - Feature placement within the tree
   - Cross-portal navigation links (if any)
4. Store the extracted navigation tree as `{portal_nav_tree}` for use in:
   - Navigation, Routing & Menu Placement section of the UI spec
   - Breadcrumb path generation
   - Sibling/parent/child navigation relationships
   - Sidebar active state determination
5. The extracted navigation tree is the SOURCE-OF-TRUTH for all navigation
   decisions in this UI spec. Do NOT guess or infer navigation structure
   from other sources.
```

**The agent MUST use `{portal_nav_tree}` when generating the Navigation, Routing & Menu Placement section.**

### 🚨 DESIGN SYSTEM GATE CHECK (HARD PREREQUISITE)

**Before proceeding, the agent MUST verify the Design System exists for the story's target portal:**

```
1. Read the story file to determine which portal this story belongs to
2. Map portal to slug: Admin → "admin-portal", Webstore → "webstore", Sales → "sales-app", SaaS → "saas-dashboard"
3. CHECK: Does `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md` exist?

IF EXISTS → ✅ Proceed with workflow
IF NOT EXISTS → ❌ BLOCK with message:
   "⚠️ Design System chưa có cho portal '{portal_name}'.
    Vui lòng chạy /create-ux-design trước để tạo Design System.
    Story UI Spec không thể được tạo khi chưa có Design System."
```

**The agent MUST NOT skip this check.** No story UI spec can exist without a portal Design System.

### PAGE OVERRIDE RETRIEVAL RULE (AFTER DESIGN SYSTEM GATE)

If the story targets a specific page or page state:

```
0. Derive the active page identifier from the story title, UI spec target screen, or explicitly named page state:
   - `page` = human-readable page or page-state name
   - `page-slug` = normalized lowercase slug for filesystem lookup
1. Read the approved portal Design System first:
   - `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`
2. Then check for a page-specific override:
   - `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md`
3. If the page override exists:
   - apply it only to the active page/story context
   - do not treat it as a second portal-wide master
   - record which master rules still remain in force
4. If an approved Stitch screen already exists for that exact page state:
   - the approved Stitch visual contract remains authoritative until a newer screen is approved
   - the page override may shape future generation only if no approved page-state Stitch artifact already exists
```

**Authority resolution for page-specific design work:**
- `DESIGN.md` defines the portal-wide base rules
- `pages/{page-slug}.md` may narrow or justify a page-specific deviation
- approved Stitch screens for the same page state remain the active visual source of truth when they already exist

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
   > [!IMPORTANT]
   > **DOUBLE-LOCK CONTEXT INJECTION:**
   > You MUST use the `view_file` tool to load the checklist fragment:
   > - `/.agent/fragments/feature-validation.md`

5. Check against the loaded feature-validation checklist

IF PASS → ✅ Proceed — include simulation findings in UI spec
IF FAIL → Fix non-linear paths BEFORE generating UI spec options
```

**The agent MUST include the simulation findings in the UI spec output** — section "User Simulation Results" with personas tested, scenarios applied, and non-linear paths identified.

### UI/UX PRO MAX STORY-SPEC GATE (MANDATORY for Story UI Specs)

**Only after the Design System GATE and User Simulation GATE pass, the agent may invoke `ui-ux`:**

```
1. Verify both gates are already satisfied:
   - Design System exists for the portal
   - User Simulation findings have been completed and recorded
2. ENRICH-UX SCORING STEP (Touchpoint 1.2): Assess the interaction complexity of the story to determine if UI Enrichment is required.
   Calculate the Enrich-UX Score (0-10) using this formula: `Score = (E1*2 + E2*2 + E3 + E4) / 30 * 10`
   - **E1**: Interactivity & Animation Density (0-5)
   - **E2**: State Management & Data Choreography (0-5)
   - **E3**: Contextual Transitions (0-5)
   - **E4**: Non-Standard Visual Geometry (0-5)
   
   **Decision Matrix:**
   - **Score 0-3**: Skip (Static HTML/CSS suffices). Set `Enrichment_Required: false`.
   - **Score 4-6**: Standard (CSS enhancements, micro-interactions). Set `Enrichment_Required: true`, `Enrichment_Tier: Standard`.
   - **Score 7-10**: Pro-Max (JS observers, GSAP, complex state choreography). Set `Enrichment_Required: true`, `Enrichment_Tier: Pro-Max`.
   
   -> If `Enrichment_Required: true`, when the User approves the Stitch version, the agent MUST automatically record the approval and call `/enrich-ux` workflow to populate the `[POST_STITCH_ENRICHMENT_LOGIC]` section.
3. Prepare a story-specific specialist request with:
   - Product
   - Portal
   - Story key + story title
   - Acceptance criteria bullets
   - Persona + device context
   - Design System summary from {design_system_path}
   - Page override summary from `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md` when it exists for the active page/story context
   - Any approved brand, portal, or I-Wish authority constraints relevant to this story
3. Invoke `ui-ux` only for story-level guidance
4. Do NOT use it to re-run portal-wide design discovery or to override approved Stitch / Design System authority
5. If the specialist conflicts with approved Stitch screens or extracted visual contract:
   - reject the conflicting recommendation, or
   - downgrade it to a checklist / advisory note
   - keep the Stitch visual contract authoritative
6. After the user approves the final story-level Stitch screen(s):
   - re-check `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check` against the approved Stitch visual contract
   - update the `UI-UX Orchestrator Notes` section so it reflects the final approved story-level visual authority
   - do not leave pre-approval conflict fields stale in the final UI spec or handoff
```

**The agent MUST include the specialist output in the final UI spec** under section `UI-UX Orchestrator Notes`.
That section MUST use this exact governed I-Wish contract template:
```markdown
### UI-UX Orchestrator Notes

Product Type: [from specialist output]
Recommended Direction: [from specialist output]
Alternatives: [from specialist output]
Color/Tone: [from specialist output]
Typography: [from specialist output]
Interaction Notes: [from specialist output]
Anti-Patterns: [from specialist output]
Implementation Checklist: [from specialist output]
Conflict Status: [from final reconciled specialist output]
Winning Authority: [from final reconciled specialist output]
I-Wish Conflict Check: [from final reconciled specialist output]
Next Workflow Use: [from specialist output, updated if the final approved Stitch result changes downstream usage]
```

The section MUST preserve these exact fields:
- `Product Type`
- `Recommended Direction`
- `Alternatives`
- `Color/Tone`
- `Typography`
- `Interaction Notes`
- `Anti-Patterns`
- `Implementation Checklist`
- `Conflict Status`
- `Winning Authority`
- `I-Wish Conflict Check`
- `Next Workflow Use`

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_iwish/config.yaml` and resolve:

- `project_name`, `output_folder`, `planning_artifacts`, `implementation_artifacts`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `date` as system-generated current datetime

### Paths

- `installed_path` = `{project-root}/.agent/workflows`
- `template_path` = `{installed_path}/template.md`
- `output_folder` = `{implementation_artifacts}/1. Epic & Story/Epic-{epic_id}/{story_key}` (derive {epic_id} from the first digit of {story_key}, e.g. story-1.1 -> Epic-1)
- `default_output_file` = `{output_folder}/ui-ux-spec.md`
- `design_system_path` = `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`
- `page_override_path` = `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md`
- `mkt_materials_dir` = `{output_folder_root}/mkt-materials/`

### UI/UX SKILL Integration

If `{project-root}/.agent/skills/ui-ux/SKILL.md` exists:
- Load the SKILL instructions for design system intelligence
- Use `--design-system` command for portal-specific style recommendations
- Cross-reference with existing UX spec design tokens

If `{project-root}/.agent/skills/ui-ux/SKILL.md` exists:
- Load the SKILL instructions for governed I-Wish story-level recommendation behavior
- Use it only after Design System Gate and User Simulation Gate pass
- Treat approved Design System, approved Stitch screens, extracted visual contract, User Simulation Guardian, Design Consultation, and UX Guardian as higher authority

### Design System Integration (Stitch, Figma, etc.) & Project Consistency ⚠️ MANDATORY

**Project Consistency Rule:**
- Every portal has a specific design project (Figma, Stitch, Claude Design, Canva, etc.) mapped to its `DESIGN.md`.
- For Stitch, read `{planning_artifacts}/design-system/{portal-slug}/stitch-project.json` for `projectId` and `assetId`. For other tools, read their respective configuration files.
- When making design generation or edit calls for a story, you **MUST** use the configured project identifier and design system asset for the portal that the screen belongs to.
- If a story requires screens for multiple portals (e.g., Admin and Webstore), you MUST separate the generation into different projects or files. **NEVER** generate/edit a Webstore screen inside the Admin design project.

**Sync Approval Flow:**
- After generating or editing screens/mockups and presenting them to the user, the agent MUST explicitly ask: *"Do you approve this design to be synchronized to the Design System?"*
- ONLY if the user says yes/approves, the agent may trigger the synchronization workflow (e.g. `/sync-stitch-design` for Stitch) or proceed to finalizing the design system on the server.

## 5-OPTION FRAMEWORK

Each story UI spec MUST include **5 visual options** for the story's key screen(s):

| Option | Method | Requirement |
|--------|--------|-------------|
| Option 1 | Design Flash (Stitch, Figma, Claude Design, etc.) | Dark variant |
| Option 2 | Design Flash (Stitch, Figma, Claude Design, etc.) | Light variant |
| Option 3 | Design Flash (Stitch, Figma, Claude Design, etc.) | Hybrid/Creative variant |
| Option 4 | `generate_image` AI mockup | High-fidelity static |
| Option 5 | HTML/CSS prototype | Interactive prototype |

**Context Injection for Design/Stitch calls:**
```
Product: {project_name}
Portal: {portal_name}
Story: {story_key} — {story_title}
Acceptance Criteria: {acceptance_criteria_bullets}
Persona: {persona} — {device}
Design System: Use configured Design System Asset ID (e.g. Stitch Asset ID {assetId} or Figma file/frame). If configured asset is missing, STOP and request user to sync design first.
Brand Assets: Check for image/vector assets in `_iwish-output/brand-identity/assets/` and explicitly enforce their usage (e.g., logo, icons) in the generated spec and UI option.
Page Override: load from {page_override_path} only when it exists for the active page/story context
Feature Hierarchy: include the full relevant portal section from feature-hierarchy.md — the complete sidebar/menu tree extracted as {portal_nav_tree} — so the design tool understands the navigation tree and feature placement context
UI-UX Story Notes: include only approved or non-conflicting story-level specialist guidance
Conflict Rule: approved screens and extracted visual contract remain authoritative if specialist guidance conflicts
```

## REQUIRED UI SPEC OUTPUT SECTIONS

The final story UI spec MUST include these sections in addition to the existing workflow artifacts:

### Navigation, Routing & Menu Placement
- Document the exact URL route/path mapping (e.g. `/admin/billing/invoices`).
- Specify the menu hierarchy: identify the Parent Menu/Tab and the Child/Sub-tab.
- Define the detailed Access Flow (step-by-step navigation path starting from home/landing).
- Outline active/highlight states for menus, sidebars, and breadcrumbs.
- Detail routing guards, auth check redirections, and navigation states (query parameters passed).

### User Simulation Results
- Personas tested
- Scenario overlays applied
- Non-linear paths identified
- Key recovery or edge-case findings

### UI-UX Orchestrator Notes
- Record the specialist output using the exact governed I-Wish contract template above
- Keep the notes story-specific and bounded by the approved portal Design System
- If a recommendation conflicts with approved Stitch screens or extracted visual contract, record it as rejected or downgraded advisory guidance
- Preserve `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`
- Reconcile the section again after final story-level Stitch approval so the conflict fields reflect the final approved visual contract, not a pre-approval draft

### Design/Stitch Visual Contract Protection
- State that approved design screens (Stitch, Figma, Claude Design, Canva, etc.) and extracted HTML/CSS visual contract remain authoritative for implementation
- Call out any specialist recommendation that was downgraded to checklist-only or advisory-only because of conflict with approved visual artifacts
- If a page override exists, state whether it actively shaped this story/page context or was superseded by an already approved design screen for the same page state

### [POST_DESIGN_ENRICHMENT_LOGIC]
- Mandatory placeholder section for dynamic interactions.
- If `Enrichment_Required: true`, this section MUST be populated by the `/enrich-ux` workflow AFTER design approval.
- Before design approval, leave this section empty with a note: "Pending `/enrich-ux` execution post-design approval."
- This section strictly decouples dynamic interaction from the static layout.

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
- Execute MKT Capture Pipeline: `{project-root}/.agent/workflows/mkt-capture-pipeline.md`
- Capture approved screen screenshot, design rationale, and MKT story
- Update knowledge base with design decision

## DESIGN HTML FIDELITY PIPELINE ⚠️ MANDATORY

> [!IMPORTANT]
> **This pipeline closes the design-to-code visual gap.** After design screens are approved, the agent MUST extract HTML/CSS to ensure coded output pixel-matches the approved design.

### Screen Selection Strategy (100% Design Coverage)

> [!CAUTION]
> **ALL screens MUST have a design representation before code extraction.** No screen may be coded without an approved visual. If a screen doesn't exist in the design tool yet, it MUST be generated or created and approved by the user.

Use this decision matrix to determine HOW each screen enters the Design System:

| Screen Type | Design Method | Example |
|---|---|---|
| **New layout** — no existing pattern in codebase | ✅ Generate/create on design platform (manual design) | List page, Create gallery, Form with review panel |
| **Mode variant** — light/dark of a key layout | ✅ Generate/create variant on design platform | Dark mode list page |
| **State variant** — loading, empty, error states | ✅ Generate on design platform referencing parent screen | Loading skeleton, empty state |
| **Responsive** — mobile/tablet breakpoint | ✅ Generate on design platform with device Type MOBILE/TABLET | Mobile list view |
| **Sub-flow** — modal, drawer, popover, toast | ✅ Generate/create on design platform | Delete confirmation, filter drawer |

**Rule:** Create key screens manually on design tool first (Tier 1). Generate remaining screens referencing Tier 1 as style anchors.

**Screen Mapping Table (REQUIRED in UI Spec output):**

| # | Screen Name | UI Spec Section | Design Screen ID | Tier | Status |
|---|-------------|----------------|------------------|------|--------|
| 1 | Example | §X | abc123... | 1 | ✅ Approved |

### HTML Export Extraction (Post-FINAL-Approval)

> [!CAUTION]
> **HTML/CSS style rules must be extracted from the FINAL approved version of design screens.**
> If user requests changes → edit screens in design tool → get re-approval → THEN extract HTML/CSS rules.
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
4. This mapping becomes the AUTHORITATIVE reference for dev-agent-story coding
```

### Visual Diff Verification (Post-Coding)

After coding FE tasks in `dev-agent-story`:

```
1. Run dev-agent server (`npm run dev-agent` or equivalent)
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

### Stitch-to-dev-agent Handoff Amendment

After Stitch screens are approved by user, **APPEND** this section to the UI Spec:

```
## §{N}. Stitch-to-dev-agent Handoff
> Auto-generated by /stitch-first-dev-agent after Stitch approval ({date})

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
(These become validator items in dev-agent-story checklist)

### Icon Assignment
| Location | Icon | Library | Import |
|----------|------|---------|--------|
(Every icon in Stitch → exact project import)
```

> [!IMPORTANT]
> This handoff section is the **SINGLE SOURCE OF TRUTH** for dev-agent-story implementation.
> dev-agent agent reads ONE file (UI Spec + Amendment) — no hunting across multiple docs.
> See `/stitch-first-dev-agent` workflow for full scoring and variant logic.

**Authority reminder for the handoff:**
- `UI-UX Orchestrator Notes` enrich story context but do not override the approved portal Design System or approved Stitch visual contract
- If any specialist recommendation was downgraded, the handoff must carry only the accepted checklist or advisory note, not the rejected source-of-truth change
- The handoff must use the post-approval reconciled version of `Conflict Status`, `Winning Authority`, and `I-Wish Conflict Check`

## EXECUTION

- ✅ YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- ✅ VERIFY Design System GATE before proceeding
- Load the workflow config: `{installed_path}/workflow.yaml`
- Load and follow the instructions: `{installed_path}/instructions.xml`
