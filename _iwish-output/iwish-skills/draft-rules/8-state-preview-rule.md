---
name: 8-state-preview-rule
description: Guidelines for generating interactive 8-state preview HTML pages for components.
inputs: [component_html, component_css]
outputs: [preview_html_path]
mcp_tools_required: []
subagent_triggers: []
---

# UI Verification: 8-State Interactive Preview

This rule mandates that developers generate a single `.preview.html` file stacked vertically to verify custom-themed interactive elements (like buttons, input fields, custom cards, and select lists) across all standard interactive states.

---

## 1. The Eight Interactive States

Every preview file must render the target element in each of the following states:

1.  **Default (Normal)**: The component's standard resting state.
2.  **Hover**: The visual state when the mouse cursor rests on the component.
3.  **Active**: The state when the component is clicked or pressed.
4.  **Focus**: The state when the component is focused via keyboard (using `:focus-visible` or immediate outline rings).
5.  **Disabled**: The state when the component has `disabled` or `.is-disabled` set (showing reduced opacity, no hover reactions, and `cursor: not-allowed`).
6.  **Loading**: The state when the component is performing an action (cursor wait state, showing a spinner or loading label).
7.  **Selected / Active State**: The state when the component is toggled or marked as active (e.g., a selected grid item or active nav link).
8.  **Error**: The state when the component displays validation or operational errors.

---

## 2. Preview File Structure

-   Save previews as `[component-name].preview.html` in the component directory.
-   Combine the component's HTML markup and CSS styling inside the file.
-   Display all 8 states in a single vertical scrollable column with clear, uppercase label headers (e.g., `DEFAULT STATE`, `HOVER STATE`).
-   Use CSS classes or inline modifiers to trigger the respective states statically in the preview (e.g., adding `.is-loading`, `.has-error`, or forcing simulated focus styling).
