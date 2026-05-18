---
story_id: "story-hsea-1.2-skill-authoring-curator-rules.mdb"
epic_id: "EPIC-HSEA"
title: "Add Skill Provenance and Draft Creation Lineage"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-1.1b", "story-hsea-1.2-skill-authoring-curator-rules.md"]
phase: "forge"

---
# Story HSEA-1.2b: Add Skill Provenance and Draft Creation Lineage

## 1. Objective

Define and wire a I-Wish provenance and lineage contract for generated skills, workflows, agents, and compound capability drafts created from memorygraph/KG evidence, instincts, learning logs, bug fixes, review findings, and evolution trials.

## 1.1 Context

Hermes has two self-improvement layers:

1. operational self-improvement through memory, skill creation, skill patching, background review, and curator behavior;
2. evolutionary self-improvement through offline candidate generation, scoring, constraints, and review.

I-Wish is adapting both patterns with stronger project governance. HSEA-1.1b defined memory admission and routing. HSEA-1.2 added authoring and curator rules plus a machine-readable curator recommendation contract. This story adds the missing bridge: generated capabilities must keep structured provenance and append-only lineage so continuous learning and Darwinian-style evolution can use source evidence without polluting the runtime skill body.

The key trade-off: provenance must be machine-readable and useful for future evolution, but `SKILL.md` and workflow bodies must stay lean. Raw memorygraph dumps, transcripts, bug reports, and source artifacts belong behind references, not embedded in capabilities.

**Source artifacts:**
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/workflows/step-w-02-spec.md`
- `.agent/workflows/step-w-04-validate.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1b-memory-admission-scoring.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2-skill-authoring-curator-rules.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/self-evolution-analysis.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/darwinian-evolver-research.md`

**Target integration surface:**
- A new reusable provenance/lineage governance fragment under `.agent/fragments/`
- Narrow pointers in capability creation/evolution/spec/validation workflows
- This story record and sprint tracker

**Dependency state:**
- `STORY-HSEA-1.1b` is done and defines memory admission routing.
- `story-hsea-1.2-skill-authoring-curator-rules.md` is done and defines capability authoring/curator rules.

## 2. User Story

As a I-Wish capability maintainer,  
I want every memorygraph-derived capability to retain structured provenance and append-only lineage,  
So that continuous learning and evolution can reuse source evidence without bloating capability bodies or bypassing human promotion gates.

## 3. Acceptance Criteria

### AC1: Provenance Metadata Contract Is Required
**Given** a generated skill, workflow, agent, fragment, or compound capability is created or updated from memorygraph/KG, instinct, learning-log, bug, review, user correction, curator recommendation, or evolution-lab evidence  
**When** the draft is produced  
**Then** `metadata.yaml` includes structured provenance fields for source IDs, source types, source refs, confidence, sensitivity, creation workflow, source story, promotion target, and promotion state.

### AC2: Capability Body Stays Lean
**Given** provenance exists in metadata or lineage  
**When** an agent loads `SKILL.md`, workflow markdown, or agent persona content  
**Then** the body contains operational rules and concise context only  
**And** raw memorygraph dumps, full transcripts, bug reports, review logs, or absorbed source artifacts are not embedded.

### AC3: Lineage Event Contract Is Append-Only
**Given** a generated capability evolves over time  
**When** a candidate is created, evaluated, rejected, promoted, rolled back, merged, split, archived, rewritten, or superseded  
**Then** `lineage.jsonl` records an append-only event with parent ID, child ID, event type, source failures, score delta, holdout result, reviewer decision, timestamp, and reason.

### AC4: Provenance Supports Evolution Without Replacing Validation
**Given** the future evolution lab needs failure cases, holdouts, and prior mutation outcomes  
**When** it selects context for a capability  
**Then** it may use provenance and lineage references to retrieve relevant source failures, memory clusters, rejected mutations, and holdout candidates  
**And** it must still validate candidates independently instead of treating provenance count or source frequency as proof of correctness.

### AC5: Stale, Superseded, Low-Confidence, or Sensitive Sources Trigger Review
**Given** a capability references a source node/ref that becomes stale, superseded, low-confidence, privacy-sensitive, or security-sensitive  
**When** the capability is reviewed or evolved  
**Then** it is flagged for curator/evolution review using the HSEA-1.2 recommendation contract  
**And** it is not silently treated as authoritative.

### AC6: Existing I-Wish Draft and Promotion Flows Are Preserved
**Given** a learning suggests a new or updated capability  
**When** provenance and lineage are recorded  
**Then** the draft still starts under `${IWISH_HOME}/generated-*`, includes `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`, and waits for explicit approval before canonical `.agent/` promotion  
**And** provenance does not bypass memory admission, Classification Funnel, create-capability, enhance-capability, curator review, or promotion gates.

## 4. Proposed Contracts

### 4.1 Draft File Layout

Generated layout:

```text
${IWISH_HOME}/generated-skills/<name>/SKILL.md
${IWISH_HOME}/generated-skills/<name>/metadata.yaml
${IWISH_HOME}/generated-skills/<name>/lineage.jsonl
${IWISH_HOME}/generated-skills/<name>/promotion-plan.md

${IWISH_HOME}/generated-workflows/<name>/<name>.md
${IWISH_HOME}/generated-workflows/<name>/metadata.yaml
${IWISH_HOME}/generated-workflows/<name>/lineage.jsonl
${IWISH_HOME}/generated-workflows/<name>/promotion-plan.md

${IWISH_HOME}/generated-agents/<name>/<name>.md
${IWISH_HOME}/generated-agents/<name>/metadata.yaml
${IWISH_HOME}/generated-agents/<name>/lineage.jsonl
${IWISH_HOME}/generated-agents/<name>/promotion-plan.md
```

Canonical promoted assets may retain `metadata.yaml` and `lineage.jsonl` beside the asset only when the promotion plan explicitly approves it. Otherwise the canonical asset may point back to the runtime provenance store.

### 4.2 Minimum `metadata.yaml`

```yaml
id: "<capability-id>"
type: "SKILL|WORKFLOW|AGENT|FRAGMENT|COMPOUND"
status: "draft|promoted|archived|superseded|rejected"
origin:
  type: "memorygraph-derived|curator-recommendation|bug-fix|code-review|user-correction|evolution-lab|external-absorption|manual"
  created_by: "create-capability|enhance-capability|evolution-lab|manual"
  created_at: "YYYY-MM-DD"
  source_story: "story-hsea-1.2-skill-authoring-curator-rules.mdb"
provenance:
  source_nodes:
    - id: "<memorygraph-or-kg-node-id>"
      type: "Instinct|Learning|Bug|ReviewFinding|UserCorrection|CuratorRecommendation|EvolutionCase|ExternalSource"
      confidence: 1-10
      sensitivity: "public|project|private|security-sensitive"
      ref: "<repo-relative path, story id, bug id, graph id, or ${IWISH_HOME} artifact>"
      status: "active|stale|superseded|low-confidence|sensitive"
  source_clusters:
    - ctx: "<tag>"
      count: 1
      max_severity: 1-5
  source_artifacts:
    - "<repo-relative path or ${IWISH_HOME} artifact>"
evolution_lineage:
  parent_id: null
  generation: 1
  lineage_file: "lineage.jsonl"
path_policy: "runtime"
promotion_target: ".agent/<target-path>"
approval:
  required: true
  approved_by: null
  approved_at: null
```

### 4.3 Minimum `lineage.jsonl` Event Shape

```jsonl
{"ts":"YYYY-MM-DD","event":"candidate_created","capability_id":"capability@gen1","parent_id":"capability@gen0","child_id":"capability@gen1","source_failures":["BUG-001"],"source_refs":["story-hsea-1.2-skill-authoring-curator-rules.mdb"],"score_delta":null,"holdout_result":"not_run","reviewer":null,"decision":"draft","reason":"created from validated recurring failure"}
{"ts":"YYYY-MM-DD","event":"candidate_rejected","capability_id":"capability@gen1","parent_id":"capability@gen0","child_id":"capability@gen1","source_failures":["BUG-001"],"source_refs":["story-hsea-1.2-skill-authoring-curator-rules.mdb"],"score_delta":-3,"holdout_result":"failed","reviewer":"Hit","decision":"rejected","reason":"holdout regression"}
```

Allowed `event` values:

```text
candidate_created
candidate_evaluated
candidate_rejected
candidate_promoted
candidate_rolled_back
candidate_merged
candidate_split
candidate_archived
candidate_rewritten
candidate_superseded
source_marked_stale
source_marked_sensitive
```

Lineage rules:

- append new events only;
- do not rewrite or delete old lineage rows;
- use compact IDs and refs, not raw evidence dumps;
- include score/holdout fields even when the value is `not_run` or `null`;
- record rejected candidates because failed mutations are useful future evolution evidence.

## 5. Anti-Patterns

- Do not store full memorygraph snapshots in `SKILL.md` or workflow bodies.
- Do not treat provenance count as proof that a rule is correct.
- Do not auto-promote a capability only because many nodes point to the same cluster.
- Do not let Darwinian-style evolution read unfiltered graph context; select by relevance, confidence, severity, recency, and sensitivity.
- Do not hide project-sensitive evidence in globally distributed skill bodies.
- Do not let provenance bypass curator recommendation contract fields from HSEA-1.2.

## 6. Tasks

### T1: Create Provenance and Lineage Governance Fragment
- Add `.agent/fragments/capability-provenance-lineage.md`.
- Define generated and promoted file layouts.
- Define `metadata.yaml` provenance fields.
- Define source type, source status, sensitivity, confidence, approval, path policy, and promotion target rules.
- Define lean-body rule that blocks raw graph/session/source dumps in capability bodies.

### T2: Define Append-Only Lineage Contract
- Define `lineage.jsonl` event schema.
- Define allowed event enum values.
- Include candidate creation, evaluation, rejection, promotion, rollback, merge, split, archive, rewrite, supersession, stale source, and sensitive source events.
- Require rejected candidates and holdout failures to remain in lineage.

### T3: Patch Capability Creation and Evolution Guidance
- Update `.agent/workflows/create-capability.md` to require provenance and lineage files for generated drafts.
- Update `.agent/workflows/enhance-capability.md` to preserve and append lineage when evolving existing capabilities.
- Update `.agent/workflows/step-w-02-spec.md` metadata output so capability specs include provenance-ready fields.
- Update `.agent/workflows/step-w-04-validate.md` structural validation so generated drafts must include `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`.
- Keep all changes pointer/contract-level; do not implement an evolution runner.

### T4: Connect Provenance to Curator and Evolution Lab
- Reference `.agent/fragments/capability-authoring-curator-rules.md`.
- State that stale/superseded/low-confidence/sensitive source references produce curator/evolution review recommendations.
- Document how future evolution lab may retrieve failure cases and holdouts from provenance and lineage.
- State that independent validation, scorecards, holdouts, and human review own correctness.

### T5: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Run `npm run build`.
- Confirm no DataEntity/Event/SeedData contract was introduced; if one is introduced unexpectedly, update FeatureGraph/FalkorDB according to ADR-002 before closing.
- Update File List and Vegeta Agent Record after implementation.

## 7. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Provenance metadata required | T1, T3 | Metadata fields, source types, confidence, sensitivity, promotion state | ✅ |
| AC2 | Capability body stays lean | T1, T4 | Raw dump ban, compact refs, source artifact pointers | ✅ |
| AC3 | Lineage append-only | T2 | Event schema, event enum, parent/child IDs, score/holdout/reviewer fields | ✅ |
| AC4 | Provenance supports evolution without replacing validation | T4 | Failure/holdout retrieval, validation ownership rule | ✅ |
| AC5 | Stale/superseded/low-confidence/sensitive sources trigger review | T1, T4 | Source status, sensitivity, curator recommendation routing | ✅ |
| AC6 | Existing I-Wish flows preserved | T3, T5 | `${IWISH_HOME}/generated-*`, promotion plan, approval gates, validation | ✅ |

## 8. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | File contracts only; no DB models | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Memorygraph/KG, capability drafts, curator, evolution lab | 3 |
| Flow Complexity | Multi-step lineage lifecycle and review routing, but no runtime automation | 2 |
| Test Burden | Script/build validation only | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - this story coordinates several governance surfaces. Keep implementation contract-first and pointer-level; defer graph indexing, evolution runner behavior, and automated source-status checks to later stories.

## 9. Create-Story Readiness Notes

This story is ready for Vegeta as a governance/contract story. It has no frontend UI surface and does not require Discovery Track UI spec generation.

**Primary implementation target:** `.agent/fragments/capability-provenance-lineage.md`.

**Secondary implementation targets:**
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/workflows/step-w-02-spec.md`
- `.agent/workflows/step-w-04-validate.md`

**Out of scope for this story:**
- FeatureGraph/FalkorDB indexer implementation;
- automatic graph sync or graph status polling;
- evolution lab runner implementation;
- automatic candidate promotion;
- provenance UI/reporting;
- copying raw memorygraph dumps into capability bodies.

**Project memory gate:** `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` are not present in this checkout. Use HSEA epic artifacts, `.agent/fragments/memory-admission-protocol.md`, and `.agent/fragments/capability-authoring-curator-rules.md` as current project authority. If memory files are added later, load only HSEA-relevant sections and treat `PROJECT.md` as primary.

**Workflow availability note:** `.agent/workflows/iwish-bmm-create-story.md` references `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml`, but those files are not present in this checkout. This story was generated from the available workflow wrapper plus existing I-Wish story conventions, Plan Tune heuristic, QA Guardian skill, HSEA epic artifacts, and local governance fragments.

## 10. Dev Notes

- HSEA-1.2 already requires generated drafts to include source/provenance notes. This story turns that note into a stricter contract.
- HSEA-1.2's Curator Recommendation Contract should be reused when provenance sources become stale, superseded, low-confidence, or sensitive.
- I-Wish FeatureGraph is FalkorDB-backed. This story should not require FeatureGraph writes unless the implementer introduces DataEntity/Event/SeedData contracts, which is not expected.
- Provenance should point to graph nodes, story IDs, bug IDs, review finding IDs, and source artifact paths. It should not inline the source content.
- `lineage.jsonl` should preserve failed mutations and rejected candidates because they are useful negative examples for future evolution.
- Future HSEA-1.2c governs when draft skills may be created from session feedback. This story defines what those drafts must carry once created.
- Future Epic 2 stories may use provenance and lineage as inputs to failure-case sampling, holdout construction, parent selection, and regression analysis.

## 11. Definition of Done

- [x] Provenance/lineage governance fragment exists.
- [x] Required `metadata.yaml` provenance fields are documented.
- [x] Source type/status/sensitivity/confidence rules are documented.
- [x] Lean-body rule blocks raw graph/session/source dumps.
- [x] Append-only `lineage.jsonl` schema and event enum are documented.
- [x] Create/enhance/spec/validate workflow pointers are patched.
- [x] Curator/evolution review routing for stale/superseded/low-confidence/sensitive sources exists.
- [x] FeatureGraph/FalkorDB data-spec applicability is checked and documented.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] `npm run build` passes.

## 12. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story defines a precise provenance and lineage contract that bridges memory admission, curator rules, and future evolution. |
| Data Integrity & State | 9 | Append-only lineage and explicit source status/sensitivity prevent silent loss or corruption of decision history. |
| Security & Validation | 9 | Raw evidence stays out of capability bodies and sensitive sources route to review rather than distribution. |
| Performance & Scalability | 9 | Compact refs avoid context bloat while preserving retrieval paths for future evolution. |
| Error Handling & Recovery | 9 | Rollback, rejection, supersession, stale source, and sensitive source events preserve recovery evidence. |
| Code Quality & Maintainability | 9 | A centralized fragment plus narrow workflow pointers keeps the contract reusable without adding runtime automation. |
| UX Empathy | 9 | Maintainers can understand why a capability exists and still retain approval over promoted behavior. |

**Total Average:** 9.00 / 10 - PASS

## 13. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2b-skill-provenance-lineage.md`
- `_iwish-output/stories/sprint-status.yaml`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/workflows/step-w-02-spec.md`
- `.agent/workflows/step-w-04-validate.md`

## 14. Vegeta Agent Record

### Planned

- Create the capability provenance and lineage governance fragment.
- Patch create/enhance/spec/validate workflow guidance narrowly.
- Keep implementation contract-only and non-automating.
- Run KG, portability, and build validation.

### Implementation Status

- Added `.agent/fragments/capability-provenance-lineage.md` as the canonical provenance and append-only lineage contract for generated capabilities.
- Documented generated draft layouts for skills, workflows, and agents under `${IWISH_HOME}/generated-*`.
- Defined the required `metadata.yaml` provenance shape, including source nodes, source clusters, source artifacts, sensitivity, confidence, source status, approval, path policy, and promotion target.
- Defined `lineage.jsonl` event schema and allowed event values covering candidate creation, evaluation, rejection, promotion, rollback, merge, split, archive, rewrite, supersession, stale source, and sensitive source handling.
- Added lean-body rules that keep raw memorygraph dumps, transcripts, bug reports, review logs, and absorbed source artifacts out of loadable capability bodies.
- Added curator/evolution routing for stale, superseded, low-confidence, private, and security-sensitive source refs using the HSEA-1.2 curator contract.
- Patched `.agent/workflows/create-capability.md` to load the provenance/lineage fragment and require `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md` for drafts.
- Patched `.agent/workflows/enhance-capability.md` to preserve provenance and append lineage events when evolving capabilities.
- Patched `.agent/workflows/step-w-02-spec.md` so generated `metadata.yaml` is provenance-ready and `lineage.jsonl` starts with `candidate_created`.
- Patched `.agent/workflows/step-w-04-validate.md` to validate metadata, lineage, promotion plan, lean-body rules, and source-status curator routing.
- Code-review fix pass: aligned `create-capability.md` with nested `origin.created_by` metadata shape from the provenance contract.
- Code-review fix pass: made `private` and `security-sensitive` source sensitivity explicitly trigger curator/evolution review in Source Rules.
- Code-review fix pass: corrected validation smoke tests to reference `${IWISH_HOME}/generated-*` draft paths before promotion and canonical `.agent/` paths only after approval.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.
- Ran `npm run build` -> pass.
- Review fix validation: reran `./.agent/scripts/validate-kg.sh` -> pass.
- Review fix validation: reran `./.agent/scripts/validate-portability.sh` -> pass.
- Review fix validation: reran `npm run build` -> pass.

### Decisions

- Marked this story ready for Vegeta because it has no frontend UI surface and does not require Discovery Track UI spec generation.
- Kept scope contract-first because Plan Tune score is WARN-level due to cross-governance coordination.
- Deferred FeatureGraph/FalkorDB indexing, automatic graph sync, evolution runner behavior, and automatic source-status checks to later stories.
- Confirmed no DataEntity, Event, or SeedData contract was introduced; FeatureGraph/FalkorDB backward update was not required for this story.
- Kept fixes contract-only and did not introduce runtime graph writes, automatic promotion, or canonical draft writes.
