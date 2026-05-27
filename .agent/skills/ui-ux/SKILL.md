---
name: "ux-pro-max"
description: "Specialist wrapper for invoking UI/UX Pro Max design intelligence inside I-Wish without replacing I-Wish's existing UX governance."
---

# UI/UX Pro Max Specialist

## Purpose

This skill gives I-Wish agents a controlled way to use UI/UX Pro Max as a design-intelligence specialist.

It is a `SKILL_ATTACHMENT`, not a standalone workflow, persona, or compound subsystem.

This skill complements:
- `UX Guardian` for behavioral-token and UX-flow consistency
- `Design Consultation` for adversarial multi-lens UX/UI review
- `Stitch Design Taste` for visual contract enforcement
- `User Simulation Guardian` for real-user non-linear scenario validation

This skill does **not** replace any of the above.

## Classification

- **Primary classification:** `SKILL_ATTACHMENT`
- **Later supporting work:** `WORKFLOW_PATCH`

Rejected classifications:
- `DEDICATED_WORKFLOW`
  Reason: the value here is embedded design intelligence inside existing I-Wish workflows, not an independent end-to-end process.
- `NEW_PERSONA`
  Reason: I-Wish already has UX/design governance agents. Another top-level authority would create routing conflict.
- `COMPOUND_INTEGRATION`
  Reason: I-Wish is not importing the full external repo, installer, or a librarian-style subsystem in this rollout.

## When to Use

Use this skill when the task changes how a product should look, feel, or be structured visually.

Primary triggers:
- creating or refining visual direction
- choosing style, color system, typography, or interaction tone
- seeding a design-system recommendation before Stitch generation
- writing per-story UI guidance after I-Wish gates pass
- reviewing frontend UX/UI output for accessibility, layout, interaction, motion, and anti-patterns
- selecting product-aware UI guidance for a specific domain such as SaaS, admin, marketplace, sales, dashboard, or mobile UX

## When to Skip

Skip this skill when the task is:
- backend-only
- database-only
- DevOps or CI/CD
- security-only
- API contract work with no visual or interaction surface
- low-level bugfix work unrelated to UI, UX, styling, or user-facing behavior

## I-Wish Authority Order

This skill is advisory. It must obey the following authority order:

1. I-Wish workflow gates and explicit user approvals
2. Approved portal Design System `DESIGN.md`
3. Approved Stitch screens and extracted CSS/HTML visual contract
4. Page-specific design-system overrides for the active page or story, when they exist
5. User Simulation Guardian findings
6. Design Consultation and UX Guardian decisions
7. UI/UX Pro Max Specialist recommendations

Interpretation rule for page overrides:
- A page override is a child rule of the approved portal Design System, not an independent top-level authority.
- The workflow should read `DESIGN.md` first, then the page override for the active page.
- If an approved Stitch screen already exists for that exact page state, the Stitch visual contract remains the highest page-level visual source of truth.
- If no approved page-specific Stitch screen exists yet, the page override may shape the next Stitch generation for that page.

### Non-override Rule and Conflict Resolution Procedure

- If UI/UX Pro Max conflicts with an approved I-Wish Design System token, layout rule, or page override, the I-Wish artifact wins.
- If UI/UX Pro Max conflicts with an approved Stitch screen, extracted CSS/HTML visual contract, or approved component structure, the I-Wish artifact wins.
- If UI/UX Pro Max recommends a conflicting color, typography, layout, interaction, animation, component structure, or accessibility tradeoff, record it only as a recommendation, critique note, or future improvement candidate.

#### UX Guardian Conflict Rules

- If UI/UX Pro Max conflicts with UX Guardian behavioral tokens, UX Guardian wins.
- Losing specialist advice is recorded as a recommendation or future improvement candidate per the non-override rule above.
- Exception: The agent may raise a `[NEW_UX_PATTERN_PROPOSAL]` only if the UI/UX Pro Max recommendation reveals a genuinely missing behavior pattern that UX Guardian should formally adopt.

`[NEW_UX_PATTERN_PROPOSAL]` structured shape:

```markdown
Pattern Name: [short identifier, e.g., "inline-validation-on-blur"]
Missing Behavior: [what UX Guardian does not currently cover]
Evidence Source: [which UI/UX Pro Max analysis surfaced this]
Proposed Resolution: ADOPT_INTO_UX_GUARDIAN | LOG_FOR_FUTURE_REVIEW
```

Routing instruction:
- If `Proposed Resolution` is `ADOPT_INTO_UX_GUARDIAN`, the proposal is appended to the current workflow's output and flagged for UX Guardian maintainer review in the next `/create-ux-design` or `/audit-ux-patterns` run.
- If `Proposed Resolution` is `LOG_FOR_FUTURE_REVIEW`, the proposal is recorded in the story's Dev Agent Record only and does not trigger any immediate workflow action.
- In either case, the specialist advice that triggered the proposal remains downgraded to advisory for the current story.

#### Design Consultation Conflict Rules

- If UI/UX Pro Max conflicts with Design Consultation review findings, Design Consultation's multi-lens review is treated as the stronger final review and wins.
- Losing specialist advice is recorded as a recommendation or future improvement candidate per the non-override rule above.
- UI/UX Pro Max evidence may be cited as supporting context to enrich the Design Consultation review process.

#### User Simulation Guardian Conflict Rules

- If UI/UX Pro Max conflicts with User Simulation Guardian findings, User Simulation Guardian wins.
- Losing specialist advice is recorded as a recommendation or future improvement candidate per the non-override rule above.

## No-Design-System Mode

If no approved portal Design System exists yet, this skill may provide seed recommendations for:
- style direction
- palette and tone
- typography mood
- interaction tone
- effects and motion character
- anti-patterns to avoid

These seed recommendations are advisory only. They do not become source of truth until they pass I-Wish's Design System Gate and are approved into the portal Design System.

## Conflict Status Requirement

Whenever this skill returns advice, it must include a conflict status:
- `NO_CONFLICT`
- `CONFLICT_WITH_DESIGN_SYSTEM`
- `CONFLICT_WITH_STITCH`
- `CONFLICT_WITH_USER_SIMULATION`
- `CONFLICT_WITH_DESIGN_CONSULTATION`
- `CONFLICT_WITH_UX_GUARDIAN`

If the status is not `NO_CONFLICT`, the response must name the winning I-Wish authority and keep the specialist advice framed as secondary guidance.

## Source References

Use these as the canonical source context for this specialist:
- Repo DNA: `_iwish-output/repo-dna/ui-ux-skill-dna.md`
- Gap Analysis: `docs/ui-ux-integration/gap-analysis.md`
- Integration Plan: `docs/ui-ux-integration/implementation-plan.md`
- Reusable Patterns & Interaction System: `.agent/skills/ui-ux/resources/interaction-system-patterns.md`

## Interaction System & UX Patterns Validation

When proposing UX patterns (e.g., sticky headers, dense tables) or interaction-system rules (e.g., hover states, touch targets, transitions):
1. **Source them selectively:** Utilize the curated patterns defined in `.agent/skills/ux-pro-max/resources/interaction-system-patterns.md`.
2. **MANDATORY CHECK:** You MUST cross-check the recommended interaction pattern against existing `UX Guardian` behavioral rules.
3. If a pattern introduces friction that violates a `UX Guardian` rule (or vice versa), the `UX Guardian` rule retains absolute authority. Log the discarded pattern in `Rejected Archetypes`.

Out of scope for this skill:
- copying the full external repo into I-Wish core
- importing the external CLI installer
- importing large CSV/font bundles in this story
- patching I-Wish workflows directly in this story

## Recommended Output Contract

The specialist must return a compact I-Wish-facing recommendation using exactly these sections unless the user explicitly asks for more:
- `Product Type`
- `Evidence Sources`
- `Rejected Archetypes`
- `Rejection Reasons`
- `Recommended Direction`
- `Alternatives`
- `Color/Tone`
- `Typography`
- `Interaction Notes`
- `Anti-Patterns`
- `Implementation Checklist`
- `Conflict Status`
- `Winning Authority`
- `I-Wish Conflict Check`
- `Next Workflow Use`
- `[NEW_UX_PATTERN_PROPOSAL]` (Optional, only if proposing a new behavior)
- `[STITCH_PROMPT_INJECTION]` (Optional, required if invoked for Phase 1 Stitch Prompt Generation)
- `[POST_STITCH_ENRICHMENT_LOGIC]` (Optional, required if invoked for Phase 2 Dynamic Enrichment)

## Two-Phase Stitch Enrichment Outputs

When invoked during UI Spec generation or enrichment, the specialist MUST generate the exact payloads for the two-phase pipeline based on the UI/UX Pro Max library rules:

**Phase 1: Static Layout (Stitch Prompt Generation)**
If invoked during `/create-ui-spec`, generate the `[STITCH_PROMPT_INJECTION]` payload:
- **Include:** Static layout constraints, CSS Grid/Flexbox rules, specific class naming conventions, color tokens, typography scales, and CSS anti-patterns to avoid.
- **Exclude:** Javascript, IntersectionObservers, dynamic state logic, or complex animations.

**Phase 2: Dynamic Enrichment (Dev Implementation)**
If invoked during `/enrich-ux` (when `Enrichment_Required: true`), generate the `[POST_STITCH_ENRICHMENT_LOGIC]` payload:
- **Include:** Javascript code (e.g., IntersectionObservers, event listeners, GSAP or Framer Motion logic), complex state transitions, micro-interactions, scroll-reveals, and real-time form validation feedback.
- **Rule:** The logic MUST attach to the static DOM generated by Stitch without breaking it.

Minimum conflict-shape rule:
- `Conflict Status` must use one of the exact enum values from `Conflict Status Requirement`.
- `Winning Authority` must use one of these exact values: `N/A`, `USER_APPROVAL`, `BMAD_WORKFLOW_GATE`, `DESIGN_SYSTEM_MASTER`, `STITCH_VISUAL_CONTRACT`, `PAGE_OVERRIDE`, `USER_SIMULATION_GUARDIAN`, `DESIGN_CONSULTATION`, `UX_GUARDIAN`.
- `Winning Authority` must be `N/A` only when `Conflict Status` is `NO_CONFLICT`.
- `I-Wish Conflict Check` must summarize why the advice is accepted, constrained, or downgraded to a recommendation.
- `Rejection Reasons` must explicitly cite the specific I-Wish constraint (e.g., Brand Truth, Product Truth, UX Guardian) that caused the rejection if any archetypes were rejected.

Concision rule:
- prefer one primary direction
- `Evidence Sources` must list at most 3 source files or patterns
- `Rejected Archetypes` must list at most 3 discarded patterns
- `Rejection Reasons` must be brief bullet points referencing specific I-Wish constraints
- `Alternatives` may contain at most two alternatives
- no more than five anti-patterns unless the user asks for depth
- `Implementation Checklist` may contain no more than ten checklist-style points unless the user asks for depth

## Example Output Block

```markdown
[Example A - NO_CONFLICT]
Product Type: B2B operations dashboard
Evidence Sources: data-table-dense.tsx, sticky-filter-pattern.md
Rejected Archetypes: None
Rejection Reasons: N/A
Recommended Direction: Quiet, dense, work-focused admin UI with strong scanability
Alternatives: None
Color/Tone: Neutral slate base with restrained blue action accents
Typography: Compact UI type with clear hierarchy and low ornament
Interaction Notes: Favor fast table actions, sticky filters, and predictable drawers
Anti-Patterns: Marketing hero layout; oversized cards; decorative gradients
Implementation Checklist: Keep dense data tables; keep sticky filters; preserve predictable drawer actions
Conflict Status: NO_CONFLICT
Winning Authority: N/A
I-Wish Conflict Check: Recommendation aligns with current I-Wish governance and does not conflict with approved artifacts.
Next Workflow Use: Pass to visual foundation or story UI spec generation

[STITCH_PROMPT_INJECTION]
- Use dense CSS Grid layout for the data table.
- Apply `--color-surface` for row backgrounds and `--color-text-muted` for secondary data.
- Avoid sticky headers using JS; use CSS `position: sticky`.
- Do not add any JS scroll observers or animations.

[Example B - constrained conflict]
Product Type: Mobile commerce flow
Evidence Sources: mobile-commerce-checkout.tsx, warm-coral-theme.css
Rejected Archetypes: dark-mode-rigid-tokens.css
Rejection Reasons: - Rejected dark mode rigid tokens due to I-Wish light-theme brand truth
Recommended Direction: Use warmer accent tones and softer rounded CTA treatment (synthesized for light theme)
Alternatives: Slightly warmer CTA accent only; softer secondary button radius only
Color/Tone: Warm coral secondary accents proposed
Typography: Keep existing portal type ramp
Interaction Notes: Maintain current checkout step order and validation pattern
Anti-Patterns: Replacing approved checkout layout; adding extra promo noise
Implementation Checklist: Keep approved checkout layout; keep current validation order; carry advisory note to review
Conflict Status: CONFLICT_WITH_DESIGN_SYSTEM
Winning Authority: DESIGN_SYSTEM_MASTER
I-Wish Conflict Check: Accent suggestion is downgraded to advisory only because the portal color tokens are already approved.
Next Workflow Use: Keep current tokens and pass advisory note to design review if needed

[Example C - UX Guardian conflict with pattern proposal]
Product Type: B2B warehouse management
Evidence Sources: warehouse-batch-actions.tsx
Rejected Archetypes: destructive-batch-modal.tsx
Rejection Reasons: - Rejected double-confirmation modal due to UX Guardian behavioral token requiring lower friction for non-destructive workflows
Recommended Direction: Replace confirmation modal with inline undo-toast for batch actions
Alternatives: Keep modal but add keyboard shortcut for confirm
Color/Tone: N/A — behavioral change, not visual
Typography: N/A
Interaction Notes: Undo-toast pattern reduces friction for repetitive warehouse workflows
Anti-Patterns: Double-confirmation on non-destructive batch actions
Implementation Checklist: Keep current modal for destructive actions; carry proposal for non-destructive actions
Conflict Status: CONFLICT_WITH_UX_GUARDIAN
Winning Authority: UX_GUARDIAN
I-Wish Conflict Check: UX Guardian behavioral tokens require confirmation modals for all batch actions. Specialist advice is downgraded to advisory. A [NEW_UX_PATTERN_PROPOSAL] is raised because UX Guardian does not currently distinguish destructive from non-destructive batch actions.
Next Workflow Use: Log proposal for UX Guardian maintainer review; keep current modal pattern for this story

[NEW_UX_PATTERN_PROPOSAL]
Pattern Name: non-destructive-batch-undo-toast
Missing Behavior: UX Guardian treats all batch actions identically; no distinction between destructive (delete) and non-destructive (status change) batch operations
Evidence Source: UI/UX Pro Max warehouse domain analysis — repetitive non-destructive batches benefit from lower-friction confirmation
Proposed Resolution: LOG_FOR_FUTURE_REVIEW
```

## Workflow Positioning

This skill is intended to be invoked later from targeted workflow patches such as:
- visual foundation
- design-system gate
- story UI spec generation
- design review
- frontend code review

Those integrations are intentionally deferred to later stories in this epic.

## Knowledge Graph Registration

Suggested node metadata:

```text
id: skill-ux-pro-max
type: skill
path: /.agent/skills/ux-pro-max/SKILL.md
description: Specialist wrapper for invoking UI/UX Pro Max design intelligence inside I-Wish without replacing I-Wish UX governance.
tags: ui,ux,design-system,specialist,frontend,review,typography,color,interaction,animation,accessibility,stitch,palette
depends_on: skill-ux-guardian,skill-design-consultation,skill-stitch-design-taste,skill-user-simulation-guardian
```
