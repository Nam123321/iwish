---
story_id: "STORY-HSEA-1.2"
epic_id: "EPIC-HSEA"
title: "Add Hermes-Inspired Skill Authoring and Curator Rules"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-HSEA-1.1b"]
phase: "forge"

---
# Story HSEA-1.2: Add Hermes-Inspired Skill Authoring and Curator Rules

## 1. Objective

Add I-Wish-native skill/workflow authoring and curator lifecycle rules inspired by Hermes `SKILL.md` and curator behavior, while preserving I-Wish's existing classification funnel, memory admission protocol, and human promotion gates.

## 1.1 Context

Hermes treats `SKILL.md` files as procedural memory. It also has a curator that tracks usage, marks long-unused agent-created skills as stale, archives recoverably, supports pinning, creates backups, and produces review reports. Hermes' curator exists to stop self-created skills from accumulating as narrow duplicates that waste tokens and confuse selection.

I-Wish should absorb the discipline, not the full runtime. The immediate I-Wish value is a documented authoring and curation standard for skills, workflows, agents, and future generated capability drafts. This story should create reusable governance rules that later stories can use for provenance, draft skill creation, background review, and the evolution lab.

**Source artifacts:**
- `${IWISH_HOME}/repo-dna/hermes-agent-dna.md`
- `${IWISH_HOME}/gap-analysis/hermes-agent-gap-analysis.md`
- `${IWISH_HOME}/sandbox/hermes-agent/website/docs/user-guide/features/curator.md`
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`

**Target integration surface:**
- A new reusable authoring/curator governance fragment under `.agent/fragments/`
- Existing create/enhance capability workflows only if a narrow pointer is needed
- This story record and sprint tracker

**Dependency state:**
- `STORY-HSEA-1.1` is done.
- `STORY-HSEA-1.1b` is done and created the canonical memory admission protocol.

## 2. User Story

As a I-Wish capability maintainer,  
I want skill and workflow authoring rules with curator-style lifecycle guidance,  
So that generated and maintained capabilities improve without creating prompt sprawl, stale duplicates, or unsafe automatic mutations.

## 3. Acceptance Criteria

### AC1: Authoring Rules Cover Required Capability Metadata
**Given** a I-Wish skill, workflow, agent, or generated capability draft is created or updated  
**When** authoring rules are applied  
**Then** the rules define required metadata, trigger clarity, scope boundary, dependencies, related assets, token/context budget, and verification notes.

### AC2: Trigger Quality and Scope Boundaries Are Enforced
**Given** a capability has a vague trigger or overlaps with existing assets  
**When** the authoring checklist is applied  
**Then** the capability must be narrowed, renamed, merged, or routed through enhance-capability rather than becoming another loose near-duplicate.

### AC3: Curator Lifecycle States Are Defined
**Given** a capability becomes stale, duplicated, too broad, rarely used, or repeatedly patched  
**When** curator guidance is applied  
**Then** maintainers can classify it as `keep`, `pin`, `patch`, `merge`, `split`, `archive`, or `rewrite`  
**And** each lifecycle state has a clear meaning and allowed next action.

### AC4: Curation Is Recommendation-First and Non-Destructive
**Given** curator review identifies weak or stale assets  
**When** recommendations are made  
**Then** no canonical `.agent/` asset is deleted, archived, merged, or overwritten automatically  
**And** human approval is required before promotion, merge, archive, or rewrite.

### AC5: Rules Respect Memory Admission and Classification Routing
**Given** a session learning looks like a new skill, workflow, agent, or compound capability  
**When** authoring/curator rules are evaluated  
**Then** the candidate must route through the Classification Funnel plus create/enhance capability flow  
**And** it must not be saved as loose memory solely because it received a high memory admission score.

### AC6: Rules Support Future Evolution Lab Constraints
**Given** the evolution lab later proposes candidate variants  
**When** candidates are evaluated  
**Then** authoring and curator rules can serve as structural constraints for fitness, novelty, regression, provenance, and promotion decisions.

## 4. Tasks

### T1: Create Authoring and Curator Governance Fragment
- Add `.agent/fragments/capability-authoring-curator-rules.md`.
- Define authoring checklist for skills, workflows, agents, and generated capability drafts.
- Include metadata, trigger quality, scope boundary, dependencies, related assets, context budget, verification, and source/provenance expectations.

### T2: Define Curator Lifecycle and Safe Actions
- Document lifecycle dispositions: `keep`, `pin`, `patch`, `merge`, `split`, `archive`, and `rewrite`.
- Distinguish deterministic review signals from recommendation-only LLM review.
- Require recoverability notes for any archive/merge/rewrite recommendation.
- Explicitly forbid automatic deletion or canonical overwrite.

### T3: Connect to Memory Admission and Capability Routing
- Reference `.agent/fragments/memory-admission-protocol.md`.
- State that capability-shaped learnings route to create/enhance capability, not loose memory.
- Add guidance for draft assets under `${IWISH_HOME}/generated-*` and human promotion gates.

### T4: Add Evolution-Lab Constraint Interface
- Define how the rules become constraints for future candidate evolution.
- Include checks for structural validity, trigger precision, duplicate risk, token bloat, regression risk, and reviewer actionability.
- Keep Darwinian/Hermes behavior as pattern reference only, not source import.

### T5: Add Narrow Workflow Pointers If Needed
- If `create-capability.md` or `enhance-capability.md` lacks any authoring/curator pointer, add a concise reference to the new fragment.
- Keep workflow changes narrow; do not implement background curator automation in this story.

### T6: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm the story and changed guidance use repo-relative paths, `{project-root}`, or `${IWISH_HOME}`.
- Update File List and Vegeta Agent Record after implementation.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Required capability metadata covered | T1 | Metadata, trigger, scope, dependencies, budget, verification | ✅ |
| AC2 | Trigger quality and scope boundaries enforced | T1, T2 | Duplicate checks, narrow/merge/rewrite routing | ✅ |
| AC3 | Curator lifecycle states defined | T2 | Keep, pin, patch, merge, split, archive, rewrite | ✅ |
| AC4 | Curation recommendation-first and non-destructive | T2, T5 | No auto-delete, no canonical overwrite, approval gate | ✅ |
| AC5 | Memory admission and classification routing respected | T3 | Non-bypass rule, generated draft routing, human promotion | ✅ |
| AC6 | Evolution lab constraints supported | T4 | Structural validity, novelty/fitness constraints, regression guard | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | Markdown governance only; no DB models | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Capability authoring + curation + memory routing + evolution constraints | 3 |
| Flow Complexity | Lifecycle dispositions and future candidate routing, but no runtime automation | 2 |
| Test Burden | Script validation only | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - scope crosses several I-Wish governance surfaces. Keep implementation fragment-first and pointer-only; defer background curator automation, provenance mechanics, and evolution runner behavior to later stories.

## 7. Create-Story Readiness Notes

This story is ready for Vegeta as a governance/documentation story. It should not implement a running background curator, automatic telemetry, file archival, model fork, or auto-promotion loop.

**Primary implementation target:** `.agent/fragments/capability-authoring-curator-rules.md`.

**Secondary implementation targets:** `create-capability.md` and `enhance-capability.md` only if a concise pointer is needed so future capability authors can find the rules.

**Out of scope for this story:**
- automatic usage telemetry;
- background review scheduler;
- automatic stale-to-archive file movement;
- deletion or overwrite of canonical `.agent/` assets;
- provenance graph implementation for generated skills;
- evolution lab runner or scoring implementation.

**Project memory gate:** `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` are not present in this checkout. Use HSEA epic artifacts and `.agent/fragments/memory-admission-protocol.md` as current project authority. If memory files are added later, load only HSEA-relevant sections and treat `PROJECT.md` as primary.

**Workflow availability note:** `.agent/workflows/iwish-bmm-create-story.md` references `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml`, but those files are not present in this checkout. This story was generated from the available workflow wrapper plus existing I-Wish story conventions, Plan Tune heuristic, QA Guardian skill, HSEA epic artifacts, and Hermes curator source docs.

## 8. Dev Notes

- Hermes curator is useful because it prevents self-created skills from becoming an unmanaged skill pile. I-Wish should preserve that intent but avoid adopting Hermes' full runtime.
- In I-Wish, the first curator behavior should be recommendation-first. Any destructive or canonical mutation must be gated by human approval and recoverability.
- Treat `pin` as a strong maintainer signal. A pinned capability may still receive suggested patches, but should not be recommended for merge/archive unless the user explicitly asks for reevaluation.
- Agent-created/generated assets should be separated from bundled or canonical assets. Canonical `.agent/` assets require explicit promotion.
- Curation should look for prompt sprawl: overlapping triggers, overly broad skills, stale references, token-heavy bodies, missing verification, and duplicated methodology.
- This story should reinforce HSEA-1.1b: capability-shaped learnings route through classification and create/enhance capability, not loose memory.
- Future HSEA-1.2b should add concrete provenance/lineage fields. Do not fully implement those fields here beyond noting source/provenance expectations.
- Future HSEA-1.2c should govern draft skill creation from session feedback. Do not enable automatic draft creation in this story.
- Future Epic 2 stories should consume this fragment as structural constraints for evolution lab candidate scoring.

## 9. Definition of Done

- [x] Authoring and curator rules fragment exists.
- [x] Required metadata, trigger, scope, dependency, context-budget, and verification rules are documented.
- [x] Curator lifecycle states and safe recommendations are documented.
- [x] Automatic deletion/canonical overwrite is explicitly forbidden.
- [x] Memory admission and Classification Funnel non-bypass behavior is referenced.
- [x] Evolution-lab constraint interface is documented.
- [x] Any workflow pointers are narrow and non-automating.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.

## 10. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story translates Hermes skill/curator behavior into concrete I-Wish governance without importing runtime automation. |
| Data Integrity & State | 9 | Recommendation-first lifecycle states prevent uncontrolled deletion, merge, archive, or canonical overwrite. |
| Security & Validation | 9 | No external code, scheduler, or destructive automation is introduced; human promotion remains required. |
| Performance & Scalability | 9 | Trigger quality, duplicate checks, and context-budget rules directly target prompt sprawl and token bloat. |
| Error Handling & Recovery | 9 | Pinning, recoverability notes, and non-destructive recommendations give maintainers rollback paths. |
| Code Quality & Maintainability | 9 | A reusable fragment keeps rules centralized and allows later stories to reference the same standard. |
| UX Empathy | 9 | Maintainers get actionable curation guidance without losing control over project-specific capabilities. |

**Total Average:** 9.00 / 10 - PASS

## 11. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2-skill-authoring-curator-rules.md`
- `_iwish-output/stories/sprint-status.yaml`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`

## 12. Vegeta Agent Record

### Planned

- Create the capability authoring and curator rules fragment.
- Add narrow pointers from capability creation/enhancement workflows if needed.
- Keep implementation governance-only and non-automating.
- Run KG and portability validation.

### Implementation Status

- Added `.agent/fragments/capability-authoring-curator-rules.md` as the canonical I-Wish authoring and curator governance fragment for skills, workflows, agents, and generated capability drafts.
- Documented required capability metadata, trigger quality, scope boundaries, dependencies, related assets, context budget, verification, and source/provenance expectations.
- Defined curator lifecycle dispositions: `keep`, `pin`, `patch`, `merge`, `split`, `archive`, and `rewrite`.
- Added deterministic review signals and LLM-review boundaries so curator output remains recommendation-first.
- Added a machine-readable Curator Recommendation Contract with exact lifecycle enum values, required fields, confidence handling, approval gating, and recoverability requirements.
- Added explicit safety/recoverability rules forbidding automatic deletion, archive, merge, rewrite, promotion, or canonical `.agent/` overwrite.
- Connected authoring/curator rules to `.agent/fragments/memory-admission-protocol.md`, the Classification Funnel, generated `${IWISH_HOME}/generated-*` drafts, and human promotion gates.
- Added an evolution-lab constraint interface covering structural validity, trigger precision, duplicate risk, token budget, regression risk, reviewer actionability, and provenance readiness.
- Tightened generated draft standards from SHOULD to MUST so generated capability body, `metadata.yaml`, provenance notes, validation/review checklist, promotion plan, and rollback/recovery note remain required.
- Patched `.agent/workflows/create-capability.md` with a narrow pointer to load and apply the new fragment before Step 0, during Step 1 triage, and before drafting or validating capability content.
- Added duplicate/related-asset scan guidance to `create-capability.md` so overlapping sources route to enhancement, merge, split, or rewrite instead of creating near-duplicate drafts.
- Patched `.agent/workflows/enhance-capability.md` with a narrow pointer to apply the curator lifecycle and non-destructive approval rules before recommending changes.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.
- Ran `npm run build` -> pass.
- Code-review fix pass: addressed curator contract drift, generated draft MUST wording, and pre-triage duplicate routing.
- FeatureGraph note: I-Wish FeatureGraph is FalkorDB-backed. HSEA-1.2 is a markdown governance story and introduced no DataEntity/Event/SeedData changes, so no FeatureGraph backward update was required.

### Decisions

- Marked this story ready for Vegeta because it has no frontend UI surface and does not require Discovery Track UI spec generation.
- Kept the story documentation-first because Plan Tune score is WARN-level due to cross-governance coordination.
- Deferred telemetry, scheduler, archive movement, provenance graph implementation, and evolution runner behavior to later HSEA stories.
- Implemented only fragment-first governance plus two workflow pointers; no runtime curator automation was introduced.
- Kept FeatureGraph/FalkorDB data-spec validation out of this story because no data model, event, or seed-data contract was changed.
