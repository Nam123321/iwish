---
story_id: "STORY-HSEA-1.1"
epic_id: "EPIC-HSEA"
title: "Define I-Wish Project Memory Model"
status: "DONE"
assignee: "Piccolo"
priority: "P0"
depends_on: []
phase: "forge"

---
# Story HSEA-1.1: Define I-Wish Project Memory Model

## 1. Objective

Define how I-Wish adapts Hermes' assistant memory model into a project-centered memory model where `PROJECT.md` is primary for product development work and `USER.md` remains a cross-project preference layer.

## 1.1 Context

Hermes uses memory as an assistant for a human across many tasks. I-Wish-DragonBall is a project/process system. If I-Wish copies Hermes' `USER.md`-centered memory directly, project constraints may be diluted by personal preferences or unrelated history.

**Source artifacts:**
- `${IWISH_HOME}/repo-dna/hermes-agent-dna.md`
- `${IWISH_HOME}/gap-analysis/hermes-agent-gap-analysis.md`
- `${IWISH_HOME}/sandbox/hermes-agent/website/docs/user-guide/features/memory.md`

**Target integration surface:**
- `.agent/memory/`
- I-Wish project-context documentation or template surfaces
- Any workflow pointer that loads persistent project context

## 2. User Story

As a I-Wish project agent,  
I want memory separated by user, project, workflow, and session,  
So that project-specific constraints guide development without being overwritten by generic assistant preferences.

## 3. Acceptance Criteria

### AC1: Memory Layers Are Defined
**Given** I-Wish needs persistent memory  
**When** the memory model is documented  
**Then** it defines `USER.md`, `PROJECT.md`, workflow memory, and session/learning-log memory  
**And** each layer has a clear scope and owner.

### AC2: `PROJECT.md` Is Primary for Product Work
**Given** a I-Wish workflow is developing or reviewing a product/project  
**When** persistent memory is selected  
**Then** `PROJECT.md` is treated as the primary project memory  
**And** `USER.md` is treated as preference context only.

### AC3: Precedence Rules Are Explicit
**Given** memory conflicts with current instructions or project constraints  
**When** the agent resolves priority  
**Then** it follows: system/safety, project instructions, workflow instructions, current user request, user preferences, historical session notes.

### AC4: Context Budget Guidance Exists
**Given** memory files can grow over time  
**When** a workflow loads memory  
**Then** it loads only relevant sections or summaries  
**And** avoids dumping full historical memory into every turn.

### AC5: Migration Notes Cover Hermes Difference
**Given** Hermes is assistant-user oriented  
**When** I-Wish documents the adaptation  
**Then** it explains why I-Wish uses `PROJECT.md` instead of making `USER.md` the dominant memory.

## 4. Tasks

### T1: Draft Memory Model
- Define memory layers and file responsibilities.
- Include project-first default for I-Wish work.
- Include conflict-resolution precedence.

### T2: Add Template Guidance
- Add or update memory templates only if they exist in the active I-Wish structure.
- Keep template wording concise and project-scoped.

### T3: Add Workflow Loading Guidance
- Document how workflows should choose which memory layer to read.
- Include context-budget guidance.

### T4: Validate
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm no unrelated workflow behavior changed.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Status |
|---|---|---|---|
| AC1 | Memory layers defined | T1 | Done |
| AC2 | `PROJECT.md` primary | T1, T2 | Done |
| AC3 | Precedence explicit | T1 | Done |
| AC4 | Context budget guidance | T3 | Done |
| AC5 | Hermes difference documented | T1 | Done |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 5 ACs | 0 |
| Data Model Spread | Markdown memory model only | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Agent memory + workflow guidance | 1 |
| Flow Complexity | No runtime state machine | 0 |
| Test Burden | Script validation only | 0 |

**Complexity Score:** 1  
**Verdict:** OK - story is well-scoped.

## 7. Definition of Done

- [x] Memory layers are documented.
- [x] `PROJECT.md` precedence is explicit.
- [x] `USER.md` role is constrained to cross-project preference.
- [x] Workflow memory/loading guidance exists.
- [x] Validation scripts pass.

## 8. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story directly addresses the key Hermes-to-I-Wish adaptation risk. |
| Data Integrity & State | 9 | Separating memory layers prevents user preference and project state from contaminating each other. |
| Security & Validation | 9 | No external code or runtime behavior is introduced. |
| Performance & Scalability | 9 | Context-budget guidance prevents memory bloat. |
| Error Handling & Recovery | 9 | Precedence rules define conflict recovery. |
| Code Quality & Maintainability | 9 | The patch is docs/template-focused and narrow. |
| UX Empathy | 9 | Project teams get stable project memory without losing human preference context. |

**Total Average:** 9.00 / 10 - PASS

## 9. File List

- `_iwish-output/stories/sprint-status.yaml`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1-project-memory-model.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/memory/PROJECT_TEMPLATE.md`
- `.agent/memory/USER_TEMPLATE.md`
- `.agent/workflows/iwish-bmm-create-story.md`
- `.agent/agents/vegeta.md`
- `.agent/workflows/iwish-bmm-code-review.md`

## 10. Agent Record

### Planned

- Update sprint tracking for `EPIC-HSEA` and `STORY-HSEA-1.1`.
- Define I-Wish project-centered memory layers.
- Add project/user memory template guidance.
- Add memory loading guidance to story creation, implementation, and code review surfaces.
- Validate KG and portability.

### Implementation Status

- Added `EPIC-HSEA` to sprint status and marked `STORY-HSEA-1.1` as active during implementation.
- Updated `.agent/memory/MEMORY_SCHEMA.md` with I-Wish memory layers, precedence, context-budget rules, and Hermes adaptation notes.
- Added `.agent/memory/PROJECT_TEMPLATE.md` for project-scoped product/process memory.
- Added `.agent/memory/USER_TEMPLATE.md` for cross-project user preference memory.
- Patched `.agent/workflows/iwish-bmm-create-story.md` with a project memory gate for story context and Dev Notes.
- Patched `.agent/agents/vegeta.md` with a project memory gate before story implementation context gathering.
- Patched `.agent/workflows/iwish-bmm-code-review.md` with project-memory review and memory-based finding calibration gates.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.

### Decisions

- Chose `.agent/memory/PROJECT.md` as the project-local primary memory file when present.
- Chose `.agent/memory/USER.md` as optional cross-project preference memory only.
- Kept implementation documentation/workflow-focused; no runtime auto-mutation or canonical asset automation was introduced.
