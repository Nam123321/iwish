---
story_id: "STORY-UIUX-4.2"
epic_id: "EPIC-UIUX-04"
title: "Add Trimmed Retrieval Dataset Plan"
status: "DONE"
assignee: "Vegeta"
priority: "P2"
depends_on: ["STORY-UIUX-4.1"]
phase: "forge"

---
# Story UIUX-4.2: Add Trimmed Retrieval Dataset Plan

## 1. Objective

Define the exact subset of the original UI/UX Pro Max repository that will be imported into I-Wish to support the retrieval-sandwich architecture defined in Story 4.1. This ensures we gain reusable UX patterns and interaction-system coverage without importing the entire external repo or creating noise.

## 1.1 Context

In Epic 3 and Epic 4.1, we concluded that the original UI/UX Pro Max repo is stronger at reusable UX patterns and interaction-system completeness, but weaker at brand fit and governance readiness than the current I-Wish absorb.

Story 4.1 established a retrieval-sandwich architecture where original-repo synthesis is used as evidence, not authority. Now, we must define the *Trimmed Retrieval Dataset Plan*—the specific files, patterns, and directories that will be scraped or imported from the original repo to serve as this evidence base.

**Source artifacts:**
- `_iwish-output/epics/epic-uiux-pro-max-specialist.md`
- `docs/ui-ux-pro-max-specialist-integration/retrieval-sandwich-architecture.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`

**Target integration surface:**
- `docs/ui-ux-pro-max-specialist-integration/trimmed-retrieval-dataset-plan.md`

**Dependency state:**
- `STORY-UIUX-4.1` is done.

## 2. User Story

As a I-Wish workflow owner,  
I want a trimmed retrieval dataset plan,  
So that we only import high-value UX patterns and interaction structures from the original repo without bloating I-Wish with redundant or off-brand files.

## 3. Acceptance Criteria

### AC1: Identify High-Value Retrieval Targets
**Given** the original UI/UX Pro Max repo has many directories  
**When** the dataset plan is defined  
**Then** it must specifically target reusable UX patterns, interaction systems, and structural scaffolding  
**And** it must explicitly exclude low-value or conflicting areas (e.g., rigid branding tokens that override I-Wish).

### AC2: Define the Import Mechanism
**Given** I-Wish needs to ingest this data  
**When** the dataset plan is defined  
**Then** it must describe how the data will be ingested (e.g., partial repomix, targeted copy, or API extraction)  
**And** how it will be stored as an isolated evidence layer within I-Wish.

### AC3: Plan Stays Documentation-First
**Given** this story is for planning the dataset  
**When** Vegeta implements it  
**Then** only the plan document is created  
**And** the actual data extraction and workflow modifications are deferred to later stories.

## 4. Tasks

### T1: Draft the Trimmed Retrieval Dataset Plan
- [x] Create `docs/ui-ux-pro-max-specialist-integration/trimmed-retrieval-dataset-plan.md`.
- [x] Document the inclusion criteria (what we want).
- [x] Document the exclusion criteria (what we do not want).

### T2: Define the Ingestion Strategy
- [x] Document the technical mechanism for importing the trimmed dataset.
- [x] Define where this dataset will live within I-Wish's architecture (e.g., `_iwish/knowledge/uiux-pro-max-evidence/`).

### T3: Validate the Plan Against Architecture
- [x] Ensure the dataset plan aligns with the `retrieval-sandwich-architecture.md` (evidence-only rule).
- [x] Validate that it satisfies NFR1 (Do not import the entire external repo).

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Identify High-Value Retrieval Targets | T1 | Inclusion and exclusion criteria | ✅ |
| AC2 | Define the Import Mechanism | T2 | Ingestion strategy and storage location | ✅ |
| AC3 | Plan Stays Documentation-First | T1, T2 | Documentation only | ✅ |

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
| Functional Correctness | 9 | The plan correctly defines what to retrieve, aligning with the retrieval-sandwich architecture. |
| Data Integrity & State | 9 | No data is actually mutated; this is a planning document. |
| Security & Validation | 9 | Defines safe boundaries for external data ingestion. |
| Performance & Scalability | 9 | Trimming the dataset ensures we don't bloat the AI context window. |
| Error Handling & Recovery | 9 | Explicit exclusions prevent conflicting data from entering the system. |
| Code Quality & Maintainability | 9 | The planned ingestion strategy keeps the external evidence isolated. |
| UX Empathy | 9 | Focuses on retrieving valuable UX patterns to improve end-user design quality. |

**Total Average:** 9.00 / 10 — PASS

## 8. Vegeta Agent Record

### Implementation Status
- Created `docs/ui-ux-pro-max-specialist-integration/trimmed-retrieval-dataset-plan.md`.
- Defined inclusion criteria for UX Patterns, Component Scaffolding, and Checklists.
- Defined explicit exclusion criteria for Rigid Design Tokens, Highly Specific Product Implementations, and Executable Build Scripts to prevent brand override.
- Specified a Targeted Partial Repomix ingestion strategy storing output in `_iwish/knowledge/uiux-pro-max-evidence/`.

### Tests / Validation Run
- Confirmed alignment with retrieval-sandwich architecture's Evidence-Only Rule.
- Verified no data was imported or mutated in this story.

### Code Review Disposition
- Code Review workflow invoked successfully. Code conforms to planning objectives. No compilation block since it's a documentation epic.
