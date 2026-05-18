---
story_id: "STORY-HSEA-4.2"
epic_id: "EPIC-HSEA"
title: "Define Profile-Aware Runtime Home Policy"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["story-hsea-1.1-project-memory-model.md", "STORY-HSEA-1.2c"]
phase: "forge"

---
# Story HSEA-4.2: Define Profile-Aware Runtime Home Policy

## 1. Objective

Define a profile-aware runtime home policy so generated drafts, absorbed repos, repo DNA, gap analysis, graph-profile mirrors, evolution outputs, and other HSEA runtime artifacts stay isolated by profile and project without weakening I-Wish's canonical promotion boundary.

## 1.1 Context

Hermes reinforces profile-aware runtime separation. I-Wish already uses `${IWISH_HOME}` for RAP and generated assets, but HSEA adds more runtime state:

- generated skills, workflows, and agents
- provenance and lineage artifacts
- trial fixtures and scorecards
- graph-profile runtime mirrors
- runtime memory exports and graph snapshots
- sandboxed absorbed repos and external references

At the same time, I-Wish already has repo-local/canonical surfaces that must not be confused with runtime state:

- `.agent/`
- `templates/`
- `_iwish/` runtime materialization
- `.agent/memory/PROJECT.md`
- `.agent/memory/USER.md`
- `.agent/memory/learning-log.jsonl`
- `.agent/memory/instincts.jsonl`

If HSEA runtime outputs are not isolated by project and profile, drafts, graph settings, evolution outputs, and runtime evidence can bleed across unrelated projects. If the policy overreaches, it can also destabilize the existing distinction between canonical repo assets and runtime-only artifacts.

This story should define the policy boundary and path model before any additional runtime automation relies on it.

**Source artifacts:**
- `docs/iwish-public-runtime-policy.md`
- `docs/iwish-workflow-runtime-materialization.md`
- `docs/iwish-graph-backend-selection.md`
- `.agent/fragments/graph-backend-selection-policy.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/fragments/background-review-learning-log-governance.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1-project-memory-model.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2b-skill-provenance-lineage.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.3-background-review-learning-log.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.4-materialize-iwish-workflow-runtime.md` (context only)
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.5-graph-backend-selection-adapter-contract.md` (context only)

**Target integration surface:**
- `docs/iwish-profile-aware-runtime-home.md`
- `.agent/fragments/profile-aware-runtime-home-policy.md`
- directly related runtime-home references in public runtime, memory, and graph-profile policy docs only

## 2. User Story

As a I-Wish maintainer,  
I want HSEA runtime outputs isolated by project/profile,  
So that drafts, graph profile state, and evolution artifacts do not bleed across unrelated projects.

## 3. Acceptance Criteria

### AC1: Runtime Roots Are Defined
**Given** HSEA creates runtime artifacts  
**When** path policy is documented  
**Then** it defines profile-aware roots under `${IWISH_HOME}` for:
- absorbed repos
- generated skills
- generated workflows
- generated agents
- repo DNA
- gap analysis
- evolution candidates and trial outputs
- runtime config mirrors
- graph/runtime exports

### AC2: Project/Profile Isolation Is Explicit
**Given** multiple projects or profiles use I-Wish  
**When** runtime paths are selected  
**Then** the policy uses explicit `profile-id` and `project-slug` boundaries  
**And** unrelated runtime artifacts cannot silently mix across projects.

### AC3: Canonical vs Runtime Boundary Is Explicit
**Given** I-Wish already has canonical repo-local memory and runtime surfaces  
**When** the profile-aware home policy is defined  
**Then** it distinguishes repo-local canonical artifacts from `${IWISH_HOME}` runtime artifacts  
**And** it does not relocate canonical `.agent/`, `templates/`, `_iwish/`, or approved repo memory files into `${IWISH_HOME}`.

### AC4: Promotion and Persistence Rules Are Clear
**Given** a draft is promoted or a project-level runtime choice needs persistence  
**When** the policy is documented  
**Then** it explains which artifacts stay runtime-only, which may be mirrored, and which must be promoted into canonical repo paths through approval  
**And** it gives a stable location for runtime mirrors such as graph-profile or evolution-run metadata.

### AC5: Portability Rules Are Preserved
**Given** artifacts reference runtime files  
**When** docs, stories, or policies are committed  
**Then** they use `${IWISH_HOME}`, repo-relative paths, or `{project-root}` instead of user-specific absolute paths.

### AC6: Story Scope Stays Documentation-First
**Given** this story defines runtime-home policy  
**When** Vegeta implements it  
**Then** only runtime-home documentation and directly related policy references are changed  
**And** the story does not add hidden runtime writers, migrate user data, or refactor unrelated workflows.

## 4. Tasks

### T1: Define Profile-Aware Runtime Roots
- Document the root shape under `${IWISH_HOME}`.
- Define `profile-id` and `project-slug` usage.
- Define which subtrees are shared, project-scoped, or runtime-only.

### T2: Define Canonical vs Runtime Boundary
- State which assets remain repo-local and canonical.
- Clarify that `_iwish/` runtime materialization is project-local, not a `${IWISH_HOME}` substitute.
- Clarify repo memory vs runtime mirrors/exports.

### T3: Define Persistence and Promotion Rules
- Explain runtime-only drafts vs canonical promotions.
- Define stable paths for runtime config mirrors and graph/evolution exports.
- Reconcile with existing graph-profile and provenance policies.

### T4: Patch Directly Related Policy References
- Update the public runtime policy to reflect profile-aware runtime home.
- Update graph-profile policy/docs to use the new runtime mirror convention.
- Update memory schema if needed to clarify repo-local memory vs runtime exports.

### T5: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm only the intended runtime-home policy surfaces and story record changed.
- Update File List and Agent Record.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Runtime roots are defined | T1 | Root shape, profile/project isolation, subtrees | ✅ |
| AC2 | Project/profile isolation is explicit | T1 | `profile-id`, `project-slug`, anti-mixing rule | ✅ |
| AC3 | Canonical vs runtime boundary is explicit | T2 | Repo-local vs runtime-only distinction | ✅ |
| AC4 | Promotion and persistence rules are clear | T3 | Runtime mirrors, promotion boundary, persistence | ✅ |
| AC5 | Portability rules are preserved | T4, T5 | `${IWISH_HOME}` references and validation | ✅ |
| AC6 | Story scope stays documentation-first | T5 | Narrow diff check, no hidden runtime automation | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 new UI components; docs + policy references only | 0 |
| Cross-Domain | Runtime policy, graph persistence, memory boundary, portability | 3 |
| Flow Complexity | Path model and promotion boundary only; no runner behavior | 1 |
| Test Burden | Script validation only | 0 |

**Complexity Score:** 4  
**Verdict:** OK — keep this story policy-first and avoid runtime automation changes.

## 7. Implementation Notes

- This story defines policy; it does not add hidden runtime writes.
- Repo-local project memory remains primary for approved project constraints.
- `${IWISH_HOME}` is for runtime-only or mirror/export state that should not bleed across projects.
- `_iwish/` remains the project-local materialized runtime for workflow execution; it is not replaced by `${IWISH_HOME}`.
- Use HSEA-4.4 and HSEA-4.5 as dependency context, not as targets for broad refactor.

## 8. Definition of Done

- [x] Profile-aware runtime roots are documented.
- [x] Project/profile isolation is explicit.
- [x] Canonical vs runtime boundary is explicit.
- [x] Persistence and promotion rules are clear.
- [x] Portability-safe path conventions are preserved.
- [x] No unrelated runtime automation is introduced.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The policy closes the missing runtime-home gap that later HSEA runtime and graph stories already depend on. |
| Data Integrity & State | 9 | Explicit profile/project scoping reduces cross-project contamination for runtime-only artifacts. |
| Security & Validation | 9 | Canonical-vs-runtime boundary reduces accidental promotion and keeps portability checks effective. |
| Performance & Scalability | 9 | Organized runtime roots and mirrors scale across multiple I-Wish projects and profiles. |
| Error Handling & Recovery | 9 | Stable mirror/export paths make restoration and diagnosis easier without mixing canonical state. |
| Code Quality & Maintainability | 9 | A centralized runtime-home policy prevents future stories from hardcoding paths ad hoc. |
| UX Empathy | 9 | Operators can predict where drafts, reports, and runtime-side metadata live without hunting through unrelated projects. |

**Total Average:** 9.00 / 10 - PASS

## 10. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.2-profile-aware-runtime-home.md`
- `docs/iwish-profile-aware-runtime-home.md`
- `docs/iwish-public-runtime-policy.md`
- `docs/iwish-graph-backend-selection.md`
- `.agent/fragments/profile-aware-runtime-home-policy.md`
- `.agent/fragments/graph-backend-selection-policy.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `_iwish-output/stories/sprint-status.yaml`

## 11. Agent Record

### Planned

- Define profile-aware runtime roots and isolation rules.
- Clarify canonical vs runtime boundaries.
- Define runtime mirrors/persistence policy for graph and evolution metadata.
- Patch directly related policy references.
- Validate KG and portability.

### Implementation Status

- Expanded the story from skeleton to full I-Wish story format.
- Created `docs/iwish-profile-aware-runtime-home.md` as the source runtime-home policy artifact.
- Added `.agent/fragments/profile-aware-runtime-home-policy.md` as the reusable short-form contract.
- Updated public runtime, graph profile, and memory schema docs to use the same profile-aware runtime-home vocabulary.
- Preserved repo-local memory and `_iwish/` materialization as canonical/project-local surfaces rather than moving them under `${IWISH_HOME}`.
- Updated sprint state to completed.

### Tests / Validation Run

- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.

### Decisions

- Treated profile-aware runtime home as a policy hardening story, not a runtime migration story.
- Kept `${IWISH_HOME}` for runtime-only and mirror/export state.
- Kept `.agent/memory/*` and `_iwish/` as project-local canonical/runtime surfaces inside the repo/worktree.
- Avoided patching runtime scripts or workflow execution logic in this story.
