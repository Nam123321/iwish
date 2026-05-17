# UI/UX Pro Max Specialist Integration — Quality Checklist

## Purpose

Use this checklist when a `ui-ux-pro-max-specialist` recommendation appears in any BMAD artifact:
- planning artifact
- Design System artifact
- story UI spec
- design review
- code review

The goal is to judge whether the recommendation actually helped and what to do with it next.

## Checklist

Mark each item as `YES`, `PARTIAL`, or `NO`.

| Dimension | Question |
|---|---|
| Specific | Is the recommendation concrete rather than generic design prose? |
| Source-of-Truth Compliant | Does it respect approved Design System, Stitch visual contract, page overrides, and stronger BMAD authorities? |
| Persona-Aware | Does it reflect the actual user, device, and workflow context? |
| Implementable | Can the team act on it without guessing hidden requirements? |
| Accessible | Does it improve or preserve accessibility rather than ignoring it? |
| Concise | Is it compact enough to be useful without bloating workflow output? |

## Disposition Options

After scoring the checklist, choose one disposition:

### `Discard`
Use when:
- the recommendation is generic
- it conflicts with approved artifacts without adding useful insight
- it creates more noise than value

### `Use as critique`
Use when:
- the recommendation surfaces a real concern
- but it cannot override the current source of truth
- or it is best kept as advisory feedback, checklist input, or future improvement note

### `Promote to BMAD rule`
Use when:
- the recommendation is repeatedly useful across scenarios
- it is compatible with BMAD governance
- and the team believes it should become a more durable pattern, checklist item, or workflow rule

## Lightweight Scoring Note

Suggested interpretation:
- Mostly `YES` -> likely useful
- Mixed `YES` / `PARTIAL` -> likely `Use as critique`
- Mostly `NO` -> likely `Discard`

Promotion should be conservative and requires repeated evidence, not one good recommendation.

## Tuning Signal

Use repeated checklist outcomes to guide integration decisions:
- many `Discard` outcomes -> specialist may be noisy in that workflow
- many `Use as critique` outcomes -> specialist is helpful but should stay advisory
- repeated `Promote to BMAD rule` outcomes -> candidate for future BMAD rule extraction
