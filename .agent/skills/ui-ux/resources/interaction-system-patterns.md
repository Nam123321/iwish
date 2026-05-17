# Reusable UX Patterns & Interaction System

This resource file curates the highly reusable interaction rules and UX patterns extracted from the UI/UX Pro Max dataset. It serves as "evidence" and "raw material" for the UI/UX Pro Max Specialist to provide richer guidance during component design and review.

> **CRITICAL RULE (Retrieval-Sandwich):** All patterns in this file are *recommendations*, not authority. They MUST NOT override BMAD's `UX Guardian`, `Design Consultation`, or `Stitch Visual Contract` rules.

## 1. Core Interaction System Rules

### Hover & Focus
- **Hover States:** All interactive elements must exhibit a distinct visual change on hover (e.g., slight background darkening, opacity shift, or subtle transform). Changes should be smooth and utilize standard transition timings (e.g., `150ms ease-in-out`).
- **Focus Rings:** Ensure highly visible focus rings for keyboard navigation. Do not rely solely on outline removal without providing a robust, high-contrast alternative indicator. The focus ring should comfortably wrap the element and not clip into adjacent interactive boundaries.

### Touch Targets
- **Minimum Size:** All tappable UI elements on mobile or responsive viewports must have a minimum target area of `44x44px` (or `48x48px` depending on platform standards) to prevent mis-taps. Snap these recommendations to the closest approved Design System spacing token (e.g., `h-11`, `h-12`). Touch target spacing should allow for clumsy interaction.

### Motion & Transitions
- **Reduced Motion:** Respect user system preferences. When `prefers-reduced-motion` is enabled, disable or heavily restrict scaling, bouncing, and sliding animations, falling back to simple opacity fades.
- **Micro-interactions:** Use micro-interactions to reward user actions (e.g., button press depression effect, subtle checkmark draw). Keep durations under `200ms` to avoid feeling sluggish, mapping to Design System duration tokens (e.g., `duration-150`).

### Accessibility (A11y) Contrast
- **Text Readability:** Maintain WCAG AA standard contrast ratios (4.5:1 for normal text, 3:1 for large text), unless project NFRs explicitly require WCAG AAA. Avoid low-contrast subtle text for critical UI labels.
- **Iconography:** Use crisp SVG icons instead of emojis to ensure scaling and semantic clarity.

## 2. Highly Reusable UX Patterns

### 2.1. Sticky Contexts
- **Sticky Filters / Headers:** For long data tables or scrolling feeds, the search/filter row and table header should remain sticky at the top to preserve context. Complex "advanced" chips may scroll away, but primary controls should be frozen.

### 2.2. Batch Actions & Non-Destructive Friction
- **Action Toasts:** For non-destructive batch operations (e.g., "archive", "mark as read"), replace aggressive double-confirmation modals with transient inline undo-toasts. High friction should be reserved exclusively for destructive operations (e.g., "delete permanently").

### 2.3. Data Density
- **Dense Data Tables:** In B2B or operations dashboards, optimize for scanability over white space. Use dense rows, monospaced tabular numbers for financial or ID data, and clear alignment (left for text, right for numbers).
- **Inline Editing:** Where possible, prefer inline editing or slide-out context drawers over full-page navigation context-switching.

## 3. Usage Guidelines for the Specialist

When evaluating a UI spec or recommending a design system:
1. Identify if the current task matches any UX patterns (e.g., table design, batch action, mobile input).
2. Propose the relevant pattern from this file as a recommendation.
3. **MANDATORY:** Check the recommendation against existing `UX_GUARDIAN` rules (especially concerning Friction and Consistency). If a pattern conflicts with a firm BMAD directive, the BMAD directive wins and the pattern is discarded (logged in `Rejected Archetypes`).
