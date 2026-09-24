---
name: 'visual-fidelity-gate'
description: Visual enforcement gate that rigidly validates UI implementations against the Approved Master Design Source (Figma, Penpot, Stitch, or UI Kit). Ensures developers use DOM-driven layout instead of Schema-driven layout.
---

# 🎨 Visual Fidelity Gate SKILL (formerly stitch-design-taste)

## Purpose

Enforce absolute visual fidelity between the implemented code and the Approved Master Design Source (Figma, Penpot, Stitch, or UI Kit). This skill prevents the "Schema-Driven Layout" error where developers build UI based on backend data schemas rather than the approved DOM structure.

## Core Directives

1. **Approved Master Design Source is the Absolute Source of Truth:**
   - The CSS/HTML generated from the Master Design Source (e.g. Stitch, Figma handoff, etc.) is a rigidly enforced visual contract.
   - Do NOT deviate from this contract just because the backend data model (schema) is structured differently.

2. **DOM-Driven Layout:**
   - Your React component hierarchy MUST map to the Master Design DOM hierarchy.
   - Example: If `ConditionType` and `isProgressive` logically sit together in the backend, but the design source separates them visually into different cards, you MUST build the UI with different cards.

## Automated Verification & Tooling

To ensure deterministic, programmatic enforcement rather than subjective evaluation, execute the automated visual comparison engine:

```bash
python3 scripts/visual-fidelity-comparator.py <epic_id> <story_id> --min-score 8.5
```

This engine:
1. **Screen Health Check**: Rejects blank, solid-color, 404/500 crash screens, or unrendered raw HTML.
2. **Design Token Audit**: Extracts and cross-checks CSS tokens from `ui-spec.md` (hex colors, fonts, border radiuses) against live DOM snapshots.
3. **Structural Similarity**: Computes image structural similarity between Stage 2B approved design mockup (`stitch_preview.png`) and live browser capture.
4. **Outputs Report**: Writes structured report to `<story_dir>/qa/evidence/visual-fidelity-report.md`.

---

## 4-Axis Scoring Rubric (Minimum Threshold: 8.5/10)

| Axis | Weight | Focus Areas |
|---|:---:|---|
| **1. Layout & Box Model** | 30% | Alignment, margins, padding, flexbox/grid containers matching approved design. |
| **2. Design Tokens & Typography** | 25% | Exact color palette HEX, typography scales, line heights, font families. |
| **3. State & Responsive Handling**| 20% | Correct rendering of empty states, loading skeletons, active tabs, modal overlays. |
| **4. Visual Polish & Taste** | 25% | Absence of awkward wraps, clipped text, blurry icons, or unstyled UI elements. |

---

## Anti-Preview Cheat Directives

1. **Strict Live Origin Only**: All screenshots must be captured from a live running application instance (`http://localhost:<port>` or `http://127.0.0.1:<port>`).
2. **Zero-Tolerance for Static Previews**: Taking screenshots of `preview.html`, `file://` URIs, or static mock files is strictly forbidden and rejected by `validate-live-browser-qa.py`.
3. **Multi-Factor Verification**: Tests must verify Dev Server liveness, active HAR traffic, and DOM hydration markers (`__next`, `data-reactroot`).

---

## Output Format

When generating the final sign-off for Stage 5b, output:

> 🛡️ **[VISUAL-FIDELITY-GATE] VERDICT: PASSED (Score: 8.9/10)**
> - Layout & Box Model: 9.0/10
> - Design Tokens & Typography: 9.0/10
> - State & Responsive Handling: 8.8/10
> - Visual Polish & Taste: 8.9/10
> - Report: `qa/evidence/visual-fidelity-report.md`

