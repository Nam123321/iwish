---
story_id: "story-hsea-1.2-skill-authoring-curator-rules.mdc"
epic_id: "EPIC-HSEA"
title: "Govern Draft Skill Creation from Session Feedback"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-1.1b", "story-hsea-1.2-skill-authoring-curator-rules.md", "story-hsea-1.2-skill-authoring-curator-rules.mdb"]
phase: "forge"

---
# Story HSEA-1.2c: Govern Draft Skill Creation from Session Feedback

## 1. Objective

Define and wire the governed I-Wish process for creating draft skills from session feedback, memorygraph clusters, bug fixes, code review findings, learning logs, curator recommendations, and user corrections.

## 1.1 Context

Hermes can operationally create or patch skills from experience. I-Wish should absorb the useful behavior but not the risk: draft skills must start under `${IWISH_HOME}/generated-skills`, carry provenance and append-only lineage, and pass classification, scoring, validation, and human promotion gates before entering canonical `.agent/` paths.

This story covers the "self-create skill" tier: deciding when session or background evidence is strong enough to produce a draft skill candidate, and how that draft is shaped. It does not implement the later Evolution Lab candidate population, scoring runner, or automatic promotion path.

**Source artifacts:**
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1b-memory-admission-scoring.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2-skill-authoring-curator-rules.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2b-skill-provenance-lineage.md`
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/agents/whis.md`
- `${IWISH_HOME}/repo-dna/hermes-agent-dna.md`

**Target integration surface:**
- A new reusable governance fragment for draft skill creation thresholds and file contract.
- Narrow pointers from capability creation/enhancement workflows if they do not already route through the new fragment.
- This story record and sprint tracker.

**Dependency state:**
- `STORY-HSEA-1.1b` is done and defines memory admission scoring and routing.
- `story-hsea-1.2-skill-authoring-curator-rules.md` is done and defines authoring, curator lifecycle, and non-destructive recommendation rules.
- `story-hsea-1.2-skill-authoring-curator-rules.mdb` is done and defines generated capability provenance and lineage contracts.

## 2. User Story

As a I-Wish capability maintainer,  
I want session feedback to create draft skills only through governed routing,  
So that useful repeated learnings become reusable capabilities without bypassing I-Wish approval.

## 3. Acceptance Criteria

### AC1: Draft Skill Creation Triggers Are Explicit
**Given** a session produces repeated user corrections, bug patterns, review findings, learning-log entries, curator recommendations, or memorygraph clusters  
**When** the draft creation protocol evaluates them  
**Then** it defines thresholds for when to create a draft skill versus logging memory only, routing to `enhance-capability`, or skipping the candidate.

### AC2: Classification Funnel Runs Before Draft Creation
**Given** a learning may be a skill, workflow, agent, fragment, or compound capability  
**When** Whis or Grand-Priest routes it  
**Then** the existing classification flow determines the target type before draft files are created  
**And** non-skill candidates are routed away from `${IWISH_HOME}/generated-skills`.

### AC3: Drafts Stay in Runtime Generated Paths
**Given** a skill candidate is created  
**When** files are written  
**Then** they are stored under `${IWISH_HOME}/generated-skills/<name>/` with `SKILL.md`, `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`  
**And** no canonical `.agent/` file is changed by draft creation.

### AC4: Human Approval Is Required Before Promotion
**Given** a draft skill passes structural checks  
**When** promotion is considered  
**Then** the user must approve before copying into `.agent/skills`, updating templates, registering KG nodes, or changing canonical workflow references.

### AC5: Draft Skill Quality Gate Exists
**Given** a draft skill is generated  
**When** validation runs  
**Then** it checks trigger quality, scope boundary, frontmatter, anti-patterns, best practices, verification notes, provenance, lineage, promotion plan, and token/context budget.

### AC6: Background Review Is Recommendation-Only
**Given** background review detects a possible new skill  
**When** the review completes  
**Then** it may emit a draft proposal or candidate spec  
**And** it may not write canonical skills, self-promote, or register canonical graph nodes without explicit user approval.

### AC7: Existing Skills Are Patched Before Near-Duplicate Drafts Are Created
**Given** the candidate overlaps an existing skill or only adds a small rule to an existing capability  
**When** duplicate and related-asset checks run  
**Then** the protocol routes to `enhance-capability`, merge, split, or rewrite recommendation before allowing a new draft skill.

## 4. Draft Creation Threshold

Create a draft skill only when all are true:

- Memory admission/routing classifies the candidate as skill-shaped.
- Source confidence is not speculative.
- The pattern is recurring, high-risk, or explicitly requested by the user.
- Existing skills/workflows do not already cover the class, or a patch target is clearly identified and rejected for documented reasons.
- The candidate can be expressed as class-level behavior, not a one-off session note.
- The candidate can satisfy the provenance, lineage, and promotion-plan contract from `.agent/fragments/capability-provenance-lineage.md`.

Do not create a draft skill when:

- the learning belongs in `PROJECT.md`, `USER.md`, bug report, learning log, or `instincts.jsonl`;
- the candidate is actually a workflow, agent, fragment, or compound capability;
- source evidence is stale, private, security-sensitive, or too weak for draft creation;
- the draft would duplicate an existing skill without curator review;
- the candidate depends on raw transcripts, memorygraph dumps, or source artifacts being embedded in `SKILL.md`.

## 5. Tasks

### T1: Create Draft Skill Creation Governance Fragment
- Add `.agent/fragments/draft-skill-creation-governance.md`.
- Define trigger thresholds, skip cases, and draft-versus-memory routing.
- Tie thresholds to `HSEA-1.1b` memory admission scoring.

### T2: Define Classification and Duplicate-Risk Routing
- Require Classification Funnel routing before draft creation.
- Route workflow, agent, fragment, and compound candidates away from generated skills.
- Require duplicate/related-asset scan before new skill draft creation.
- Route overlapping candidates to `enhance-capability`, merge, split, or rewrite recommendation.

### T3: Define Runtime Draft File Contract
- Require `${IWISH_HOME}/generated-skills/<name>/SKILL.md`.
- Require `${IWISH_HOME}/generated-skills/<name>/metadata.yaml`.
- Require `${IWISH_HOME}/generated-skills/<name>/lineage.jsonl`.
- Require `${IWISH_HOME}/generated-skills/<name>/promotion-plan.md`.
- Keep draft creation from changing canonical `.agent/` files.

### T4: Define Validation and Promotion Gate
- Add quality checks for structure, provenance, trigger quality, token budget, lineage, promotion plan, and verification notes.
- Require explicit user approval before canonical promotion, template update, or KG registration.
- Make background review output recommendation-only.

### T5: Patch Capability Workflow Pointers
- Update `.agent/workflows/create-capability.md` only if it needs a pointer to the new draft skill governance fragment.
- Update `.agent/workflows/enhance-capability.md` only if it needs a pointer to draft-versus-patch routing.
- Keep workflow changes narrow; do not implement a scheduler, background worker, or evolution runner.

### T6: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm story and changed guidance use repo-relative paths, `{project-root}`, or `${IWISH_HOME}`.
- Update File List and Vegeta Agent Record after implementation.

## 6. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Draft creation triggers are explicit | T1 | Thresholds, skip cases, memory routing | ✅ |
| AC2 | Classification before draft creation | T2 | Type routing, non-skill diversion | ✅ |
| AC3 | Drafts stay in generated paths | T3 | SKILL.md, metadata, lineage, promotion plan | ✅ |
| AC4 | Human approval before promotion | T4 | Promotion approval, canonical mutation block | ✅ |
| AC5 | Draft skill quality gate exists | T4 | Structure, trigger, provenance, lineage, budget checks | ✅ |
| AC6 | Background review recommendation-only | T4 | Candidate spec only, no self-promotion | ✅ |
| AC7 | Patch existing skills before duplicates | T2, T5 | Related-asset scan, enhance/merge/split/rewrite routing | ✅ |

## 7. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 7 ACs, below >8 threshold | 0 |
| Data Model Spread | Markdown/file contract only; no DB models | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Memory admission, classification, capability creation, curator, promotion governance | 3 |
| Flow Complexity | Multi-step draft routing and background-review recommendation path | 2 |
| Test Burden | No E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - scope crosses several governance surfaces. Keep implementation fragment-first and pointer-only; defer schedulers, graph writes, and automated evolution to later stories.

## 8. Create-Story Readiness Notes

This story is ready for Vegeta as a governance/documentation story. It should produce a reusable contract and narrow workflow pointers, not a running background review engine or an autonomous skill mutation loop.

**Primary implementation target:** `.agent/fragments/draft-skill-creation-governance.md`.

**Secondary implementation targets:** `.agent/workflows/create-capability.md` and `.agent/workflows/enhance-capability.md` only if concise pointers are needed so Whis can find the draft creation rules.

**Out of scope for this story:**
- automatic background review scheduling;
- direct writes into `.agent/skills`;
- automatic template updates;
- automatic KG/MemoryGraph node creation;
- promotion without user approval;
- Evolution Lab candidate populations, mutators, holdouts, or scoring runners;
- importing Hermes runtime code.

**Project memory gate:** `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` are not present in this checkout. Use HSEA epic artifacts and the `.agent/fragments/` governance files as current project authority. If memory files are added later, load only HSEA-relevant sections and treat `PROJECT.md` as primary.

**Workflow availability note:** `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml` are present. The create-story wrapper references `.agent/skills/qa-simulator-guardian.md`, but the canonical installed skill path is `.agent/skills/qa-simulator-guardian/SKILL.md`; use that file for the Fat-Guardian scorecard.

## 9. Dev Notes

- HSEA-1.1b already says capability-shaped candidates must route to generated capability paths instead of loose memory. This story should make the skill-specific version concrete.
- HSEA-1.2 already defines curator dispositions and a recommendation contract. Reuse those dispositions instead of inventing a second lifecycle enum.
- HSEA-1.2b already defines the minimum `metadata.yaml`, `lineage.jsonl`, and generated draft layout. This story should reference and enforce that contract for generated skills.
- `create-capability.md` already requires generated drafts under `${IWISH_HOME}` with provenance and lineage. The implementation may only need to add the new fragment to the list of loaded governance files.
- `enhance-capability.md` already handles patch/merge/split/archive/rewrite recommendations. The implementation should clarify that near-duplicate skill candidates prefer this route before new draft creation.
- Background review remains advisory until HSEA-1.3. This story may define the draft proposal shape that HSEA-1.3 consumes, but it should not implement the background loop.
- Treat source sensitivity carefully. Private or security-sensitive evidence may justify a reviewer-visible candidate, but raw evidence must not be embedded in `SKILL.md`.

## 10. Definition of Done

- [x] Draft skill creation governance fragment exists.
- [x] Trigger thresholds and skip cases are documented.
- [x] Classification-before-creation rule is explicit.
- [x] Duplicate-risk routing prefers patch/merge/split/rewrite before new drafts.
- [x] Runtime generated skill file contract is documented.
- [x] Quality gate and promotion gate are documented.
- [x] Background review cannot self-promote skills.
- [x] Workflow pointers are narrow and non-automating.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] Deterministic compiler check passes.

## 11. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story covers the missing governed self-create-skill tier and cleanly distinguishes memory, patch, draft, and promotion paths. |
| Data Integrity & State | 9 | Draft files remain separate from canonical assets and must carry provenance, lineage, and promotion plans. |
| Security & Validation | 9 | Human approval, generated-path isolation, and sensitivity rules prevent hidden skill injection or leaking raw evidence into loadable bodies. |
| Performance & Scalability | 9 | Thresholding, duplicate checks, and context-budget rules prevent one-off skill sprawl and token bloat. |
| Error Handling & Recovery | 9 | Skip cases and curator routing give weak, stale, private, or duplicate candidates a safe non-promotional path. |
| Code Quality & Maintainability | 9 | The story reuses existing HSEA fragments and capability workflows instead of creating a parallel governance system. |
| UX Empathy | 9 | User corrections can improve I-Wish over time without surprising the user with silent canonical behavior changes. |

**Total Average:** 9.00 / 10 - PASS

## 12. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2c-governed-draft-skill-creation.md`
- `.agent/fragments/draft-skill-creation-governance.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/workflows/step-w-04-validate.md`
- `templates/core/workflows/iwish-bmm-create-capability.md`
- `templates/core/workflows/iwish-bmm-enhance-capability.md`
- `templates/core/workflows/step-w-04-validate.md`

## 13. Vegeta Agent Record

### Planned

- Create `.agent/fragments/draft-skill-creation-governance.md`.
- Add narrow workflow pointers if needed.
- Keep implementation governance-only and non-automating.
- Run KG and portability validation.

### Implementation Status

- Added `.agent/fragments/draft-skill-creation-governance.md` as the canonical governance fragment for skill-shaped session feedback, user corrections, bug/review findings, curator recommendations, and memorygraph/KG clusters.
- Documented draft creation gates for memory admission, Classification Funnel routing, evidence quality, existing coverage, reusability, and provenance readiness.
- Documented fallback routing to project/user memory, instincts, learning logs, workflow/agent/fragment/compound capability paths, or `enhance-capability`.
- Defined duplicate-risk rules that prefer patch, merge, split, or rewrite before creating near-duplicate generated skills.
- Defined the generated draft skill file contract under `${IWISH_HOME}/generated-skills/<name>/` with `SKILL.md`, `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`.
- Defined the draft quality gate covering trigger quality, scope boundary, frontmatter, anti-patterns, best practices, verification, provenance, lineage, promotion plan, and context budget.
- Reaffirmed that background review may emit recommendations or candidate specs but may not self-promote, update templates, write canonical `.agent/skills`, or register canonical graph nodes.
- Patched `.agent/workflows/create-capability.md` to load the new governance fragment during pre-triage and require skill-shaped sources to pass draft creation gates before writing `${IWISH_HOME}/generated-skills`.
- Patched `.agent/workflows/enhance-capability.md` to load the new governance fragment and prefer patch/merge/split/rewrite for overlapping skill-shaped findings.
- Code-review fix pass: patched `.agent/workflows/step-w-04-validate.md` so draft Skill validation explicitly applies `.agent/fragments/draft-skill-creation-governance.md` and checks trigger quality, scope boundary, context budget, promotion plan, provenance, lineage, and duplicate-risk routing.
- Code-review fix pass: synced `templates/core/workflows/iwish-bmm-create-capability.md` with runtime create-capability governance, including the nested `origin.created_by` metadata contract, provenance/lineage requirements, duplicate scan, and draft-skill gates.
- Code-review fix pass: synced `templates/core/workflows/iwish-bmm-enhance-capability.md` with runtime enhance-capability draft-versus-patch routing and append-only lineage guidance.
- Code-review fix pass: synced `templates/core/workflows/step-w-04-validate.md` with runtime validation, including `lineage.jsonl`, generated-path smoke checks, and `candidate_promoted` lineage event requirements.

### Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` passed.
- `./.agent/scripts/validate-kg.sh` passed after fragment creation.
- `./.agent/scripts/validate-portability.sh` passed after fragment creation.
- `./.agent/scripts/validate-kg.sh` passed after workflow pointer patches.
- `./.agent/scripts/validate-portability.sh` passed after workflow pointer patches.
- `npm run build` passed.
- Code-review fix pass: `./.agent/scripts/validate-kg.sh`, `./.agent/scripts/validate-portability.sh`, and `npm run build` passed after validation/template parity fixes.

### Notes

- CodebaseGraph and FeatureGraph query tools were not callable in this session, so blast-radius review used local `rg` searches and direct file inspection.
- No UI implementation was involved; Stitch and visual gates were not applicable.
