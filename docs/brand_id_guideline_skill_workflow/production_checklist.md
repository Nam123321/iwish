# Brand Identity & Guideline Production Checklist

## Strategy & Strategy Prism
- [ ] Brand name and preferred display name confirmed.
- [ ] Kapferer's Brand Prism completed (Culture, Personality, Physique, Relationship, Reflection, Self-Image).
- [ ] Tagline and alternate slogans selected and tested for clarity.
- [ ] Target audience demographics and use cases defined.
- [ ] Voice and tone rules written with specific do's and don'ts.

---

## Logo Brainstorming & Design Connection
- [ ] Checked if design system connection (Stitch, Figma, Claude Design, Canva, or Local Exporter) is selected and active.
- [ ] Minimum 5 distinct logo options generated (or as requested by user).
- [ ] Each option has a clear visual-verbal breakdown detailing:
  - [ ] Structural components/shapes.
  - [ ] Symbolic meaning of each component.
  - [ ] Geometric arrangement rules.
  - [ ] Font pairing selection & kerning details.
- [ ] Checked if user wants cross-platform prompts (Recraft.ai, Midjourney, ChatGPT, or other visual engines) to test designs.
- [ ] Legibility at 16x16px (favicon scale) tested for each concept.
- [ ] Contrast on black, white, and primary backgrounds evaluated.

---

## Logo Refactoring (Only if Rebranding/Refactoring)
- [ ] Existing logo files archived and issues audited.
- [ ] Chosen refactoring path declared (Path A: Cleanup / Path B: Evolution / Path C: Redesign).
- [ ] Vector paths simplified (no redundant anchor points, overlapping paths merged).
- [ ] Geometry aligned to strict mathematical grids (clean lines, circles, angles).
- [ ] Typography kerned and modernized.

---

## 🚫 SEQUENTIAL GATEWAY LOCK (CRITICAL)
- [ ] **LOGO CHOSEN & LOCKED**: The final logo mark and lockup have been officially chosen and signed off by the user.
- [ ] *Asset check*: Primary light, primary dark, symbols, and monochrome SVGs are generated and saved in `/assets/logo/`.
- [ ] **APPROVED**: Access granted to proceed with Color, Typography, and Touchpoint expansion.

---

## Color System Extension (Post-Logo Lock)
- [ ] Primary, secondary, and neutral palettes defined.
- [ ] Semantic colors mapped (success, warning, error, info, pending, active).
- [ ] Color usage ratio checked (approx. 60% background, 25% primary, 10% secondary, 5% accent).
- [ ] WCAG 2.1 AA/AAA contrast ratios verified for text and buttons.
- [ ] Separate dark mode and light mode palettes verified.

---

## Typography & Iconography Systems
- [ ] Display, body, and mono font pairings selected.
- [ ] Font weights and line heights defined for all typographic levels (H1 to H4, body, mono, labels).
- [ ] Typographic scale chosen (e.g. golden ratio or major third).
- [ ] Icons designed on a unified grid system with consistent stroke weights.
- [ ] Specific UI icons for workspace, agent, workflows, department, calendar, and task created and exported to SVG.

---

## UI Mockups & Marketing Touchpoints
- [ ] Dashboard mockup matches approved logo, colors, and typography.
- [ ] Workflow/Kanban screen mockups built showing correct status indicators.
- [ ] Responsive states represented (desktop vs. mobile).
- [ ] Marketing banner, social ads, brochures, and email design templates built.
- [ ] No placeholder logo used; the approved logo is correctly placed in all mockups.

---

## Tokens & Packaging
- [ ] `design-tokens.json` generated using standard W3C schema.
- [ ] Token file tested for compilation with Style Dictionary.
- [ ] Folders structured according to the `brand-guideline-package` folder standard.
- [ ] README.md file contains usage instructions and asset descriptions.
- [ ] Guideline website (HTML/CSS) verified for layout responsiveness.
- [ ] Final package compiled into a clean ZIP archive.
