# UX Standardization Questionnaire (4-Lens Framework)

This questionnaire is used during `/party-mode` (with UX, Dev, and PM agents) when initializing the project context or `DESIGN.md`. It establishes the global UI/UX standards that all stories must follow. Any output must be verified by `uip-ux-compliance-matrix.py`.

## Lens 1: User Intent (The "Why" and "What")
*Focus: What is the user trying to accomplish, and does the UX support that goal efficiently?*
1. **Data Grids & Tables:** When users view lists of data, what is their primary intent? (e.g., finding a specific item via search, sorting to find extremes, or filtering by status). Is the filter bar above the table or inline? Is search instant (debounced) or explicit submit?
2. **Bulk Actions:** Do users often need to apply actions to multiple items? If so, where does the bulk action menu appear when rows are selected?
3. **Destructive Actions:** When a user intends to delete or mutate data, do they need a confirmation modal, or is a simple "Undo" toast sufficient?

## Lens 2: Accessibility & Form (The "Who" and "Where")
*Focus: Is the interface usable by everyone, everywhere (devices, screen readers, global formats)?*
1. **Formatting & Localization (i18n):** How are numbers, currencies, and dates formatted to be universally understood? (e.g., `1,000.00`, ISO dates, relative time like "2 hours ago").
2. **Keyboard Navigation & ARIA:** Are table actions (e.g., inline row actions inside an ellipsis `...` menu) accessible via keyboard? 
3. **Contrast & Sizing:** Are click targets for row actions or pagination buttons large enough for touch devices?

## Lens 3: Tech Constraints (The "How" and "Limits")
*Focus: What are the engineering limitations, and how does the UX handle them gracefully?*
1. **Pagination vs. Infinite Scroll:** Based on backend limitations (e.g., database cursor vs offset), should the standard be numbered pagination, a "Load More" button, or infinite scrolling?
2. **Loading States:** How does the system indicate background processing? (e.g., skeleton loaders, spinners, or disabled buttons).
3. **Error Boundaries:** When an API fails (e.g., network error on a save action), how does the Notification Ecosystem respond? Are error Toasts persistent until dismissed?

## Lens 4: Unknowns (Edge Cases) (The "What If")
*Focus: Discovering blind spots, extremes, and unintended consequences.*
1. **Destructive Limits:** What happens if a user selects *all* 10,000 items for a bulk delete? How does the UI handle this extreme state?
2. **Empty States:** What does a table look like when there is no data? What is the CTA (Call to Action) in an empty state?
3. **Data Overflow:** If a text field (e.g., a long product name) exceeds the column width, does it truncate with an ellipsis, wrap to a new line, or break the layout?

**Output Generation:** The agents must debate these points using the 4 Lenses and output the agreed rules. The rules must be validated against `uip-ux-compliance-matrix.py` before committing to `DESIGN.md`.
