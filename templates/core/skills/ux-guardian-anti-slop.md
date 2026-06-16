---
name: ux-guardian-anti-slop
description: Aesthetic and visual Tien-Shinhan check rules to detect and eliminate AI tells and sloppy designs.
inputs: [html_content, css_content]
outputs: [audit_results]
mcp_tools_required: []
subagent_triggers: []
---

# UX Guardian: Anti-Slop Aesthetic Checklist

This document contains visual quality checks adapted from Hallmark's 69-Gate Slop Test. Apply these rules during the UI and layout validation phase.

---

## 1. Visual & Layout Rules

- **Zero-Chroma Banned**: Pure greys (e.g., `oklch(0.6 0 0)`) feel flat and generic. All neutral background and text colors should carry a small chroma tint mapped to the anchor brand hue (minimum `0.005` chroma) unless a strict monochrome modern-minimalist design is explicitly requested.
- **Gradient Restriction**: Avoid default "AI-looking" purple-to-blue or cyan-to-magenta linear text/button gradients. Gradients on text or pill buttons should be rejected. Radial background glows are allowed only in atmospheric styles.
- **Hero Centering**: Do not default to `min-height: 100vh` with all text centered unless the hero is purely editorial/specimen design.
- **Rhythm & Alignment**: Vertical layout elements (flex columns, sections) must be aligned with consistent vertical baseline spacing. Use `align-items: center` for rows containing elements with varying heights (e.g., icons + text, buttons + labels).

---

## 2. Typography Rules

- **The Three-Font Ceiling**: Do not load or use more than three distinct font families on a page. The standard stack is display font, body font, and at most one outlier font (monospace for labels/code, script for quotes).
- **Measure Rule**: Prose containers and paragraphs must have a `max-width` between `45ch` and `75ch` to ensure comfortable reading.
- **Baseline Alignment**: Highlighter marks or underline decorations must align exactly with the text baseline (underlines offset by 1-2px, highlight bands behind the x-height).

---

## 3. Microinteractions & States

- **No `transition: all`**: Never use generic transitions. Specify exact properties (e.g., `transition: background-color 150ms ease-in-out, transform 150ms ease-out`).
- **State Feedback Enforced**: Interactive components must have unique visual declarations for all interactive states:
  1. Default
  2. Hover (`:hover`)
  3. Active (`:active`)
  4. Focus (`:focus-visible` - must appear instantly, no fade-in transitions)
  5. Disabled (`:disabled` - opacity reduction + `cursor: not-allowed`)
  6. Loading (via class `.is-loading` - cursor wait + spinner)
  7. Selected (via class `.is-selected` - persistent border/glow)
  8. Error (via class `.has-error` - danger color bounds)
- **Bouncy Overshoot Ban**: Bouncy easing coordinates (e.g., `cubic-bezier(0.34, 1.56, ...)`) are banned on basic UI states like buttons and dropdowns. Reserve them for physical drag-and-drop or swipe animations only.
- **Auto-Rotation WCAG Rule**: Carousel, slider, or auto-rotating statistics must pause automatically on hover and keyboard focus.
