---
name: clone-website
description: Clone any website into clean modern code. Provide a URL and the
  pipeline will extract design tokens, component specs, assets, and generate
  pixel-perfect React components. Can also search for reference websites.
disable-model-invocation: true
---

# Website Clone Pipeline — Standalone Workflow

This workflow runs the absorber-agent Website Cloner pipeline WITHOUT activating the full absorber-agent agent persona. Use this for quick, scriptable clone operations.

## Pre-requisites
- `browser_subagent` tool must be available (built-in browser automation)
- Target URL must be publicly accessible

## Input
The user provides one or more URLs. If no URL provided, ask for one. If the user describes a type of website they want to reference (e.g., "a SaaS pricing page like Stripe"), use `search_web` to find 3-5 candidate URLs and present them for the user to choose.

## Pipeline Steps

### Step 1: Pre-flight Validation
1. Parse and validate all provided URLs
2. Verify `browser_subagent` is available by checking tool list
3. Create output directories if they don't exist:
   - `docs/./cloned-specs/`
   - `docs/design-references/cloned/`
   - `public/cloned-assets/`

### Step 2: Reconnaissance (Recon)
1. Use `browser_subagent` to open the target URL
2. Take screenshots at:
   - Desktop viewport (1440px width)
   - Mobile viewport (390px width)
3. Save screenshots to `docs/design-references/cloned/{hostname}/`
4. Load and execute Token Extractor skill: READ {project-root}/.agent/skills/clone-website/token-extractor.md
5. Load and execute Interaction Analyzer skill: READ {project-root}/.agent/skills/clone-website/interaction-analyzer.md
6. Create Page Topology document at `docs/./cloned-specs/PAGE_TOPOLOGY.md`:
   - List every distinct section from top to bottom
   - Assign working names (e.g., HeroSection, NavBar, PricingCards, Footer)
   - Note which sections are static vs interactive
   - Note sticky/fixed/overlay elements

### Step 3: Foundation Build
1. Compile extracted tokens into `docs/./cloned-specs/design-tokens.md`:
   - Color palette (hex + oklch/hsl)
   - Typography scale (font families, sizes, weights, line-heights)
   - Spacing scale
   - Border radius values
   - Shadow definitions
   - Keyframe animations
2. Download all discovered assets using `browser_subagent`:
   - Images → `public/cloned-assets/{hostname}/images/`
   - Videos → `public/cloned-assets/{hostname}/videos/`
   - Fonts (if self-hosted) → `public/cloned-assets/{hostname}/fonts/`
3. Extract inline SVGs as named React components → `src/components/cloned-icons.tsx`
4. Write `src/styles/cloned-globals.css` with design tokens as CSS custom properties

### Step 4: Component Build (Sequential Loop)
For EACH section in the Page Topology (top to bottom):
1. Load and execute DOM Extractor skill: READ {project-root}/.agent/skills/clone-website/dom-extractor.md
   - Target the section's root container via CSS selector
   - Capture full computed style tree (recursive 4 levels deep)
2. Write Component Spec file: `docs/./cloned-specs/components/{SectionName}.spec.md`
   - Follow the spec template in the DOM Extractor skill
3. Generate React component: `src/components/cloned/{SectionName}.tsx`
   - Use ONLY values from the spec file — no guessing
   - Use Tailwind utility classes where they map exactly; use inline `style=` for precision values
   - Import any required icons from `cloned-icons.tsx`
   - Import any required images from `public/cloned-assets/`
4. **CHECKPOINT:** After each component, verify there are no TypeScript errors

### Step 5: Assembly & Tien-Shinhan
1. Create page assembly file: `src/app/cloned/page.tsx`
   - Import all generated section components in topology order
   - Apply page-level layout (scroll containers, z-index layering)
2. Apply global styles from `cloned-globals.css`
3. Run build verification (if project has build script)
4. Take final screenshots via `browser_subagent` for visual comparison:
   - Side-by-side: original vs clone at 1440px
   - Side-by-side: original vs clone at 390px
5. Report completion summary:
   - Total sections built
   - Total components created
   - Total spec files written
   - Total assets downloaded
   - Build status
   - Known gaps or limitations
