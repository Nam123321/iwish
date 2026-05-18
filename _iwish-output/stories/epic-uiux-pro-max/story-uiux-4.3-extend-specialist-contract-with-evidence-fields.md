---
story_id: "STORY-UIUX-4.3"
epic_id: "EPIC-UIUX-04"
title: "Extend Specialist Contract With Evidence Fields"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-UIUX-4.1", "STORY-UIUX-4.2"]
phase: "forge"

---
# Story UIUX-4.3: Extend Specialist Contract With Evidence Fields

## 1. Objective

Extend the existing UI/UX Pro Max Specialist Recommendation Output Contract (established in Story 1.3) to include specific evidence-tracking fields. This formalizes the "evidence, not authority" retrieval-sandwich architecture by requiring the specialist to explicitly declare what archetypes it retrieved from the original repo, what it rejected, and why.

## 1.1 Context

In Epic 4, we implemented the Retrieval-Sandwich Architecture (Story 4.1) and the Trimmed Retrieval Dataset Plan (Story 4.2). The architecture dictates that any data retrieved from the original UI/UX Pro Max repo is treated purely as "evidence" and must be synthesized through I-Wish's governance layers (Brand Truth, Product Truth) before being accepted.

To make this verifiable, the specialist output contract must capture this synthesis process. Downstream reviewers (and UX Guardian) need to see exactly what original-repo patterns were considered and why they were accepted or rejected.

**Source artifacts:**
- `_iwish-output/epics/epic-uiux-pro-max-specialist.md`
- `docs/ui-ux-pro-max-specialist-integration/retrieval-sandwich-architecture.md`
- `docs/ui-ux-pro-max-specialist-integration/trimmed-retrieval-dataset-plan.md`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.3-output-contract.md`

**Target integration surface:**
- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`

**Dependency state:**
- `STORY-UIUX-4.1` is done.
- `STORY-UIUX-4.2` is done.

## 2. User Story

As a I-Wish UX reviewer or workflow agent,  
I want the UI/UX Pro Max specialist to explicitly list the evidence it retrieved and its rejection reasons,  
So that I can verify it correctly synthesized external UX patterns without overriding I-Wish brand constraints.

## 3. Acceptance Criteria

### AC1: Add Evidence Tracking Fields
**Given** the specialist contract defined in Story 1.3  
**When** the contract is extended  
**Then** it must include the following new mandatory fields:
- `Evidence Sources`: The files or patterns retrieved from the trimmed dataset.
- `Rejected Archetypes`: Patterns from the original repo that were considered but discarded.
- `Rejection Reasons`: The specific I-Wish constraint (e.g., Brand Truth, Product Truth) that caused the rejection.

### AC2: Synthesized Output Integration
**Given** the specialist generates a recommendation  
**When** it includes evidence from the original repo  
**Then** the `Recommended Direction` and `Interaction Notes` fields must explicitly reflect the *synthesized* outcome, not just a raw copy of the original archetype.

### AC3: Update Specialist Skill Example
**Given** the specialist skill contains an example contract block  
**When** the contract is extended  
**Then** the example block must be updated to demonstrate the new evidence fields in action  
**And** it must show a clear example of an archetype being rejected due to a I-Wish constraint.

## 4. Tasks

### T1: Update Output Contract Sections
- [x] Modify `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- [x] Add `Evidence Sources`, `Rejected Archetypes`, and `Rejection Reasons` to the standard output sections list.
- [x] Define concision limits for these new fields (e.g., maximum 3 sources, bulleted reasons).

### T2: Update Contract Example Block
- [x] Rewrite the existing example contract block in `SKILL.md`.
- [x] Ensure the new evidence fields are populated realistically.
- [x] Show an archetype being rejected (e.g., "rejected dark mode rigid tokens due to I-Wish light-theme brand truth").

### T3: Validate Contract Portability
- [x] Ensure the extended contract remains compact enough for story/spec inclusion without causing prompt bloat.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Add Evidence Tracking Fields | T1 | Add fields to list, define limits | ✅ |
| AC2 | Synthesized Output Integration | T1 | Update descriptions of existing fields | ✅ |
| AC3 | Update Specialist Skill Example | T2 | Rewrite example block with rejection | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 3 ACs | 0 |
| Data Model Spread | 0 DB models | 0 |
| UI Surface | 0 new UI components | 0 |
| Cross-Domain | 1 bounded context | 0 |
| Flow Complexity | No async runtime | 0 |
| Test Burden | 0 E2E tags | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The new fields directly enforce the retrieval-sandwich evidence-only rule. |
| Data Integrity & State | 9 | No state mutation; purely contract extension. |
| Security & Validation | 9 | Rejection tracking provides an audit trail for constraint enforcement. |
| Performance & Scalability | 8 | Adding fields slightly increases output size, but concision limits mitigate prompt bloat. |
| Error Handling & Recovery | 9 | Explicit rejection reasons help humans debug why a pattern wasn't used. |
| Code Quality & Maintainability | 9 | Centralizing the contract in SKILL.md keeps maintenance simple. |
| UX Empathy | 9 | Makes the AI's design reasoning transparent to the user. |

**Total Average:** 8.85 / 10 — PASS

## 8. Vegeta Agent Record

### Implementation Status
- Updated `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- Added `Evidence Sources`, `Rejected Archetypes`, and `Rejection Reasons` to the Recommended Output Contract.
- Added concision limits for the new fields (max 3 sources, bulleted rejection reasons).
- Updated the Example Contract Blocks to demonstrate the new evidence fields, including a constrained conflict rejection case.

### Tests / Validation Run
- Confirmed the extended contract output is compact and avoids prompt bloat.
- Validation scripts `validate-kg.sh` and `validate-portability.sh` passed.

### Code Review Disposition
- Verified alignment with the Retrieval-Sandwich Architecture (evidence, not authority).
- Story completed without compilation errors or blocker issues.
