---
name: design-dna-extraction
description: 5-step Visual DNA extraction checklist for studying reference websites and screenshots.
inputs: [source_url_or_screenshot]
outputs: [dna_spec]
mcp_tools_required: [chrome-devtools-mcp]
subagent_triggers: []
---

# Visual DNA Study Mode: Extraction Guidelines

This document details the guidelines for extracting a design's **DNA** (skeleton layout, colors, typography pairings, and rhythm) instead of performing raw pixel copy.

---

## 1. The 5-Step DNA Protocol

Perform visual or source analysis in this strict order:

1.  **Surface (Color temperament & visual accents)**:
    *   Determine paper lightness bands (dark/light/mid) and background hue (warm/cool/neutral).
    *   Estimate brand accent hue and footprint percentage (e.g., small mark vs. recurring flood).
    *   Note special effects like riso shadows, grain, or glassmorphism.
2.  **Type (Typography roles & pairing logic)**:
    *   Identify display roles, body roles, and micro-label roles.
    *   Analyze pairing logic (e.g., editorial serif + grotesque body + monospace labels).
3.  **Structure (Layout Skeletons)**:
    *   Map the layout to standard layout archetypes (e.g., Bento Grid, Split Studio, Minimal Hero).
    *   Identify sub-component layout knobs.
4.  **Motion (Micro-animations)**:
    *   Read references to motion libraries (Lenis, GSAP, Framer Motion) or transition timings in CSS.
5.  **Rhythm (Spacing Gestalt)**:
    *   Gauge negative space, visual density, and asymmetry.

---

## 2. Input Mode Channels

### URL Mode (Auto-detected via `http://` / `https://`)
-   **URL Refusal Filter**: Automatically reject marketplaces (e.g., ThemeForest, Webflow Templates) and signature designs (direct templates).
-   **Fetch Pipeline**: Perform a shallow WebFetch. Only pull initial HTML, CSS custom properties, and style tags. Discard images, videos, and active JS scripts.
-   **Rhythm Blind Spot**: Mark visual density / rhythm as `unknown (URL mode)` since raw HTML/CSS does not represent spacing gestalt without screen rendering. Ask the user for a screenshot if Rhythm is critical.
-   **Junk-or-Blocked Detection**: If the page is behind a login, has fewer than 200 characters in body (empty SPA), or returns errors, output the standard fallback message and request a screenshot.

### Image Mode (Auto-detected via attached file)
-   Use Vision LLM passes to analyze screenshots.
-   Analyze color bands and estimate font roles (do not guess font names; describe the classification, e.g., "editorial italic serif").
-   Assess Rhythm and spacing directly from the gestalt.
