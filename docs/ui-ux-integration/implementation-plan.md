# UI/UX Pro Max Specialist Integration — Implementation Plan

> Date: 2026-05-09  
> Decision: Selective Extract + Full Invocation for Design Tasks  
> Source DNA: `_bmad-output/repo-dna/ui-ux-pro-max-skill-dna.md`  
> Gap Analysis: `docs/ui-ux-pro-max-specialist-integration/gap-analysis.md`

## 1. Decision Summary

BMAD-DragonBall will not replace its current UI/UX workflows with UI/UX Pro Max. Instead, UI/UX Pro Max becomes a specialist design-intelligence engine that is invoked at specific points where its corpus and reasoning workflow create leverage.

The strongest argument against a full replacement is that UI/UX Pro Max is primarily a recommendation/search/design-system skill, while BMAD already has a workflow governance system: Design System Gate, Stitch-first visual contract, User Simulation Guardian, Design Consultation, UX Guardian, and story-level approval.

Validation work completed after the initial rollout adds one important refinement to this decision:

- BMAD's current absorb is stronger at `brand fit`, `product fit`, and source-of-truth safety.
- The original UI/UX Pro Max repo is stronger at `reusable UX patterns`, `interaction-system completeness`, and broad first-pass system scaffolding.

Therefore the next improvement phase should not aim to replace the absorb with the original repo. It should selectively import controlled retrieval and pattern scaffolding from the original repo into the BMAD-governed absorb.

## 2. Integration Model

### Classification Gate

Before any implementation story starts, Grand-Priest/Vegeta must run a capability classification pass using the BMAD funnel:

- **Primary classification:** `SKILL_ATTACHMENT`
- **Reason:** UI/UX Pro Max is used as an on-demand specialist capability that agents load for design intelligence. It should not become a global persona or replace existing workflows.
- **Supporting changes:** targeted `WORKFLOW_PATCH` updates in existing UI/UX workflows, created only after the specialist wrapper exists.
- **Rejected classifications:**
  - `DEDICATED_WORKFLOW` as the primary type, because the value is not a standalone workflow; it is invoked inside existing design/spec/review workflows.
  - `NEW_PERSONA`, because BMAD already has UX/design governance agents and adding another authority would create conflict.
  - `COMPOUND_INTEGRATION`, because the recommended rollout does not import the full repo or create a librarian agent.

Each story may still classify any new artifact it creates, but story-level classification is a verification step, not a substitute for this up-front capability classification.

### Control Hierarchy

1. **BMAD workflow rules** decide when a UI/UX task can proceed.
2. **Approved Design System and Stitch screens** are the visual source of truth.
3. **User Simulation Guardian** validates real-user fit and non-linear usage.
4. **Design Consultation and UX Guardian** review quality, behavior tokens, and implementation readiness.
5. **UI/UX Pro Max Specialist** supplies design-system recommendations, product/style/color/typography reasoning, anti-patterns, and stack-specific UI guidance.

### Non-Override Rule

UI/UX Pro Max cannot override approved Stitch screens or existing portal Design System tokens. After Stitch approval, it can only act as a checklist and critique input.

## 3. Feature Scope

### In Scope

- Add a `ui-ux-pro-max-specialist` BMAD skill or local adapter.
- Preserve the full UI/UX Pro Max source repo in sandbox as reference.
- Define invocation rules for:
  - UX visual foundation
  - Design-system gate
  - Per-story UI spec generation
  - Design review
  - UI implementation review
- Add a BMAD-facing output contract for UI/UX Pro Max recommendations.
- Add Master + page override design-system pattern to BMAD planning artifacts.
- Add explicit conflict-resolution rules between UI/UX Pro Max, Stitch, UX Guardian, and Design Consultation.
- Add a later controlled-retrieval layer that can import a trimmed subset of original-repo pattern and UX evidence into the absorb.
- Add a later interaction-system and reusable UX pattern layer that improves `MASTER.md` quality without bypassing BMAD governance.

### Out of Scope

- Replacing BMAD's current UI/UX workflows.
- Importing the multi-platform installer.
- Importing all font license files and full Google Fonts database into BMAD core.
- Replacing Stitch MCP flow.
- Replacing User Simulation Guardian.
- Blindly trusting raw original-repo `--design-system` synthesis as BMAD source of truth.
- Importing the entire original CSV corpus without validation, trimming, and governance rules.

## 4. Target Touchpoints

| BMAD Touchpoint | UI/UX Pro Max Role | Output |
|---|---|---|
| `step-08-visual-foundation.md` | Generate product-aware style/color/type direction | Visual direction recommendation |
| `step-00b-design-system-gate.md` | Pre-Stitch recommendation context | Design-system seed brief |
| `workflow-entry.md` / create UI spec | Story-specific design intelligence pass | Story UI recommendation block |
| `design-consultation` | Specialist evidence for review | Critique checklist and anti-patterns |
| `ux-guardian` | Supplemental behavior and UX quality rules | Non-blocking recommendations unless adopted as BMAD tokens |
| `bmad-bmm-code-review.md` | UI implementation checklist | Frontend quality review aid |

## 5. Proposed Artifact Structure

```text
.agent/
  skills/
    ui-ux-pro-max-specialist/
      SKILL.md
      adapter.md
      data/
        product-style-map.csv        # optional trimmed data
        ux-checklist.md              # curated high-signal rules
        ux-patterns.csv              # optional trimmed reusable interaction patterns
        interaction-modules.csv      # optional trimmed component/state scaffolding
      scripts/
        search.py                    # optional copied/trimmed engine
        guided_search.py             # later orchestration wrapper for constrained retrieval + synthesis

docs/
  ui-ux-pro-max-specialist-integration/
    implementation-plan.md
    epics.md
```

## 6. Rollout Phases

### Phase A — Routing and Governance

Define when the specialist must be invoked and how its output is ranked against existing BMAD authorities.

### Phase B — Specialist Adapter

Create a BMAD-native skill wrapper that can use either:
- Full sandbox UI/UX Pro Max source for now, or
- A later trimmed local copy if the team wants portability.

### Phase C — Workflow Integration

Patch selected workflows to call the specialist in a narrow, predictable place.

### Phase D — Validation

Run sample UI stories through the updated flow and compare:
- Design clarity
- Stitch prompt quality
- User simulation findings
- Review defects caught before implementation

### Phase E — Controlled Retrieval and Interaction-System Absorption

Use validation evidence to selectively absorb the parts of the original repo that outperform the current BMAD absorb:

- reusable UX patterns
- interaction-system completeness
- first-pass `MASTER.md` scaffolding depth

This phase should introduce a governed retrieval sandwich:

1. brand truth extraction
2. product archetype retrieval
3. style / landing / UX pattern retrieval
4. rejection of off-brand archetypes
5. BMAD-governed final recommendation

The goal is to let BMAD keep its stronger product-fit judgment while borrowing the original repo's broader pattern library.

## 7. Success Metrics

- UI specs include product-aware design direction before Stitch generation.
- Story UI specs preserve approved Design System tokens.
- No conflict where UI/UX Pro Max overrides Stitch-approved layout.
- Design Consultation has richer evidence and fewer generic findings.
- Vegeta implementation tasks receive clearer style/UX constraints.
- `MASTER.md` drafts become more complete in reusable interaction rules, states, and component scaffolding.
- Validation comparisons show absorb quality improving in `interaction system completeness` and `reusable UX pattern coverage` without regressing `brand fit` or `product fit`.
- Original-repo retrieval is used as evidence input rather than ungoverned design authority.

## 8. Key Risks

### Risk: Imported advice conflicts with BMAD gates

Mitigation: enforce the Non-Override Rule.

### Risk: Integration becomes too broad

Mitigation: start with workflow routing and adapter only; delay data/code copying until validated.

### Risk: "More recommendations" slows delivery

Mitigation: require concise output contract: max 1 design direction, max 5 anti-patterns, max 10 checklist items unless user asks for depth.

### Risk: Original-repo breadth reintroduces design drift

Mitigation: import only validated retrieval slices, require archetype rejection logic, and keep BMAD absorb as the final decision layer.

### Risk: Better master-design breadth weakens source-of-truth safety

Mitigation: treat imported pattern scaffolding as candidate evidence until it passes BMAD review and is normalized into governed `MASTER.md` rules.

## 9. Next Step

Implement Epic 1 first. It creates the governance and routing layer without changing runtime behavior broadly.

## 10. Improvement Direction After Epic 3

Based on the Distro comparison and UX case study:

- keep the current absorb as the BMAD-governed source-of-truth layer
- improve it with controlled imports from the original repo where the original repo was measurably stronger:
  - reusable UX patterns
  - interaction-system completeness
  - first-pass master-design breadth

This work should be handled as a new epic after the initial validation loop, not as an ad hoc patch.
