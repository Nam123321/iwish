---
name: enrich-ux
description: 'Two-Phase Stitch Enrichment Phase 2: Analyzes Stitch output and injects dynamic micro-interactions, animations, and JS observers into the UI Spec.'
disable-model-invocation: true
---

# UI Spec Enrichment Workflow

**Goal:** Bridge the gap between Stitch's static HTML/CSS output and the dynamic, highly interactive capabilities defined in the UI/UX Pro Max library. This workflow populates the `[POST_STITCH_ENRICHMENT_LOGIC]` section of a UI Spec.

**Handled By:** Piccolo or Gotenks (Creative Intelligence).

---

## PREREQUISITES

Before running this workflow:
1. A Story UI Spec MUST exist at `{implementation_artifacts}/ui-specs/{story_key}-ui-spec.md`
2. The UI Spec MUST have `Enrichment_Required: true` in its metadata or the User explicitly requested it.
3. The Stitch layout MUST be fully approved by the User.
4. The HTML/CSS visual contract MUST be present in the UI Spec.

---

## ENRICHMENT PROCESS

### 1. Load Context & Libraries
1. Read the `{story_key}-ui-spec.md` file.
2. Identify the active Tech Stack, Portal, and Base Style.
3. Use the `ux-pro-max` skill to query `ux-guidelines.csv` and `styles.csv` specifically for **Effects, Animations, and Micro-interactions**.

### 2. Analyze the Static Baseline
1. Review the generated HTML/CSS from Stitch (or the CSS Mapping Table).
2. Identify areas that require dynamic enhancement based on the Pro Max library rules:
   - **Scroll Reveals:** Do elements need `IntersectionObserver` to animate in?
   - **Hover States:** Are basic CSS hovers insufficient? Do they need GSAP or advanced keyframes?
   - **Form Validation:** Do inputs need real-time validation feedback micro-animations?
   - **Data Visualization:** Do charts need staggered entry animations?

### 3. Determine Enrichment Tier
1. Check the `Enrichment_Tier` in the UI Spec metadata.
2. **Standard (Score 4-6):** Focus exclusively on CSS-based enhancements. Inject advanced CSS variables, sophisticated hover states, native CSS transitions, and complex structural pseudo-classes. Do NOT inject heavy JS libraries or timeline choreographies.
3. **Pro-Max (Score 7-10):** Focus on JS-driven state choreography. Inject `IntersectionObserver` scripts, GSAP timelines, complex React `useEffect` / state-driven micro-animations, and data-visualization staggered reveals.

### 4. Generate Enrichment Logic
1. For each identified enhancement, generate the exact Javascript or CSS required to implement it based on the assigned Tier.
2. Format the output clearly so the Dev Agent (Vegeta) can easily consume it.
3. **Strict Separation of Concerns:** The generated logic MUST NOT alter the base DOM structure or core layout properties defined by the approved Stitch HTML. It must act as a transparent wrapper or behavioral overlay.

### 5. Update the UI Spec
1. Append or replace the content inside the `[POST_STITCH_ENRICHMENT_LOGIC]` section of the `{story_key}-ui-spec.md` file.
2. The output MUST be placed inside ```javascript or ```css code blocks within that section.
3. Log the completion of the enrichment back to the User.

## EXECUTION

- ✅ YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style.
- ✅ VERIFY that the Stitch layout was approved before enriching.
- ✅ DO NOT alter any other section of the UI Spec, especially the approved Component Hierarchy or Responsive Layouts.
