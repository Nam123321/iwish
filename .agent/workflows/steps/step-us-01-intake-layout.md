# Step US-01: Intake & Layout (Creative Phase)

**Goal:** Establish the fundamental structure, navigation, and layout of the UI based on story requirements and the portal's design system.

## 1. Context Loading (Intake)
- **Story File:** Read the target story file to extract the Acceptance Criteria (AC).
- **Feature Hierarchy:** Read `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md` (or equivalent `*hierarchy*.md`).
  - **GATE:** If the Feature Hierarchy does not exist, HALT. (UI Spec cannot be created without a Feature Hierarchy).
- **Design System:** Read the portal's `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`.
  - **GATE:** If the Design System does not exist, HALT. (UI Spec cannot be created without a portal Design System).
- **Page Overrides:** Check for page-specific overrides in `{planning_artifacts}/design-system/{portal-slug}/pages/{page-slug}.md`.

## 2. Navigation Extraction
1. Identify the portal for the story (Admin, Webstore, Sales, SaaS, etc.).
2. Extract the portal's sidebar/menu tree hierarchy path (Nav Tree) for the feature.
3. If not found in the hierarchy, propose a path, ask the user for approval, and update `feature-hierarchy.md` upon approval.
4. Store this path as `{portal_nav_tree}`.

## 3. Output Generation: Structure & Layout
Generate the following sections for the UI Spec:
- **Navigation, Routing & Menu Placement:** Include the URL route, Parent/Child menu mapping, and the exact `{portal_nav_tree}`.
- **Component Hierarchy Layout Diagram:** Create a Mermaid diagram representing the layout of the page's components (headers, panels, sidebars, grids, forms, list views).
- **Responsive Breakpoint Skeleton:** Define how the layout adapts to MOBILE/TABLET breakpoints.

*Proceed to Step US-02 once this structure is defined.*
