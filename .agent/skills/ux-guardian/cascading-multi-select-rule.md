# Cascading Multi-Select Rule

## Overview
When designing or implementing filter dashboards and complex forms, AI Agents MUST use a standard Cascading Multi-Select UX pattern instead of generic single-choice `<select>` tags, especially when data fields have relational dependencies.

## 1. Multiple Choice First
- Use `react-select` (or equivalent accessible MultiSelect components like the custom `MultiSelect` wrapper) for filter dropdowns.
- Never use a standard `<select>` tag if the user could conceivably want to select more than one option (e.g., filtering by multiple Staff members, multiple Departments, or multiple Providers).

## 2. Relational Dependencies (Cascading Filtering)
- The filter options must be context-aware and reactive. 
- If the user selects a value in Field A (e.g., Department: MKT), the options available in Field B (e.g., Staff) MUST be automatically filtered to only show valid intersecting options (e.g., only Staff belonging to MKT).
- **Two-way reactivity**: If the user selects Field B first (Staff: User A), then Field A (Department) should be filtered to only show the departments that User A belongs to.
- This creates an intuitive, high-UX discovery path and prevents users from selecting combinations that will always yield 0 results.

## 3. Implementation Checklist
1. Ensure the `MultiSelect` component handles arrays of selected items correctly.
2. The options generated for each dropdown must be computed *dynamically* during each render based on the current state of *other* active filters.
3. Use memoization (`useMemo`) or compute inside the render cycle (if cheap) to derive the dependent option lists before passing them to the dropdowns.
4. If options are fetched remotely, ensure the backend API supports `in` or `comma-separated` string arrays for filters, and that the query accounts for the dependencies.
