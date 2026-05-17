# UI/UX Pro Max Specialist Integration — Gap Analysis Summary

> Date: 2026-05-09  
> Canonicalized from the RAP sandbox analysis for repo-stable reuse.

## Executive Decision

- Recommended integration mode: **Selective Extract**, not full bundle import.
- Primary decision: **MERGE** the design-system-first search workflow into BMAD's existing UX/design assets.
- Secondary decision: **ADOPT** a small local search/data pattern only if BMAD later wants offline design recommendation lookup.
- Do not import the external repo wholesale.

## Why BMAD Should Not Replace Its UX Stack

BMAD already has strong UX governance through:
- `.agent/skills/design-consultation/SKILL.md`
- `.agent/skills/ux-guardian/SKILL.md`
- `.agent/skills/stitch-design-taste/SKILL.md`
- `.agent/skills/user-simulation-guardian/SKILL.md`
- `.agent/fragments/ux-principles.md`
- `.agent/workflows/workflow-entry.md`
- `.agent/workflows/step-00b-design-system-gate.md`

Conclusion:
UI/UX Pro Max is valuable mainly as a **design recommendation engine** and **structured reference corpus**, not as a replacement governance layer.

## Recommended Reuse

### MERGE: Design-System-First Search Workflow

- Use UI/UX Pro Max before Stitch generation and before story UI-spec generation.
- Purpose: resolve product type, visual direction, color, typography, and anti-patterns early.

### ADOPT: Master + Page Override Pattern

- Persist a portal-level `MASTER.md` plus page-level override files.
- Purpose: preserve a stable source of truth while allowing explicit local exceptions.

### MERGE: Trimmed Design Lookup Data

- Later option only.
- Keep product/style/color/typography/anti-pattern mappings.
- Skip broad font and bulk reference payloads unless proven necessary.

## Recommended Skips

- Skip the multi-platform installer.
- Skip the full font-license bundle.
- Skip the full Google Fonts dataset for now.
- Skip wholesale import of the Claude skill/reference tree.

## Main Risks

### Risk 1: Duplicate UX Authorities

If UI/UX Pro Max is allowed to compete with BMAD Design System, Stitch, UX Guardian, or Design Consultation, agents may follow whichever rule is easiest instead of the true source of truth.

Mitigation:
- Route UI/UX Pro Max under BMAD governance.
- Enforce a non-override rule.

### Risk 2: Data Bloat Masquerading as Intelligence

Large CSVs and broad reference assets can add cost and noise without improving decisions.

Mitigation:
- Start with a wrapper and routing only.
- Delay data import until validation proves value.

### Risk 3: Generic Advice After Stitch Approval

UI/UX Pro Max is strongest before design is locked.

Mitigation:
- Use it for visual direction, design-system seeding, story UI guidance, and review evidence.
- Do not let it override approved Stitch layouts.

## Capability Classification Recommendation

- Primary: `SKILL_ATTACHMENT`
- Later supporting work: `WORKFLOW_PATCH`
- Rejected:
  - `DEDICATED_WORKFLOW`
  - `NEW_PERSONA`
  - `COMPOUND_INTEGRATION`

Reason:
The value is an on-demand design specialist used inside existing BMAD workflows, not a top-level replacement workflow or new routing authority.
