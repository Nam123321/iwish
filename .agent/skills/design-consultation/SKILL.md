---
name: 'design-consultation-wrapper'
description: 'Use when validating UI component implementations against design principles (typography, color, layout) to detect UX regressions.'
---

# Design Consultation Skill

The **Design Consultation** skill provides a structured, adversarial UX/UI review capability. It is adapted from Gstack's `design-consultation` and `design-review` (Design Army) patterns and tailored for the I-Wish ecosystem.

## Purpose

When invoked, this skill forces the reviewing agent to adopt **multiple design specialist lenses** in sequence, rather than performing a single-pass aesthetic review. This catches inconsistencies that a generalist review would miss.

## The Design Army Pattern

The agent MUST cycle through the following 5 specialist lenses when reviewing any UI component, mockup, or spec:

### 1. Typography Specialist
- Is the font hierarchy clear and consistent? (H1 > H2 > body > caption)
- Are font weights used purposefully (not decoratively)?
- Is line-height adequate for readability? (Minimum 1.4 for body text)
- Are there any orphaned font families not in the design system?

### 2. Color & Contrast Specialist
- Do all color pairings meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large)?
- Is the color palette limited to design system tokens? No ad-hoc hex values.
- Are semantic colors used correctly? (Error = red, Success = green, Warning = amber)
- Does the design work in both light and dark modes (if applicable)?

### 3. Layout & Spacing Specialist
- Are margins and padding on a consistent spacing scale (4px/8px base)?
- Is the grid system respected? No arbitrary widths or breakpoints.
- Does the layout degrade gracefully across viewports (mobile, tablet, desktop)?
- Are DOM-driven layout principles followed per I-Wish UX Principles?

### 4. Interaction & Motion Specialist
- Are all interactive elements clearly afforded? (Buttons look clickable, links look tappable)
- Are hover/focus/active states defined for every interactive element?
- Are transitions smooth and purposeful (not decorative)? Duration 150-300ms.
- Is keyboard navigability maintained? Tab order logical?

### 5. Information Architecture Specialist
- Is the content hierarchy intuitive? Can a user find what they need in ≤ 3 clicks?
- Are empty states, loading states, and error states designed?
- Is the labeling clear and jargon-free for the target persona?
- Are destructive actions properly gated (confirmation dialogs, undo)?

## Output Format

After cycling through all 5 lenses, produce a consolidated report:

```markdown
## Design Consultation Report

### Summary
[1-2 sentence overall assessment]

### Findings by Specialist Lens

| Lens | Rating (1-5) | Key Finding |
|------|-------------|-------------|
| Typography | [Score] | [Finding] |
| Color & Contrast | [Score] | [Finding] |
| Layout & Spacing | [Score] | [Finding] |
| Interaction & Motion | [Score] | [Finding] |
| Information Architecture | [Score] | [Finding] |

### Critical Issues (Must Fix)
- [List any score ≤ 2]

### Recommendations (Should Fix)
- [List any score = 3]

### Overall Design Score: [Average / 5]
```

## UI/UX Pro Max Review Evidence

When `ux-pro-max` is available, this skill may cite specialist evidence as supporting review context for:
- typography
- color and contrast
- layout and spacing
- interaction and motion
- information architecture
- accessibility
- anti-pattern detection

Usage rules:
- Specialist evidence is optional supporting context, not a second final reviewer.
- Design Consultation remains the final owner of severity, disposition, and overall review judgment.
- If specialist evidence conflicts with Design Consultation findings, Design Consultation wins and the specialist evidence is recorded only as supporting context or downgraded recommendation.
- If specialist evidence conflicts with approved Design System tokens, approved Stitch screens, extracted CSS/HTML visual contract, User Simulation Guardian, or UX Guardian, the stronger I-Wish authority wins.
- Any cited specialist evidence must remain grounded in the actual UI spec, mockup, screenshot, DOM structure, or approved visual artifact under review.

If specialist evidence is cited, append this subsection to the review output:

```markdown
### UI/UX Pro Max Supporting Evidence
- Evidence Domains: [typography / color / layout / interaction / IA / accessibility / anti-patterns]
- Evidence Summary: [short grounded summary]
- Evidence Disposition: [ACCEPTED | CONSTRAINED | REJECTED | DOWNGRADED_TO_RECOMMENDATION]
- Conflict Status: [NO_CONFLICT or exact governed conflict enum]
- Winning Authority: [exact governed authority enum]
- I-Wish Conflict Check: [why the evidence was accepted, constrained, or downgraded]
- Severity Owner: Design Consultation
```

## When to Invoke

- During `/create-ui-spec` — as a review gate before finalizing the spec.
- During `/dev-agent-story` — when implementing or refactoring UI components.
- On demand — when any agent needs a structured design opinion.

## Integration with I-Wish Ecosystem

This skill complements (does not replace):
- **UX Guardian** — enforces behavioral token consistency.
- **Stitch Design Taste** — validates against the CSS/HTML visual contract.
- **UX Principles Fragment** — provides the foundational design rules.

Design Consultation adds the **adversarial multi-lens review** that those tools lack.
