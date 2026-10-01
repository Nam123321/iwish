---
name: 'flow-stage-2a-design-gen'
description: 'Stage 2A of the /flow pipeline: DESIGN GENERATION (Mockups, HTML Preview, Nav Tree, Stitch MCP, UX Pattern Registry)'
---

# /flow-stage-2a-design-gen

This is Stage 2A of the 6-stage decomposed SDLC pipeline.

## Structured Handoff Verification
Before proceeding, you MUST verify that Stage 1 completed successfully. Check for the existence of `<story_dir>/spec-stage-evidence.json`. If missing, HALT and prompt the user to run `/flow-stage-1-spec`.

## Workflow Guidelines
**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response unless `--auto-approve` is set.

---

### Step 1: Feature Hierarchy & Nav Tree Extraction (HARD GATE)
1. **Locate Feature Hierarchy File**:
   - Read the canonical file at `_iwish-output/2. Product Planning/2.5. feature-hierarchy.md`.
   - If missing, HALT immediately and prompt the user to run `/create-epics-and-stories`.
2. **Identify Portal Context**:
   - Determine which portal this story belongs to (e.g., Tenant Portal, Admin Portal, Sales App, Webstore).
3. **Extract Feature Navigation Node**:
   - Match the screen/feature with the hierarchy tree in `feature-hierarchy.md`.
   - Extract the breadcrumb navigation path (e.g. `🌐 Tenant Portal -> 📊 Analytics -> Tenant Experience Dashboard`).
   - If the node is not yet listed, propose a structured navigation path, halt for user approval, and update `feature-hierarchy.md`.
4. **Embed into UI Spec**:
   - Ensure the Nav Tree path is physically written into `ui-spec.md` under the section `## Feature Hierarchy Nav Tree`.

---

### Step 2: Dynamic Design System SSOT & Stitch Resolution (ZERO HARD LINKS)
> ⚠️ **NO HARD LINKS RULE**: Agents are STRICTLY PROHIBITED from hardcoding literal Project IDs or Asset IDs. All identifiers must be dynamically resolved at runtime from the Design System SSOT.

1. **Locate Target Portal's Master Design File**:
   - Resolve portal slug from Story or Feature Hierarchy (e.g. `cowokai`, `admin-portal`, `webstore`).
   - Check `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`.
   - Fallback to Master Design System: `_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md`.
2. **Dynamically Extract Project & Asset Identifiers**:
   - Read the YAML frontmatter of the resolved `DESIGN.md` using `view_file`.
   - Extract:
     - `projectId` or `stitch_project_id` -> assign to `{resolved_project_id}`.
     - `assetId` or `stitch_asset_id` -> assign to `{resolved_asset_id}`.
   - If a `stitch-project.json` exists in that portal directory, read and inherit properties from it.
   - If either identifier is missing:
     - Call `call_mcp_tool("stitch", "list_projects", {})` to locate the project ID dynamically.
     - Call `call_mcp_tool("stitch", "list_design_systems", { "projectId": resolved_project_id })` to discover the asset ID.
3. **Load Design Tokens**:
   - Background: Warm Cream `--paper` (`#f3f1eb` / `#FDFBF7`) for Light Mode, Charcoal `--bg-dark` (`#0E1420`) for Dark Mode.
   - Surface: Pure White Glass / Surface `--surface` (`#faf9f5` / `rgba(255, 255, 255, 0.75)`).
   - Text / Ink: Deep Charcoal `--ink` (`#20221f` / `#18181B`).
   - Accents: Cobalt Blue `--color-primary-cobalt` (`#0057FF`), Cyan Glow `--color-secondary-cyan` (`#00D4FF`), Cam san hô / Dopamine `--color-accent-orange` (`#e45a2b` / `#FF8A00`).

---

### Step 2.5: UX Pattern & Component Registry Alignment (HARD GATE)
> 🛡️ **CONSISTENCY & LEVERAGE RULE**: To prevent UI fragmentation and code duplication, every story design MUST inspect and leverage existing registered UX patterns from `DESIGN.md` Section 5.

1. **Scan Registered UX Component Patterns**:
   - Read Section 5 of `DESIGN.md` (`## 5. UI Component Layouts (Đặc tả tương tác cấu phần)`).
   - Review the 28 canonical registered patterns:
     - *Navigation & Shell*: Sidebar [5.1], Topbar [5.2], Command Palette [5.19].
     - *Cards & Workspaces*: Bento / Kanban Cards [5.3], Workflow Lane [5.7], Work List [5.8], Agent Workspace UI Panel (Bento accordion & Master-detail) [5.29].
     - *Buttons & Interactivity*: Primary Button [5.4], Tactile Elastic Button [5.5], Chat Bubble (AI Staff Model Pill) [5.6], Model Panel [5.9].
     - *Data & Analytics*: Metric Line [5.10], DataTableView [5.21], AdvancedFilterBar [5.22], Dashboard Analytics Widgets [5.23], Realtime Heatmap [5.24], Floating Bulk Action Bar [5.18], MultiSelect [5.17], Diff Viewer [5.15], Status/Beta Badges [5.20].
     - *Drawers & Modals*: RightDrawer (Resize drag handle & double-click toggle) [5.25], Modal [5.26], In-Flow Config Drawer [5.11.1], Toast UI (`sonner`/`useToast`) [5.12].
   - Cross-check physical component files in `src/components/ui/` or `src/components/`.
2. **Build Component Leverage Alignment Matrix**:
   - Match each UI element required by Story Acceptance Criteria against Section 5 patterns.
   - Embed this matrix into `ui-spec.md` under `## Registered UX Patterns & Components Alignment`:
     ```markdown
     | Story Widget / AC Feature | Matched Registry Pattern | Section in DESIGN.md | Physical Code Path | Leverage Decision (Reuse / Extend / Propose New) |
     |---|---|---|---|---|
     | Metric Cards | Metric Line (Manrope 22/700, 4 cells) | Section 5.10 | CSS Token / Semantic | REUSE |
     | Analytics Charts | Dashboard Analytics Widgets (1.6fr / 0.8fr) | Section 5.23 | `src/components/ui/DashboardWidgets/` | REUSE |
     | Table Filter | AdvancedFilterBar (multi-condition) | Section 5.22 | `src/components/ui/AdvancedFilterBar.tsx` | REUSE |
     | Item Details Panel | RightDrawer (360px - 88vw, drag handle) | Section 5.25 | `src/components/ui/RightDrawer.tsx` | REUSE |
     ```
3. **Anti-Duplication Justification (Zero-Trust)**:
   - If any new component is proposed that does not match Section 5, the agent MUST write a justification explaining why none of the 28 registered patterns are suitable.

---

### Step 3: Stitch MCP Mockup Generation & Asset Registration
1. **Invoke Stitch MCP with Dynamic Parameters**:
   Call `call_mcp_tool` with server `stitch` and tool `generate_screen_from_text`, passing dynamic `{resolved_project_id}` and `{resolved_asset_id}`:
   ```json
   {
     "ServerName": "stitch",
     "ToolName": "generate_screen_from_text",
     "Arguments": {
       "projectId": "{resolved_project_id}",
       "designSystem": "{resolved_asset_id}",
       "deviceType": "DESKTOP",
       "prompt": "Context: Cowok.ai Portal, Persona: COO / Tenant Admin. MUST incorporate registered UX patterns: Metric Line [Section 5.10] for KPIs, Bento Cards [Section 5.3] in Asymmetric Grid [Section 5.23] for charts, DataTableView [Section 5.21] with AdvancedFilterBar [Section 5.22], and RightDrawer [Section 5.25] for details inspector."
     }
   }
   ```
2. **Execute Asset Registration Script (HARD GATE)**:
   - Extract the generated screen ID / resource name from the Stitch MCP response (e.g. `screen.name` format `projects/{projectId}/screens/{screenId}`).
   - Immediately execute the official registration script to update the Mockup ID into `ui-spec.md`:
     ```bash
     python3 .agent/scripts/register-design-asset.py \
       --file "<story_dir>/ui-spec.md" \
       --screen "<Screen_Title>" \
       --tool "Stitch" \
       --id "<screen_id_or_url>"
     ```
   - The script performs input sanitization, directory validation, and atomic write to update the `### Screen Registry` section in `ui-spec.md`.
   - Verify script output: `SUCCESS: Design asset registered for '<Screen_Title>'.`
   - *Note: Cryptographic human approval signature will be verified and signed in Stage 2B.*

---

### Step 4: Semantic Zero-Logic HTML Preview Generation
1. **Physical Preview File**:
   - Hierarchical Layout: `<story_dir>/preview.html`
   - Flat Layout: `_iwish-output/stories/html-preview-story-{story_id}.html`
2. **Enforce Registered Pattern Semantics**:
   - Zero-logic HTML + CSS.
   - Use semantic tags and CSS variables matching `DESIGN.md` (e.g. `var(--paper)`, `var(--surface)`, `var(--color-primary-cobalt)`).
   - Replicate the exact DOM structure of registered components (e.g. Metric Line 4-cell grid, Bento card with 16px radius and dopamine indicator border, RightDrawer container).
   - **FORBIDDEN**: Arbitrary inline Tailwind utility sprawl (e.g. `bg-purple-600`, `text-indigo-400`).

---

### Step 5: Platform AI Consultation & Socratic Debate Gate
1. **Consultation Request Verification**:
   - Check if Stitch Native AI returned design or UX recommendations during mockup generation.
   - If NO recommendations were returned, record explicitly:
     `"Request for consultation was sent to Native AI, but no recommendations were returned. Fallback to internal UX evaluation."`
2. **Internal Socratic Debate**:
   - Orchestrate a debate between `ux-agent` (visual consistency & ergonomics) and `dev-agent` (data contracts & layout feasibility).
3. **Mandatory Documentation**:
   - Write the finalized debate conclusions into `ui-spec.md` under:
     `## Platform AI Consultation & Debate Report`

---

## Handoff to Stage 2B (Design Approval & Baseline Lock)
Once Steps 1 through 5 are completely executed and verified:
1. Generate the Stage 2A evidence lock:
   ```bash
   echo '{"stage": "2A", "status": "completed", "previewHtml": "preview.html", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > <story_dir>/design-gen-evidence.json
   ```
2. Prompt the user to invoke `/flow-stage-2b-design-approve` (or auto-trigger if `--auto-approve` is set).
3. ⚠️ **WARNING**: In Stage 2B, the pipeline MUST HARD STOP at Human Gate 3.0 to present the preview and require human review.
