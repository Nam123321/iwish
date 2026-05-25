---
name: 'stitch-first-Vegeta'
description: 'Orchestrator workflow for Stitch-First Development. Calculates Stitch Score to determine if screens need Stitch creation/update, manages variant linking, and produces UI Spec Amendment for Vegeta handoff.'
---

# Stitch-First Development Workflow

**Goal:** Ensure every UI change is grounded in an approved Stitch design. This workflow calculates whether Stitch work is needed, manages design versioning, and produces a Vegeta-ready handoff.

**When to use:** Automatically triggered by `/Vegeta-story` gate when a story has [FE] tasks. Can also be called standalone for UX iteration.

---

## PHASE A: Stitch Necessity Scoring

### Step A.1 — Gather Scoring Inputs

```
1. Load the story file → extract [FE] task list
2. Load UI Spec (if exists): ui-specs/{story-key}-ui-spec.md
3. Load existing Stitch project for target portal:
   - Check stitch-project-registry.json (if exists)
   - OR call mcp_StitchMCP_list_projects() to find portal project
4. Call mcp_StitchMCP_list_screens(projectId) to get current screen inventory
```

### Step A.2 — Calculate Stitch Score

```
Score each factor (0-5 scale per factor):

┌─────────────────────────────────────────────────────────────────────────────┐
│ F1: LAYOUT CHANGE (weight ×2)                                               │
│   0 = No layout change (text/data fix only)                                 │
│   1 = Spacing/padding/margin adjustment                                     │
│   2 = Component repositioning within existing layout                        │
│   3 = New section/area within existing page                                 │
│   4 = New page using existing layout patterns                               │
│   5 = Entirely new page type / layout pattern                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ F2: NEW VISUAL COMPONENTS (weight ×2)                                       │
│   0 = Zero new components (reuses all existing)                             │
│   1 = 1 new component (e.g., new badge type)                                │
│   2 = 2-3 new components                                                    │
│   3 = 4-5 new components                                                    │
│   4 = 6+ new components                                                     │
│   5 = New component system / pattern library                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ F3: USER-FACING IMPACT (weight ×1)                                          │
│   0 = Internal/admin-only, minimal visibility                               │
│   1 = Admin Portal (Chủ NPP/Kế toán)                                       │
│   2 = Customer-facing (Webstore OR Sales Web)                               │
│   3 = Cross-portal (appears on multiple portals)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ F4: DESIGN SYSTEM GAP (weight ×1)                                           │
│   0 = All tokens/components already exist                                   │
│   1 = 1-2 new CSS variables needed                                          │
│   2 = New component pattern (not in UI-SPEC.md)                             │
│   3 = New visual language or interaction paradigm                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ F5: EXISTING STITCH COVERAGE (weight ×1)                                    │
│   0 = Page has current, approved Stitch screen                              │
│   1 = Stitch screen exists but is outdated (>1 sprint old or specs changed) │
│   2 = Partial Stitch coverage (some states/views missing)                   │
│   3 = No Stitch screen exists for this page at all                          │
└─────────────────────────────────────────────────────────────────────────────┘

FORMULA:
  Raw = (F1 × 2) + (F2 × 2) + F3 + F4 + F5
  Max = (5 × 2) + (5 × 2) + 3 + 3 + 3 = 29
  Stitch Score = Round(Raw / 29 × 10)  → 0-10
```

### Step A.3 — Apply Decision

```
┌─────────────────────────────────────────────────────────────────┐
│                    STITCH SCORE DECISION MATRIX                  │
├──────────┬──────────────────────────────────────────────────────┤
│ Score    │ Action                                                │
├──────────┼──────────────────────────────────────────────────────┤
│ 0-3      │ ⏭️ SKIP STITCH                                       │
│          │ → Proceed directly to Vegeta-story implementation        │
│          │ → Still enforce Design System GATE (MASTER.md)        │
│          │ → Log: "Stitch Score {n}/10 — skipped (minor change)" │
├──────────┼──────────────────────────────────────────────────────┤
│ 4-6      │ 🔄 STITCH VARIANT                                    │
│          │ → Create variant of existing screen (Phase B.1)       │
│          │ → New version sits next to v(n-1) in Stitch project   │
│          │ → User approves variant before code extraction        │
├──────────┼──────────────────────────────────────────────────────┤
│ 7-10     │ 🆕 FULL STITCH                                       │
│          │ → Generate new screens on Stitch (Phase B.2)          │
│          │ → Full UI Spec → Stitch → Approve cycle               │
│          │ → Run complete /stitch-to-code workflow                │
└──────────┴──────────────────────────────────────────────────────┘

PRESENT to user:
"📊 Stitch Score: {score}/10
  F1 Layout: {f1}/5 | F2 Components: {f2}/5 | F3 Impact: {f3}/3 | F4 Gap: {f4}/3 | F5 Coverage: {f5}/3
  → Decision: {SKIP / VARIANT / FULL STITCH}
  
  Proceed? (Y / Override score / Skip)"
```

> [!IMPORTANT]
> User can ALWAYS override the score. If user says "tạo Stitch" even on score 2, comply.

---

## PHASE B: Stitch Design Creation/Update

### Phase B.1 — Variant of Existing Screen (Score 4-6)

```
1. Identify the existing Stitch screen(s) that need updating
   - Match by page name from Screen Mapping Table in UI Spec
   - If no mapping exists, search by screen title in Stitch project

2. Generate variant(s) next to the original:
   Call mcp_StitchMCP_generate_variants({
     projectId: "{portal-project-id}",
     selectedScreenIds: ["{existing-screen-id}"],
     prompt: "Create a variation with these changes: {describe changes from story ACs}. 
              Keep the same design language, colors, and typography as the original.",
     variantOptions: {
       numberOfVariants: 2,
       creativeRange: "CONSERVATIVE",
       aspects: ["LAYOUT"]  // or CONTENT, STYLE as needed
     }
   })

3. Rename the variant for version tracking:
   - Original: "Order List" (kept as-is)
   - Variant:  "Order List v2 — Bento Grid + Status Cards"
   
   Call mcp_StitchMCP_edit_screens({
     projectId: "{portal-project-id}",
     selectedScreenIds: ["{variant-screen-id}"],
     prompt: "Rename to: {Screen Name} v{N} — {change summary}"
   })

4. PRESENT side-by-side to user:
   "🔄 Variant created for '{Screen Name}':
    - Original (v1): [Stitch link / screen ID]
    - New (v2): [Stitch link / screen ID]
    
    Approve v2? (Approve / Edit / Regenerate / Keep v1)"

5. If user wants edits → call mcp_StitchMCP_edit_screens with feedback
6. Once approved → update Screen Mapping Table: screenId = new variant ID, version = v{N}
```

### Phase B.2 — Full Stitch Generation (Score 7-10)

```
1. Run /stitch-to-code workflow Phase 1 (Screen Inventory)
   - This handles Tier classification and gap resolution
   - ALL Tier 3 screens generated on Stitch
   - User approves each screen

2. For pages that already had previous Stitch versions:
   - Keep old screen in project (don't delete)
   - Name new: "{Screen Name} v{N} — {story key}"
   - This preserves visual history

3. Return to this workflow after stitch-to-code Phase 1 completes
```

---

## PHASE C: UI Spec Amendment — Stitch-to-Vegeta Handoff

> [!IMPORTANT]
> This phase runs AFTER Stitch screens are approved. It AMENDS the existing UI Spec (appends, does not replace).

### Step C.1 — Generate Handoff Section

```
Append the following section to ui-specs/{story-key}-ui-spec.md:

---

## §{N}. Stitch-to-Vegeta Handoff
> Auto-generated by /stitch-first-Vegeta after Stitch approval ({date})

### Screen Registry

| # | Screen | Stitch ID | Version | Tier | Previous Version | Device |
|---|--------|-----------|---------|------|------------------|--------|
(Fill from Screen Mapping Table — include previous version ID for variant tracking)

### Component-to-Code Mapping

| Stitch Component | Project Component | Library | Import |
|-----------------|-------------------|---------|--------|
(Map each visual element to actual code: antd component, icon library, custom CSS)

### New CSS Variables (if any)

| Variable | Value | Usage |
|----------|-------|-------|
(Only if story requires tokens not yet in var(--admin-*) system)

### Key Visual Rules

- [ ] {Rule 1 from Stitch — e.g., "Cards use 2×2 grid, NOT linear row"}
- [ ] {Rule 2 — e.g., "Table header uses var(--admin-table-header-bg)"}
- [ ] {Rule 3 — e.g., "Action buttons are icon-only, width 36px"}
(These become CHECKABLE items in Vegeta-story DoD)

### Icon Assignment

| Location | Icon | Library | Import |
|----------|------|---------|--------|
(Every icon visible in Stitch screen → mapped to exact import)
```

### Step C.2 — Validate Handoff Completeness

```
Before proceeding to code:
- [ ] Every screen in UI Spec has a Stitch ID in the registry
- [ ] Every visual component is mapped to a project component
- [ ] Every icon has a library assignment
- [ ] Key Visual Rules are specific and checkable (not vague)
- [ ] New CSS variables (if any) are documented with values
```

---

## PHASE D: Proceed to Implementation

```
1. If called from Vegeta-story gate:
   → Return control to Vegeta-story with:
     - Stitch Score result
     - UI Spec Amendment path
     - Screen IDs for extraction
   → Vegeta-story runs /stitch-to-code Phases 2-5 (Extract → Adapt → Assemble → Validate)

2. If called standalone:
   → Output: "✅ Stitch-First workflow complete. Ready for /Vegeta-story."
   → Point to amended UI Spec as the single source of truth
```

---

## INTEGRATION POINTS

### Called BY:
- **`/Vegeta-story`** — Auto-gate for stories with [FE] tasks
- **Manual** — `/stitch-first-Vegeta` for UX iteration

### Calls:
- **`/stitch-to-code`** — Sub-workflow for code extraction (Phases 2-5)
- **Stitch MCP** — `list_screens`, `generate_variants`, `edit_screens`, `generate_screen_from_text`

### Updates:
- **UI Spec** — Appends §N Stitch-to-Vegeta Handoff section
- **Screen Mapping Table** — Updates screen IDs, versions, tiers

### Referenced by:
- **`/code-review`** — Verifies implementation matches Stitch-to-Vegeta Handoff rules
- **`/create-ui-spec`** — Produces initial UI Spec that this workflow amends

---

## QUICK REFERENCE: Stitch Score Examples

| Story | F1 | F2 | F3 | F4 | F5 | Score | Action |
|-------|----|----|----|----|----|----|--------|
| Fix button color in Orders | 0 | 0 | 1 | 0 | 0 | **1** | ⏭️ Skip |
| Add filter to Product table | 1 | 1 | 1 | 0 | 1 | **2** | ⏭️ Skip |
| Redesign Order status cards | 3 | 3 | 1 | 1 | 1 | **6** | 🔄 Variant |
| New Incentive dashboard page | 5 | 4 | 2 | 2 | 3 | **9** | 🆕 Full Stitch |
| CTKM UI consistency fix | 2 | 1 | 1 | 0 | 2 | **4** | 🔄 Variant |
