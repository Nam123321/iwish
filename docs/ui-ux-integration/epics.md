---
stepsCompleted:
  - requirements-inventory
  - epic-design
  - story-breakdown
inputDocuments:
  - docs/ui-ux-pro-max-specialist-integration/gap-analysis.md
  - _bmad-output/repo-dna/ui-ux-pro-max-skill-dna.md
  - docs/ui-ux-pro-max-specialist-integration/implementation-plan.md
---

# UI/UX Pro Max Specialist Integration - Epic Breakdown

## Overview

This document turns the approved integration direction into BMAD-style epics and stories. The chosen approach is **Selective Extract + Full Invocation for Design Tasks**: UI/UX Pro Max becomes a specialist design-intelligence engine inside BMAD workflows, while BMAD keeps its current UX governance, Stitch-first visual contract, User Simulation Guardian, Design Consultation, and UX Guardian.

## Requirements Inventory

### Functional Requirements

- **FR1:** Provide a BMAD-native UI/UX Pro Max Specialist wrapper that explains when and how to use UI/UX Pro Max inside BMAD.
- **FR2:** Define a strict authority hierarchy so UI/UX Pro Max cannot override approved BMAD Design System or Stitch screens.
- **FR3:** Add invocation rules for visual foundation, design-system gate, per-story UI specs, design review, and frontend code review.
- **FR4:** Define a concise UI/UX Pro Max recommendation output contract for BMAD agents.
- **FR5:** Support full UI/UX Pro Max invocation for tasks that need product/style/color/typography/anti-pattern reasoning.
- **FR6:** Add Master + page override design-system persistence guidance to BMAD planning workflows.
- **FR7:** Add conflict-resolution rules when UI/UX Pro Max recommendations disagree with Stitch, UX Guardian, or Design Consultation.
- **FR8:** Add validation guidance and sample scenarios to compare output quality before and after integration.
- **FR9:** Improve the absorb with controlled retrieval from the original repo where the original repo is measurably stronger.
- **FR10:** Improve reusable UX pattern coverage and interaction-system completeness for governed `MASTER.md` generation.

### NonFunctional Requirements

- **NFR1:** Integration must not bloat BMAD core with the entire external repo.
- **NFR2:** Workflow patches must be narrow and reversible.
- **NFR3:** Specialist output must be concise enough for story/spec consumption.
- **NFR4:** Existing BMAD workflows must remain the controlling authority.
- **NFR5:** Implementation must be testable through document review and at least one sample UI flow.

### Additional Requirements

- Preserve the full UI/UX Pro Max source in sandbox as reference during initial rollout.
- Do not import the multi-platform installer.
- Do not import full font-license and Google Fonts bundles unless a later story proves the need.
- Keep the first release as governance + specialist wrapper before copying executable scripts/data into BMAD.

### FR Coverage Map

- **FR1:** Epic 1 - Specialist identity and adapter
- **FR2:** Epic 1 - Control hierarchy and non-override rule
- **FR3:** Epic 2 - Workflow touchpoint integration
- **FR4:** Epic 1 - Recommendation output contract
- **FR5:** Epic 2 - Full invocation path for design tasks
- **FR6:** Epic 2 - Master + page override pattern
- **FR7:** Epic 1 - Conflict-resolution rules
- **FR8:** Epic 3 - Validation and quality measurement
- **FR9:** Epic 4 - Controlled retrieval and pattern absorption
- **FR10:** Epic 4 - Controlled retrieval and pattern absorption

## Epic List

### Epic 1: Governed UI/UX Pro Max Specialist

BMAD agents can invoke UI/UX Pro Max as a specialist design-intelligence source without confusing it with BMAD's existing source-of-truth UX gates.

**FRs covered:** FR1, FR2, FR4, FR7

### Epic 2: Workflow-Level Specialist Invocation

BMAD's UI/UX workflows can call UI/UX Pro Max at the right moments: before visual direction, before Stitch generation, during story UI spec generation, and during design/frontend review.

**FRs covered:** FR3, FR5, FR6

### Epic 3: Validation and Quality Feedback Loop

The team can verify whether UI/UX Pro Max improves design output quality, measure failure modes, and tune invocation rules before deeper absorption.

**FRs covered:** FR8, NFR5

### Epic 4: Controlled Retrieval and Interaction-System Absorption

BMAD improves the current absorb by selectively importing the original repo's stronger reusable UX patterns, interaction-system scaffolding, and master-design breadth without surrendering brand-fit or governance safety.

**FRs covered:** FR9, FR10, NFR1, NFR2, NFR4

---

## Epic 1: Governed UI/UX Pro Max Specialist

Goal: Create a BMAD-native specialist layer that captures the useful power of UI/UX Pro Max while preserving BMAD's control hierarchy.

### Story 1.1: Create Specialist Skill Wrapper

As a BMAD agent,
I want a dedicated UI/UX Pro Max Specialist skill wrapper,
So that I know when to invoke the external design-intelligence engine and what output to return.

**Acceptance Criteria:**

**Given** implementation has not started  
**When** Grand-Priest/Vegeta prepares this capability for development  
**Then** the capability is explicitly classified as `SKILL_ATTACHMENT` with supporting `WORKFLOW_PATCH` changes  
**And** the rejected classifications `DEDICATED_WORKFLOW`, `NEW_PERSONA`, and `COMPOUND_INTEGRATION` are documented with reasons.

**Given** the UI/UX Pro Max repo DNA and gap analysis exist  
**When** a BMAD agent reads the new specialist skill  
**Then** it can identify supported use cases: design direction, design-system recommendation, story UI guidance, design review, and frontend UI review  
**And** it clearly states that the specialist complements, but does not replace, UX Guardian, Design Consultation, User Simulation Guardian, or Stitch Design Taste.

**Given** a task is pure backend, data, DevOps, or non-visual automation  
**When** the specialist trigger rules are evaluated  
**Then** the skill is skipped  
**And** no UI/UX Pro Max recommendation is required.

### Story 1.2: Define Authority Hierarchy and Non-Override Rule

As a BMAD workflow owner,
I want explicit authority rules for design decisions,
So that UI/UX Pro Max cannot conflict with approved BMAD design artifacts.

**Acceptance Criteria:**

**Given** an approved portal Design System or Stitch screen exists  
**When** UI/UX Pro Max recommends a conflicting color, typography, layout, or interaction  
**Then** the approved BMAD artifact wins  
**And** the specialist output is recorded only as a recommendation or review note.

**Given** no Design System exists for the portal  
**When** a visual foundation or design-system gate is run  
**Then** UI/UX Pro Max can provide seed recommendations  
**And** those recommendations must still be approved through BMAD's design-system workflow.

### Story 1.3: Define Recommendation Output Contract

As a Vegeta or UX workflow agent,
I want UI/UX Pro Max output in a compact standard format,
So that I can consume it without adding noisy design advice to every story.

**Acceptance Criteria:**

**Given** UI/UX Pro Max is invoked for a design task  
**When** the specialist returns its recommendation  
**Then** the output includes exactly these sections unless the user asks for more: Product Type, Recommended Direction, Color/Tone, Typography, Interaction Notes, Anti-Patterns, BMAD Conflict Check, and Next Workflow Use.

**Given** the recommendation includes many possible styles  
**When** the output is formatted for BMAD  
**Then** it selects one primary direction and at most two alternatives  
**And** includes no more than five anti-patterns and ten checklist items.

### Story 1.4: Define Conflict Resolution Procedure

As a reviewer,
I want a predictable conflict-resolution procedure,
So that competing UX signals do not stall or dilute the workflow.

**Acceptance Criteria:**

**Given** UI/UX Pro Max conflicts with UX Guardian behavioral tokens  
**When** the conflict is detected  
**Then** UX Guardian wins  
**And** the agent may raise a `[NEW_UX_PATTERN_PROPOSAL]` only if the recommendation reveals a genuinely missing behavior pattern.

**Given** UI/UX Pro Max conflicts with Design Consultation findings  
**When** the conflict is detected  
**Then** Design Consultation's multi-lens review is treated as the stronger final review  
**And** UI/UX Pro Max evidence may be cited as supporting context.

---

## Epic 2: Workflow-Level Specialist Invocation

Goal: Insert UI/UX Pro Max into BMAD where it increases design quality: before major visual decisions, during design-system creation, and during story-level UI work.

### Story 2.1: Add Visual Foundation Invocation

As a UX facilitator,
I want UI/UX Pro Max to inform early visual direction,
So that color, typography, style, and anti-pattern decisions are product-aware before Stitch work begins.

**Acceptance Criteria:**

**Given** `step-08-visual-foundation.md` or equivalent visual foundation workflow is running  
**When** product type, target users, and desired emotional response are known  
**Then** the workflow invokes UI/UX Pro Max for a design-system recommendation  
**And** the result is summarized as seed direction, not final source of truth.

**Given** the user already has approved brand guidelines  
**When** UI/UX Pro Max recommends conflicting brand choices  
**Then** brand guidelines win  
**And** the specialist output is constrained to implementation and anti-pattern advice.

### Story 2.2: Add Design System Gate Invocation

As a design-system workflow agent,
I want UI/UX Pro Max to seed Stitch prompts,
So that the 9-category design-system generation starts from a coherent product-aware direction.

**Acceptance Criteria:**

**Given** `step-00b-design-system-gate.md` is creating a portal Design System  
**When** the Stitch context template is prepared  
**Then** it includes a concise UI/UX Pro Max recommendation block  
**And** this block covers style, palette, typography mood, key effects, and anti-patterns.

**Given** Stitch variants are generated and the user approves one  
**When** the final Design System is saved  
**Then** the approved Stitch/Design System values supersede the UI/UX Pro Max seed recommendation.

### Story 2.3: Add Story UI Spec Invocation

As a story UI spec author,
I want story-specific UI/UX Pro Max guidance,
So that per-story screens inherit the portal design system while accounting for the story's domain and UI risks.

**Acceptance Criteria:**

**Given** `workflow-entry.md` creates a per-story UI spec  
**When** the Design System Gate and User Simulation Gate pass  
**Then** UI/UX Pro Max is invoked with product, portal, story title, acceptance criteria, persona, and design-system summary  
**And** the UI spec includes a "UI/UX Pro Max Specialist Notes" section.

**Given** UI/UX Pro Max recommends a layout inconsistent with approved Stitch screens  
**When** the UI spec is finalized  
**Then** the recommendation is rejected or reframed as a checklist note  
**And** the Stitch visual contract remains authoritative.

### Story 2.4: Add Review Invocation for Design and Code Review

As a reviewer,
I want UI/UX Pro Max to support design and frontend code review,
So that common accessibility, interaction, responsive, and stack-specific issues are caught earlier.

**Acceptance Criteria:**

**Given** Design Consultation reviews a UI spec or mockup  
**When** the UI/UX Pro Max Specialist is available  
**Then** the review may cite specialist findings under typography, color, layout, interaction, IA, accessibility, and anti-patterns  
**And** final severity remains owned by Design Consultation.

**Given** `bmad-bmm-code-review.md` reviews frontend UI changes  
**When** the change affects layout, styling, interaction, animation, accessibility, or charts  
**Then** the reviewer can invoke UI/UX Pro Max stack/domain guidance  
**And** any finding must still be grounded in the actual code or visual artifact.

### Story 2.5: Add Master + Page Override Guidance

As a BMAD UX workflow owner,
I want Master + page override rules,
So that project-wide design rules are stable but page-specific exceptions are explicit.

**Acceptance Criteria:**

**Given** a portal Design System exists  
**When** a page needs a justified deviation  
**Then** the workflow records it under `design-system/{portal-slug}/pages/{page}.md`  
**And** the page override explains what changes, why, and which master rules still apply.

**Given** a story UI spec is generated for a page  
**When** a page override exists  
**Then** the workflow reads the page override after `MASTER.md`  
**And** the override applies only to that page/story context  
**And** if an approved Stitch screen already exists for that same page state, the Stitch visual contract remains authoritative until a newer screen is approved.

---

## Epic 3: Validation and Quality Feedback Loop

Goal: Prove that the integration improves UI output quality without adding uncontrolled workflow bloat.

### Story 3.1: Define Sample Validation Scenarios

As a BMAD maintainer,
I want a small set of validation scenarios,
So that I can test whether specialist invocation improves design quality.

**Acceptance Criteria:**

**Given** the integration artifacts are drafted  
**When** validation scenarios are selected  
**Then** they include at least one dashboard/admin UI, one mobile/sales UI, and one public/webstore UI  
**And** each scenario defines the expected improvement signal.

**Given** a scenario is run  
**When** the old flow and specialist-enhanced flow are compared  
**Then** the comparison records design clarity, accessibility coverage, Stitch prompt quality, user simulation issues, and implementation readiness.

### Story 3.2: Add Specialist Quality Checklist

As a reviewer,
I want a checklist for deciding whether UI/UX Pro Max helped,
So that the team can tune or rollback the integration.

**Acceptance Criteria:**

**Given** a UI/UX Pro Max recommendation is included in a workflow artifact  
**When** a reviewer assesses it  
**Then** the checklist asks whether the recommendation was specific, source-of-truth compliant, persona-aware, implementable, accessible, and concise.

**Given** a recommendation is generic or conflicts with approved artifacts  
**When** the checklist is applied  
**Then** the reviewer can mark it as "Discard", "Use as critique", or "Promote to BMAD rule".

### Story 3.3: Create Rollback and Tuning Path

As a workflow owner,
I want a rollback and tuning path,
So that the integration can be adjusted without damaging existing BMAD workflows.

**Acceptance Criteria:**

**Given** the specialist produces repeated noisy or conflicting guidance  
**When** the issue is documented  
**Then** the invocation can be narrowed to only visual foundation and design-system gate workflows  
**And** story-level or code-review invocations can be disabled.

**Given** the specialist consistently improves output quality  
**When** validation passes  
**Then** the team can consider a second phase to copy a trimmed search engine and curated dataset into BMAD core.

---

## Epic 4: Controlled Retrieval and Interaction-System Absorption

Goal: Use validation evidence to selectively absorb the parts of the original UI/UX Pro Max repo that are better than the current BMAD absorb, especially reusable UX patterns and interaction-system completeness, while keeping BMAD governance as the final authority.

### Story 4.1: Define Retrieval-Sandwich Architecture

As a BMAD workflow owner,
I want a governed retrieval architecture,
So that original-repo evidence improves absorb quality without becoming unfiltered design authority.

**Acceptance Criteria:**

**Given** the original repo is available as a sandbox reference  
**When** the next absorb phase is designed  
**Then** the architecture explicitly sequences brand truth, product retrieval, style/landing retrieval, and final BMAD recommendation  
**And** it defines where archetype rejection happens before the final output contract is produced.

**Given** raw original-repo design-system synthesis can drift off-brand  
**When** the retrieval-sandwich is documented  
**Then** the plan states that raw synthesis output is evidence only  
**And** BMAD absorb remains the final governed decision layer.

### Story 4.2: Add Trimmed Retrieval Dataset Plan

As a maintainer,
I want a validated trimmed dataset plan,
So that BMAD can absorb high-signal pattern evidence without importing the full external corpus.

**Acceptance Criteria:**

**Given** the original repo contains many CSV/data sources  
**When** the trimmed-import plan is prepared  
**Then** it identifies which slices are candidates for BMAD import first  
**And** those slices include product, style, landing, reusable UX patterns, and interaction modules only if validated as high-value.

**Given** portability and repo bloat are concerns  
**When** the dataset plan is documented  
**Then** it excludes the installer, broad font bundles, and unvalidated low-signal data by default.

### Story 4.3: Extend Specialist Contract With Evidence Fields

As a workflow agent,
I want the specialist output to expose why a direction was chosen or rejected,
So that imported retrieval evidence remains explainable and reviewable.

**Acceptance Criteria:**

**Given** the specialist uses controlled retrieval inputs  
**When** it returns a recommendation  
**Then** the contract includes fields for chosen archetype, rejected archetypes, brand evidence, and product evidence  
**And** those fields are compact enough for BMAD story/spec usage.

**Given** an off-brand style family is retrieved  
**When** the final recommendation is produced  
**Then** the rejection reason is recorded explicitly  
**And** the off-brand result is not silently blended into the final direction.

### Story 4.4: Add Reusable UX Pattern and Interaction-System Layer

As a BMAD design-system author,
I want absorb to generate stronger reusable UX patterns and interaction rules,
So that `MASTER.md` drafts are more complete and reusable across website, dashboard, and mobile surfaces.

**Acceptance Criteria:**

**Given** the original repo performed better in reusable pattern breadth and interaction-system completeness  
**When** BMAD improves the absorb  
**Then** the new layer covers reusable rules for forms, alerts, AI modules, tables, navigation, states, and mobile interaction behavior  
**And** those rules remain normalized to BMAD brand/product context instead of copied verbatim from the original repo.

**Given** a `MASTER.md` draft is generated  
**When** the improved absorb is used  
**Then** the draft contains stronger system-level interaction guidance than the current absorb baseline  
**And** it does not regress in brand fit or product fit.

### Story 4.5: Re-Run Comparative Validation for Master Design Quality

As a maintainer,
I want a second validation pass after the absorb improvements,
So that the team can verify whether the new absorb closes the gap without reintroducing drift.

**Acceptance Criteria:**

**Given** Epic 4 improvements are implemented  
**When** the same benchmark cases are re-run  
**Then** the comparison includes at least one visual case and one UX-heavy operational case  
**And** it re-scores reusable UX pattern coverage, interaction-system completeness, brand fit, product fit, and source-of-truth readiness.

**Given** the improved absorb still underperforms or drifts  
**When** the results are reviewed  
**Then** the rollback/tuning path from Epic 3 is reused  
**And** no unvalidated import is promoted into BMAD source-of-truth artifacts.

---

## Definition of Done

- A specialist wrapper exists and documents triggers, skips, authority hierarchy, output contract, and conflict resolution.
- Workflow patches are limited to the approved touchpoints.
- No full external repo import is required for the first release.
- Story UI specs preserve existing BMAD gates: Design System Gate, User Simulation Gate, Stitch visual contract, Design Consultation, and UX Guardian.
- Validation scenarios demonstrate whether the integration improves design quality.
- Rollback path is documented.

## QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | Stories map directly to approved integration goals and cover wrapper, routing, workflow use, validation, and rollback. |
| Data Integrity & State | 8 | Master/page override state is specified, but exact planning artifact paths may need alignment with project config during implementation. |
| Security & Validation | 9 | No external executable import is required in first release; source repo already passed RAP Phase 0. |
| Performance & Scalability | 8 | Concise output contract limits context bloat; later data/script import needs a separate size/performance check. |
| Error Handling & Recovery | 9 | Conflict resolution and rollback paths are explicit. |
| Code Quality & Maintainability | 9 | Work is split into narrow stories, with workflow patches kept reversible. |
| UX Empathy | 9 | Preserves user simulation and Stitch approval while adding product-aware design intelligence. |

**Total Average:** 8.71 / 10 — PASS
