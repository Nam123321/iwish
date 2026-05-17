# UI/UX Pro Max Specialist Integration — Retrieval-Sandwich Architecture

## Purpose

This document defines the governed retrieval architecture for the next absorb-improvement phase.

The architecture exists because validation showed a split outcome:

- the current BMAD absorb is stronger at brand fit, product fit, and source-of-truth safety
- the original UI/UX Pro Max repo is stronger at reusable UX patterns, interaction-system completeness, and broad first-pass system scaffolding

The goal is to combine those strengths without letting raw original-repo synthesis become unfiltered design authority.

## Core Rule

The original repo is an evidence source.

The BMAD absorb remains the final governed decision layer.

That means:

- original-repo retrieval can expand options
- original-repo synthesis can supply candidate directions
- BMAD absorb is still responsible for:
  - brand fit
  - product fit
  - authority compliance
  - final recommendation contract

## Why the Retrieval Sandwich Exists

The Distro benchmark showed that a direct original-repo `--design-system` run can still drift:

- off-brand style family
- off-brand typography
- dark-first or hype-first direction
- generic pattern selection that is broader than the real product need

The same benchmark also showed that the original repo becomes more useful when:

1. the product context is made explicit
2. brand constraints are made explicit
3. product/style/landing sub-retrieval is used before trusting synthesis

So the architecture must force those steps to happen in a stable order.

## Retrieval-Sandwich Sequence

### Stage 1 — Brand Truth Extraction

Inputs:

- approved brand guidelines
- `MASTER.md`
- page overrides if relevant
- approved visual contract artifacts
- any explicit user direction

Outputs:

- brand palette constraints
- typography constraints
- visual tone constraints
- hard rejections

Examples of hard rejections:

- dark-first if the brand is light-first
- alternate headline font if the brand already fixed headline type
- decorative hero style if the product posture is operational trust

### Stage 2 — Product Truth Extraction

Inputs:

- product description
- target users / personas
- workflow or story context
- domain surface: website, dashboard, mobile task flow, review, etc.

Outputs:

- product archetype candidates
- user-pressure profile
- workflow class
- domain-specific UX priorities

Examples:

- `Inventory & Stock Management`
- `Real-Time Monitoring`
- `B2B operations dashboard`
- `field rep mobile order flow`

### Stage 3 — Original-Repo Retrieval

Inputs:

- product truth
- brand truth
- active surface

Retrieval candidates:

- product
- style
- landing
- typography
- UX guidelines
- later: reusable UX patterns
- later: interaction modules

Outputs:

- retrieved archetype candidates
- retrieved pattern candidates
- retrieved interaction cues
- raw synthesis candidates if needed

Rule:

- retrieval outputs are evidence only
- they are not yet permitted to shape final design direction directly

### Stage 4 — Archetype Rejection

This is the critical control point.

Inputs:

- brand truth
- product truth
- retrieved candidates

Outputs:

- chosen archetype candidates
- rejected archetypes
- rejection reasons

Examples of rejection reasons:

- conflicts with approved brand palette
- conflicts with approved typography
- too theatrical for operational product
- too consumer / startup / gaming-biased
- weak fit for SME operator pressure

Rule:

- rejected archetypes must not silently blend into the final recommendation
- if a candidate is rejected, the rejection reason should remain inspectable for later review

### Stage 5 — BMAD Absorb Synthesis

Inputs:

- brand truth
- product truth
- surviving retrieved evidence
- authority order from the specialist skill

Outputs:

- BMAD-governed recommendation
- compact recommendation contract
- conflict status and winning authority fields where relevant

Rule:

- this is the first point where a direction becomes recommendation-ready for BMAD use
- even here, it remains advisory until it passes the relevant BMAD workflow gate

## Evidence vs Authority Boundary

### Evidence

These can influence recommendation quality but do not hold final authority:

- original-repo search results
- original-repo design-system synthesis
- retrieved style candidates
- retrieved UX pattern candidates
- retrieved interaction-module candidates

### Authority

These remain authoritative:

1. explicit user approval and active BMAD workflow gates
2. approved `MASTER.md`
3. approved Stitch screens / visual contract
4. approved page override for relevant page context
5. User Simulation Guardian
6. Design Consultation and UX Guardian
7. final BMAD absorb recommendation as advisory specialist output

## Raw Original-Repo Synthesis Policy

Raw original-repo `--design-system` output is never source of truth by itself.

It may be used as:

- candidate pattern signal
- candidate section structure
- candidate checklist source
- candidate interaction-system source

It may not be used as:

- direct replacement for BMAD absorb judgment
- direct replacement for approved brand constraints
- direct replacement for approved design-system or Stitch artifacts

## Rejection Logic Placement

Rejection must happen before the final recommendation contract is produced.

This prevents two failure modes:

1. silent blending:
   - off-brand candidates leak into the final direction without being named
2. false confidence:
   - the final BMAD output looks precise but is built from unresolved conflicting archetypes

In later contract work, the specialist should expose:

- chosen archetype
- rejected archetypes
- brand evidence
- product evidence
- rejection reason

That keeps the retrieval sandwich explainable instead of magical.

## Recommended Minimal Flow Shape

```text
Brand Truth
  -> Product Truth
    -> Original-Repo Retrieval
      -> Archetype Rejection
        -> BMAD Absorb Recommendation
          -> BMAD Workflow Gate
            -> Approved Artifact or Advisory Note
```

## What This Architecture Intentionally Does Not Do

It does not yet:

- import runtime datasets
- patch workflow steps
- change the specialist contract
- decide which exact CSV slices are imported
- promote original-repo interaction patterns into BMAD source of truth automatically

Those belong to later Epic 4 stories.

## Strength Borrowing Strategy

### Keep from Current BMAD Absorb

- brand-fit judgment
- product-fit judgment
- anti-pattern pressure
- source-of-truth safety
- BMAD-friendly recommendation contract

### Borrow from Original Repo

- richer product/style/landing retrieval
- reusable UX pattern breadth
- interaction-system scaffolding
- stronger first-pass `MASTER.md` component/state coverage

## Validation Basis

This architecture is justified by the following observed results:

- current absorb outperformed original raw synthesis in Distro brand fit and product fit
- original repo outperformed current absorb in reusable UX pattern breadth and interaction-system completeness
- stronger prompting improved original-repo output, but did not remove drift on its own

Relevant artifacts:

- `uiux-pro-max-distro-brand-id-validation.md`
- `uiux-pro-max-original-v2-notes.md`
- `distro-ux-case-study-comparison.md`
- `distro-master-design-compare.md`

## Success Condition for Later Stories

Later Epic 4 stories should be considered successful only if the improved absorb:

- increases reusable UX pattern coverage
- increases interaction-system completeness
- improves `MASTER.md` depth
- does not regress in brand fit
- does not regress in product fit
- does not weaken BMAD source-of-truth safety
