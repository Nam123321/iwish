---
stepsCompleted: [requirements-inventory, epic-design, story-breakdown, sprint-ready]
inputDocuments:
  - docs/ui-ux-pro-max-specialist-integration/implementation-plan.md
  - docs/ui-ux-pro-max-specialist-integration/epics.md
  - _iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md
phase: "origin"

---
# UI/UX Pro Max Specialist Integration - Epic Breakdown

## Overview

This epic set implements **Selective Extract + Full Invocation for Design Tasks**. UI/UX Pro Max becomes a I-Wish specialist engine for product-aware design direction, design-system seeding, story UI recommendations, and review evidence. It does not replace I-Wish's Design System Gate, Stitch visual contract, User Simulation Guardian, Design Consultation, or UX Guardian.

## Requirements Inventory

### Functional Requirements

- **FR1:** Provide a I-Wish-native UI/UX Pro Max Specialist wrapper.
- **FR2:** Define authority hierarchy and non-override behavior.
- **FR3:** Add invocation rules for visual foundation, design-system gate, story UI spec, design review, and frontend code review.
- **FR4:** Define compact recommendation output contract.
- **FR5:** Support full UI/UX Pro Max invocation for design-heavy tasks.
- **FR6:** Add Master + page override persistence guidance.
- **FR7:** Add conflict-resolution rules.
- **FR8:** Add validation guidance and sample scenarios.
- **FR9:** Improve the absorb with controlled retrieval from the original repo where the original repo is measurably stronger.
- **FR10:** Improve reusable UX pattern coverage and interaction-system completeness for governed `MASTER.md` generation.

### NonFunctional Requirements

- **NFR1:** Do not import the entire external repo into I-Wish core.
- **NFR2:** Keep workflow patches narrow and reversible.
- **NFR3:** Keep specialist output concise enough for story/spec consumption.
- **NFR4:** Existing I-Wish workflows remain the controlling authority.
- **NFR5:** Validate through document review and sample UI flows.

### FR Coverage Map

- **FR1:** Epic 1
- **FR2:** Epic 1
- **FR3:** Epic 2
- **FR4:** Epic 1
- **FR5:** Epic 2
- **FR6:** Epic 2
- **FR7:** Epic 1
- **FR8:** Epic 3
- **FR9:** Epic 4
- **FR10:** Epic 4

## Epic List

### Epic 1: Governed UI/UX Pro Max Specialist

I-Wish agents can invoke UI/UX Pro Max as a specialist design-intelligence source without confusing it with I-Wish's existing source-of-truth UX gates.

**Stories:**
- Story UIUX-1.1: Create Specialist Skill Wrapper
- Story UIUX-1.2: Define Authority Hierarchy and Non-Override Rule
- Story UIUX-1.3: Define Recommendation Output Contract
- Story UIUX-1.4: Define Conflict Resolution Procedure

### Epic 2: Workflow-Level Specialist Invocation

I-Wish's UI/UX workflows call UI/UX Pro Max at the right moments: before visual direction, before Stitch generation, during story UI spec generation, and during design/frontend review.

**Stories:**
- Story UIUX-2.1: Add Visual Foundation Invocation
- Story UIUX-2.2: Add Design System Gate Invocation
- Story UIUX-2.3: Add Story UI Spec Invocation
- Story UIUX-2.4: Add Review Invocation for Design and Code Review
- Story UIUX-2.5: Add Master + Page Override Guidance

### Epic 3: Validation and Quality Feedback Loop

The team can verify whether UI/UX Pro Max improves design output quality, measure failure modes, and tune invocation rules before deeper absorption.

**Stories:**
- Story UIUX-3.1: Define Sample Validation Scenarios
- Story UIUX-3.2: Add Specialist Quality Checklist
- Story UIUX-3.3: Create Rollback and Tuning Path

### Epic 4: Controlled Retrieval and Interaction-System Absorption

I-Wish improves the current absorb by selectively importing the original repo's stronger reusable UX patterns, interaction-system scaffolding, and master-design breadth without surrendering brand-fit or governance safety.

**Stories:**
- Story UIUX-4.1: Define Retrieval-Sandwich Architecture
- Story UIUX-4.2: Add Trimmed Retrieval Dataset Plan
- Story UIUX-4.3: Extend Specialist Contract With Evidence Fields
- Story UIUX-4.4: Add Reusable UX Pattern and Interaction-System Layer
- Story UIUX-4.5: Re-Run Comparative Validation for Master Design Quality

## Sprint Entry Recommendation

Start with Epic 1. Mark Story UIUX-1.1 as `ready-for-Vegeta`; keep the remaining stories in `backlog` until the specialist wrapper exists and can anchor the rest of the workflow patches.

Before Vegeta implements Story UIUX-1.1, Grand-Priest/Vegeta must record the capability classification:

- Primary: `SKILL_ATTACHMENT`
- Secondary implementation type: targeted `WORKFLOW_PATCH`
- Not selected: `DEDICATED_WORKFLOW`, `NEW_PERSONA`, `COMPOUND_INTEGRATION`

Story-level classification remains required only for new artifacts introduced by that story.
