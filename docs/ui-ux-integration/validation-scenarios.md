# UI/UX Pro Max Specialist Integration — Validation Scenarios

## Purpose

This document defines a small, reusable validation pack for comparing:
- the baseline BMAD flow without specialist-enhanced guidance
- the specialist-enhanced BMAD flow after Epic 2 integration

The goal is to detect whether the integration improves design quality without adding uncontrolled workflow bloat.

## How to Use

For each scenario:
1. Run the baseline flow using the same story/problem context.
2. Run the specialist-enhanced flow using the same story/problem context.
3. Fill the comparison template at the end of this document.
4. Record whether the specialist improved output quality, stayed neutral, or added noise.

## Shared Comparison Dimensions

Every scenario comparison must record:
- design clarity
- accessibility coverage
- Stitch prompt quality
- user simulation issues
- implementation readiness

## Scenario 1 — Admin / Dashboard

### Scenario ID
`VAL-ADMIN-01`

### Product Context
- Portal: Admin Portal
- Surface: dense dashboard / operations workspace
- Device bias: desktop

### Example Story Shape
- data-heavy list/detail workflow
- filters, tables, bulk actions, status signals

### Why This Scenario Exists
Admin/dashboard surfaces are where quiet, dense, work-focused design quality matters most. This is a strong test of whether the specialist improves scanability, hierarchy, and anti-pattern avoidance without drifting into decorative UI.

### Expected Improvement Signal
- clearer information hierarchy
- better anti-pattern detection for card bloat / marketing-style layout
- stronger accessibility and interaction notes for dense workflows
- better implementation readiness for data-heavy UI

## Scenario 2 — Mobile / Sales

### Scenario ID
`VAL-SALES-01`

### Product Context
- Portal: Sales App
- Surface: mobile task flow for field or store staff
- Device bias: mobile

### Example Story Shape
- lead/customer action flow
- quick create/edit form
- confirmation / follow-up interaction

### Why This Scenario Exists
Mobile/sales flows stress responsiveness, task compression, thumb-friendly interaction, low-friction navigation, and real-world interruptions. This is a strong test of whether the specialist improves task focus and usability under constrained device conditions.

### Expected Improvement Signal
- more ergonomic mobile interaction guidance
- better handling of constrained space and action prioritization
- stronger user-simulation alignment for rushed or interrupted usage
- fewer desktop-biased layout assumptions

## Scenario 3 — Public / Webstore

### Scenario ID
`VAL-WEBSTORE-01`

### Product Context
- Portal: Webstore
- Surface: customer-facing public shopping or discovery page
- Device bias: responsive web

### Example Story Shape
- product list / detail
- cart / checkout entry
- promotional or browsing surface

### Why This Scenario Exists
Public/webstore flows test whether the specialist can improve conversion-oriented clarity, customer trust, accessibility, and lightweight visual direction without violating approved Design System or Stitch contracts.

### Expected Improvement Signal
- better product hierarchy and CTA clarity
- stronger accessibility coverage for public-facing content
- improved anti-pattern detection for noisy promotional clutter
- more actionable design critique for responsiveness and customer flow

## Reusable Comparison Template

Copy this block for each run:

```markdown
## Validation Run — [Scenario ID]

### Context
- Story / Flow:
- Portal:
- Device:
- Reviewer:
- Date:

### Baseline Flow
- Summary:
- Key strengths:
- Key weaknesses:

### Specialist-Enhanced Flow
- Summary:
- Key strengths:
- Key weaknesses:

### Comparison Scorecard
| Dimension | Baseline | Enhanced | Improvement Signal |
|---|---|---|---|
| Design Clarity | | | |
| Accessibility Coverage | | | |
| Stitch Prompt Quality | | | |
| User Simulation Issues | | | |
| Implementation Readiness | | | |

### Result
- Outcome: IMPROVED | NEUTRAL | WORSE
- Why:
- Keep / Tune / Rollback Signal:
```

## Interpretation Notes

- `IMPROVED` means the specialist-enhanced flow produced more specific, source-of-truth-compliant, implementable output.
- `NEUTRAL` means the enhanced flow added little useful value, but did not significantly degrade quality.
- `WORSE` means the enhanced flow introduced noise, conflict, vagueness, or governance drift.

## Lightweight Rule

This validation pack is intentionally small:
- 3 scenarios only
- manual comparison
- no new automation required
- reusable across future tuning decisions
