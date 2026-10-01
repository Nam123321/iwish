---
name: 'stitch-to-code'
description: 'Extract code from approved Stitch designs and adapt to project design system. Ensures ALL screens go through Stitch before development.'
---

# Stitch-to-Code Workflow

**Goal:** Extract HTML/CSS code from approved Google Stitch screens and adapt them to the project's CSS Variable design system. Ensures visual fidelity between design and implementation.

**When to use:** Before implementing any [FE] task that has a UI Spec with Stitch references. This workflow runs BETWEEN `create-ui-spec` (design approval) and `Vegeta-story` (implementation).

---

## INSTRUCTIONS FOR EXECUTION:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_bmad/bmm/workflows/4-implementation/stitch-to-code/workflow.yaml
3. Pass the yaml path @{project-root}/_bmad/bmm/workflows/4-implementation/stitch-to-code/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and execute the 5 phases of code extraction
</steps>

---

## PREREQUISITES

Before running this workflow:
1. ✅ UI Spec MUST exist and be **approved** by user
2. ✅ Stitch project MUST exist with at least 1 approved screen
3. ✅ Design System MASTER.md MUST exist for the target portal
4. ✅ UI-SPEC.md (CSS Variable token map) MUST exist

---

## PHASE 1: Screen Inventory

### Step 1.1 — Load UI Spec & Extract Screen List

```
1. Read the UI Spec file for the current story
2. Extract ALL screens/views described in the UI Spec
3. Create a Screen Inventory Table:

| # | Screen Name | UI Spec Section | Stitch Screen ID | Version | Tier | Status |
|---|-------------|----------------|------------------|---------|------|--------|
| 1 | Order List  | §2              | abc123...        | v2      | 1    | ✅ Ready |
| 2 | Order Detail| §3              | def456...        | v1      | 1    | ✅ Ready |
| 3 | Print View  | §4              | —                | —       | 3    | ⏳ Need Stitch |
```

### Step 1.2 — Map Screens to Stitch Project

```
1. Call `mcp_StitchMCP_list_screens(projectId)` to get all screens in the Stitch project
2. Match each UI Spec screen to a Stitch screen by:
   - Screen title/description matching
   - Visual content matching
   - Position/order matching
3. Assign Tiers:
   - Tier 1: Screen HAS a direct Stitch match
   - Tier 2: Screen shares 80%+ components with a Tier 1 screen (e.g., same table layout, different data)
   - Tier 3: Screen has NO Stitch match → MUST be generated
```

### Step 1.2b — Variant Linking (for updated screens)

> If a Stitch screen exists but the story requires visual changes (Stitch Score 4-6), create a VARIANT rather than editing the original.

```
For each screen that needs updating (existing screen + new requirements):
1. Call mcp_StitchMCP_generate_variants({
     projectId, selectedScreenIds: [existingId],
     prompt: "Variation with: {changes}. Keep same design language.",
     variantOptions: { numberOfVariants: 2, creativeRange: "CONSERVATIVE", aspects: ["LAYOUT"] }
   })
2. Rename variant: "{Screen Name} v{N} — {change summary}"
3. Present BOTH versions to user for side-by-side comparison
4. User approves → update Screen Inventory with new screen ID + version
5. Old screen stays in project (visual history preserved)
```

### Step 1.3 — Tier 3 Gap Resolution (MANDATORY)

> [!CAUTION]
> **NO SCREEN MAY PROCEED TO CODE WITHOUT A STITCH-APPROVED VISUAL.**
> If Tier 3 screens exist, they MUST be created on Stitch BEFORE any code extraction begins.

```
For each Tier 3 screen:
1. Build a detailed prompt describing the screen:
   - Reference the portal's Design System MASTER.md for visual style
   - Reference Tier 1 screens as style anchors: "Match the visual style of screens [IDs]"
   - Include all UI Spec requirements for this screen (layout, components, data)
   - Specify device type (DESKTOP/MOBILE/TABLET)

2. Call `mcp_StitchMCP_generate_screen_from_text`:
   - projectId: same Stitch project as Tier 1 screens
   - prompt: the detailed screen description
   - deviceType: match the project's device type

3. PRESENT the generated screen to the user for review:
   - "🎨 Screen #{n} '{name}' đã được tạo trên Stitch. Vui lòng review:"
   - Show the Stitch project link
   - Ask: "Approve / Edit / Regenerate?"

4. If user requests edits:
   - Call `mcp_StitchMCP_edit_screens` with user's feedback
   - Re-present for review
   
5. If user requests variants:
   - Call `mcp_StitchMCP_generate_variants` with options
   - User selects preferred variant

6. Once approved → Move screen from Tier 3 to Tier 1

7. REPEAT until ALL screens are Tier 1 or Tier 2 — NO Tier 3 remaining
```

**Output:** Updated Screen Inventory Table with ALL screens at Tier 1 or 2, zero Tier 3.

---

## PHASE 2: Code Extraction

### Step 2.1 — Extract Code from Stitch

```
For each Tier 1 screen (in order):
1. Call `mcp_StitchMCP_get_screen`:
   - projectId: the Stitch project ID
   - screenId: the mapped screen ID
   - name: "projects/{projectId}/screens/{screenId}"
   
2. From the response, extract:
   - HTML structure (component hierarchy)
   - CSS styles (colors, spacing, typography, layout)
   - Component patterns (cards, tables, buttons, badges, inputs)
   
3. Save extracted code to a temporary reference file:
   - Path: /tmp/stitch-extract/{screenId}.html
   - Include both HTML and inline CSS
```

### Step 2.2 — Build Component Registry

```
From ALL Tier 1 extractions, build a Component Registry:

| Component | Source Screen | CSS Properties | Reusable? |
|-----------|-------------|----------------|-----------|
| StatusCard | screen-abc  | bg, border, radius, padding | ✅ |
| DataTable  | screen-abc  | header-bg, row-height, font | ✅ |
| ActionBtn  | screen-def  | gradient, padding, radius   | ✅ |

This registry is used for:
- Tier 2 screens: clone components directly
- Ensuring consistency across all screens
```

---

## PHASE 3: Token Adaptation

### Step 3.1 — Map Stitch CSS → Design System Variables

```
For each extracted CSS property, map to the project's CSS Variable system:

TRANSFORMATION RULES:
┌─────────────────────────────────┬──────────────────────────────────┐
│ Stitch Output                   │ Project Token                    │
├─────────────────────────────────┼──────────────────────────────────┤
│ background: #FFFFFF             │ var(--admin-surface)             │
│ background: #F8FAFC             │ var(--admin-bg)                  │
│ background: #F8FAFC (header)    │ var(--admin-table-header-bg)     │
│ color: #1E293B                  │ var(--admin-text)                │
│ color: #64748B                  │ var(--admin-text-secondary)      │
│ color: #94A3B8                  │ var(--admin-text-muted)          │
│ border: #E2E8F0                 │ var(--admin-border)              │
│ border: #F1F5F9                 │ var(--admin-border-secondary)    │
│ accent/primary: #2563EB         │ var(--admin-primary)             │
│ accent hover: #1D4ED8           │ var(--admin-primary-hover)       │
│ success: #16A34A                │ var(--admin-success)             │
│ warning: #F59E0B                │ var(--admin-warning)             │
│ error: #EF4444                  │ var(--admin-error)               │
│ info: #3B82F6                   │ var(--admin-info)                │
└─────────────────────────────────┴──────────────────────────────────┘

FONT RULES:
- Stitch font → font-family: var(--font-sans) [Inter]
- Monospace content (IDs, codes) → font-family: var(--font-mono) [JetBrains Mono]

ICON RULES (per unified strategy):
- Sidebar/Menu → @ant-design/icons (Outlined)
- Page content → lucide-react (stroke-width: 1.5)
- Status/feedback → @ant-design/icons (Outlined)
- NEVER mix libraries in the same component
```

### Step 3.2 — Generate Adapted Component Code

```
For each screen:
1. Take the Stitch HTML structure as the component skeleton
2. Replace ALL hardcoded colors with CSS variables (per Step 3.1)
3. Replace Stitch's generic classes with Tailwind arbitrary values:
   ❌ style="background: #1E293B"
   ✅ className="bg-[var(--admin-surface)]"
4. Map Stitch components to project equivalents:
   - If Ant Design component exists → use it (Table, Modal, Form, etc.)
   - If custom component needed → use CSS variables only
5. Save adapted code for each screen
```

---

## PHASE 4: Assembly & Gap Check

### Step 4.1 — Assemble Full Page

```
1. Combine all screen components into the target page/component file
2. Add React state, hooks, API calls (business logic from story's acceptance criteria)
3. Ensure imports follow the unified icon strategy:
   - import { XOutlined } from '@ant-design/icons'  // for status/feedback
   - import { SomeIcon } from 'lucide-react'        // for page content
```

### Step 4.2 — Coverage Verification

```
Verify 100% coverage:
- [ ] Every screen in UI Spec has an implemented component
- [ ] Every component uses CSS variables (grep for hardcoded hex → must be zero)
- [ ] Every icon import follows the unified strategy
- [ ] Every Ant Design component is used where UI-SPEC.md §6 mandates
- [ ] No ad-hoc Tailwind colors (bg-slate-*, text-red-*, etc.) without var()
```

---

## PHASE 5: Visual Validation

### Step 5.1 — Browser Screenshot Comparison

```
1. Run the Vegeta server (npm run Vegeta)
2. Open the implemented page in browser
3. Take a screenshot of each screen/state
4. Compare against Stitch renders:
   - Layout alignment: header, sidebar, content area positioning
   - Color matching: primary, surface, text colors
   - Typography: font family, sizes, weights
   - Spacing: padding, margins, gaps
   - Component shapes: border radius, shadows
5. Report any discrepancies to user for decision
```

### Step 5.2 — Design System Compliance Check

```
Run these automated checks:
1. grep -r "bg-slate-\|bg-red-\|bg-blue-\|bg-green-\|text-white\b" [target files]
   → Must return ZERO matches (all should be var(--admin-*))
2. Verify no mixed icon imports in same component
3. Check that Ant Design components are used per UI-SPEC.md §6:
   - Data tables → antd Table (not custom)
   - Forms → antd Form + Input + Select
   - Modals → antd Modal / Popconfirm
```

---

## OUTPUT CHECKLIST

Before marking this workflow as complete:

- [ ] Screen Inventory Table — 100% Tier 1/2, zero Tier 3
- [ ] All Stitch screens extracted and code saved
- [ ] All CSS transformed to `var(--admin-*)` tokens
- [ ] Component Registry documented
- [ ] Zero hardcoded colors in output code
- [ ] Icon strategy compliance verified
- [ ] Browser screenshot matches Stitch renders
- [ ] User approved final visual output

---

## INTEGRATION HOOKS

This workflow is:
- **Called by `/stitch-first-Vegeta`** — Parent orchestrator triggers this after Stitch Score ≥4
- **Called by `/Vegeta-story`** — Via Stitch-First Gate (checklist item: "Stitch-First Gate")
- **Can be called standalone** — `/stitch-to-code` for manual extraction

Outputs consumed by:
- **`/Vegeta-story`** — Uses extracted code as implementation base
- **`/create-ui-spec`** — Produces Screen Mapping Table that this workflow reads
- **`/code-review`** — Verifies implementation matches extraction (CSS tokens, icons, layout)
