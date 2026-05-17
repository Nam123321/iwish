# UI/UX Pro Max Specialist Integration — Rollback and Tuning Path

## Purpose

This document tells maintainers how to:
- keep the current integration
- narrow the integration
- or consider a deeper second phase

It is intentionally reversible and evidence-driven.

## Inputs to Use

Use only the existing validation signals:
- scenario outcomes from `validation-scenarios.md`
- checklist dispositions from `quality-checklist.md`

Do not invent a second scoring system.

## Narrowing / Rollback Path

Use this path when the specialist repeatedly adds noise, conflict, or low-value output.

### Trigger Signals

Examples:
- repeated `Discard` outcomes in review
- repeated governance conflicts with approved artifacts
- repeated `Use as critique` with little evidence of real workflow improvement

### Narrowing Sequence

1. First narrow to the highest-value early workflow touchpoints only:
   - visual foundation
   - Design System Gate
2. Disable story-level invocation if it is producing mostly low-value or conflicting output.
3. Disable review-level invocation if it is adding noise or duplicate critique.

### Why This Is the Default Rollback Shape

Visual foundation and Design System Gate are the lowest-risk, highest-context phases for advisory design intelligence. If later-stage invocation becomes noisy, the safest rollback is to keep the early design-seeding value while removing downstream clutter.

## Keep-As-Is Path

Keep the current integration if:
- validation results are mostly `IMPROVED` or high-value `NEUTRAL`
- checklist outcomes show recommendations are usually specific, governance-compliant, and implementable
- review surfaces are adding signal without creating authority confusion

## Deepening / Phase-2 Path

Consider a second phase only when evidence is repeatedly positive.

### Required Conditions

- multiple validation runs across the scenario pack
- repeated useful outcomes, not one isolated success
- low conflict rate with approved BMAD authorities
- repeated recommendations that look promotable rather than disposable

### What Phase 2 Could Include

- a trimmed search engine
- a curated dataset
- selective copying of durable high-value design intelligence into BMAD core

### What This Document Does Not Approve Automatically

This document does not authorize phase 2 by itself.
It only defines when phase 2 becomes reasonable to consider.

## Lightweight Decision Matrix

| Signal Pattern | Decision |
|---|---|
| Mostly `Discard` | Narrow aggressively |
| Mostly `Use as critique` | Keep advisory, do not deepen |
| Repeated `Promote to BMAD rule` with low conflict | Consider phase 2 |
| Mixed results with localized noise | Disable only the noisy surfaces |

## Default Safety Rule

If evidence is unclear:
- prefer narrowing over deepening
- prefer advisory-only use over rule promotion
- prefer keeping BMAD source-of-truth layers unchanged
