---
story_id: "STORY-HSEA-2.4"
epic_id: "EPIC-HSEA"
title: "Define Dual-Run Scope Activation and Darwin Adapter Gate"
status: "BACKLOG"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-2.3", "STORY-HSEA-4.2", "STORY-HSEA-4.5"]
phase: "forge"

---
# Story HSEA-2.4: Define Dual-Run Scope Activation and Darwin Adapter Gate

## 1. Objective

Define how I-Wish enables `run-both-then-judge` for Evolution Lab scope, when Darwinian installation is requested, how degraded mode works if the adapter is unavailable, and which project-scoped records must capture the chosen execution mode.

## 1.1 Context

The approved execution strategy is no longer native-first fallback inside Evolution Lab scope. For selected project-scoped assets, I-Wish should run both I-Wish-native and Darwinian candidate generation paths and judge them with the same trial scorecard. This story owns the activation gate so the system does not silently bias toward core-native execution.

**Required upstream model:**
- `.agent/fragments/evolution-lab-core-model.md`
- `.agent/fragments/evolution-lab-scoring-policy.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.3-darwinian-external-reference-boundaries.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.2-profile-aware-runtime-home.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.5-graph-backend-selection-adapter-contract.md`

## 2. User Story

As a I-Wish maintainer,  
I want dual-run scope activation and Darwinian setup to happen deliberately at the project/profile level,  
So that trial comparisons are fair, non-silent, and traceable instead of drifting into native-first bias.

## 3. Acceptance Criteria

### AC1: Evolution Lab Scope Activation Is Project-Scoped
**Given** a project wants Evolution Lab comparison mode  
**When** dual-run is enabled  
**Then** the choice is stored in project-scoped configuration or project memory rather than user preference memory  
**And** the scope lists which asset classes are evaluated in dual-run mode.

### AC2: Dual-Run Is The Default Inside Approved Scope
**Given** an asset falls inside approved Evolution Lab scope  
**When** candidate generation begins  
**Then** I-Wish-native and Darwinian paths are both scheduled by default  
**And** native-only fallback is treated as degraded mode rather than the normal path.

### AC3: Darwin Installation Gate Happens At Scope Enablement
**Given** a project enables dual-run scope  
**When** Darwinian is not installed or not available  
**Then** I-Wish asks for installation/approval at scope enablement time rather than waiting for an individual candidate  
**And** it records whether the project is `dual_run_ready`, `degraded_native_only`, or `blocked_pending_install`.

### AC4: Eligibility And Safety Gates Are Explicit
**Given** a project has dual-run enabled  
**When** a candidate or asset is evaluated  
**Then** the policy still blocks Darwinian execution for disallowed cases such as forbidden sensitivity, unsupported asset classes, or unresolved legal/runtime boundary failures  
**And** the skip reason is recorded instead of silently routing to native-only.

### AC5: Execution Mode And Source Records Are Machine-Readable
**Given** a trial run produces candidates  
**When** the run is logged  
**Then** the structured output records `run_mode`, `adapter_status`, `candidate_source`, and whether the final recommendation is `native`, `darwin_external`, `merged`, or `archived`.

### AC6: Degraded Mode Is Reviewable
**Given** dual-run scope is enabled but Darwinian cannot run  
**When** I-Wish continues in degraded mode  
**Then** the review output clearly says the run is not a full judge between two engines  
**And** the degraded state must not be mistaken for evidence that core-native won fairly.

## 4. Tasks

- Define project-scoped dual-run activation states and storage location.
- Define Darwinian install/availability check at scope enablement time.
- Define degraded-mode statuses, skip reasons, and review wording.
- Define machine-readable execution/source fields for trial outputs.
- Link the activation policy to runtime-home and adapter-contract stories.

## 5. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story prevents native-first bias by moving activation decisions to project scope. |
| Data Integrity & State | 9 | Run mode, adapter status, and source choice become machine-readable instead of implicit. |
| Security & Validation | 9 | Sensitive or unsupported cases can block Darwinian cleanly without silent fallback. |
| Performance & Scalability | 8 | Project-scoped activation contains cost while keeping judge-mode fair within approved scope. |
| Error Handling & Recovery | 9 | Degraded-mode states make missing-adapter situations visible and reversible. |
| Code Quality & Maintainability | 9 | Adapter activation is separated cleanly from scoring, fixtures, and promotion. |
| UX Empathy | 9 | Users are asked to install Darwinian at the right moment instead of being surprised mid-trial. |

**Total Average:** 8.86 / 10 - PASS
