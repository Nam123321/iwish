---
story_id: "STORY-HSEA-2.1"
epic_id: "EPIC-HSEA"
title: "Specify Evolution Lab Core Model"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-1.1b", "STORY-HSEA-1.2b"]
blocks: ["STORY-HSEA-2.2", "STORY-HSEA-3.1"]
phase: "forge"

---
# Story HSEA-2.1: Specify Evolution Lab Core Model

## 1. Objective

Specify the I-Wish-native Skill/Workflow Evolution Lab core model so I-Wish can improve skills, workflows, checklists, and story templates through failure-case-driven candidate evolution without copying Darwinian Evolver source code or automatically mutating canonical `.agent/` assets.

## 1.1 Context

The approved Hermes + Self-Evolution absorption direction is **governed, project-centered, hybrid pattern absorption**. Hermes core contributes memory, skill authoring, curator, and background review ideas. `hermes-agent-self-evolution` contributes an offline measured optimization pattern: build datasets, generate variants, score before/after, enforce constraints, and promote through human review. Darwinian Evolver contributes behavioral patterns: organism, evaluator, mutator, failure cases, population, lineage, learning log, novelty, holdouts, and parent selection.

I-Wish must absorb the **model and behavior**, not AGPL source. The first slice should define the lab vocabulary, artifact layout, lifecycle, boundaries, and integration points. It must not implement a full evolution runner, scoring formula, external engine adapter, or production source-code evolution.

**Source artifacts:**
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1b-memory-admission-scoring.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2b-skill-provenance-lineage.md`
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/fragments/graph-backend-selection-policy.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/self-evolution-analysis.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/darwinian-evolver-research.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/iwish-evolution-lab-trial-plan.md`

**Target integration surface:**
- A new Evolution Lab core model specification or fragment.
- Story record and sprint tracker.
- Pointer-level references for downstream scoring/trial/promotion stories.

## 2. User Story

As a I-Wish capability maintainer,  
I want a clear Evolution Lab core model for skills, workflows, checklists, and templates,  
So that candidates can be generated, constrained, evaluated, compared, learned from, and promoted through a safe repeatable process.

## 3. Acceptance Criteria

### AC1: Core Concepts Are Defined
**Given** the Evolution Lab model is specified  
**When** a maintainer reads it  
**Then** it defines organism, candidate, target asset, evaluator, mutator, failure case, trainable case, holdout case, constraint, population, lineage, learning log, scorecard, and promotion recommendation  
**And** each concept maps to a I-Wish-native artifact or responsibility.

### AC2: Artifact Layout Is Defined Outside Canonical Assets
**Given** the lab creates an experiment or candidate  
**When** it writes artifacts  
**Then** it writes under a non-canonical lab/generated location such as `${IWISH_HOME}/evolution-lab/` or `${IWISH_HOME}/generated-*`  
**And** canonical `.agent/` files are not modified without a later explicit promotion story/gate.

### AC3: Candidate Lifecycle Is Defined
**Given** a candidate variant exists  
**When** it moves through the lab  
**Then** its lifecycle includes proposed, drafted, structurally_validated, train_evaluated, holdout_evaluated, rejected, recommended, promoted, rolled_back, and archived states  
**And** state changes are append-only lineage events.

### AC4: Clean-Room and Scope Boundaries Are Explicit
**Given** I-Wish uses Darwinian Evolver and Hermes Self-Evolution as references  
**When** the lab model is implemented  
**Then** it states that AGPL source must not be copied or vendored  
**And** it limits the first lab scope to markdown/governance assets while deferring production source-code evolution and external-engine integration.

### AC5: Integration With Memory, Provenance, and Graphs Is Defined
**Given** the lab uses project feedback and prior failures  
**When** it selects context for mutation or evaluation  
**Then** it uses HSEA memory admission, capability provenance/lineage, and graph backend policy as inputs  
**And** stale, sensitive, low-confidence, or graph-unavailable evidence is handled as review-required or unavailable, not authoritative.

### AC6: Downstream Story Boundaries Are Preserved
**Given** future stories define scoring, fixtures, trial execution, and promotion  
**When** HSEA-2.1 is completed  
**Then** it leaves scoring/novelty/population formulas to HSEA-2.2  
**And** leaves fixture creation, trial runs, promotion, rollback, and optional external-engine decisions to HSEA-3.x and HSEA-2.3.

### AC7: Trial Targets Are Named Without Implementing the Trial
**Given** the lab model should support later validation  
**When** the specification names initial target classes  
**Then** it includes repo absorption, security guardian, and UX quality/checklist assets as trial target examples  
**And** it makes clear that HSEA-3.1 owns fixture creation.

## 4. Tasks

### T1: Define Core Model Vocabulary
- Define all core concepts from AC1.
- Map each concept to a I-Wish artifact, file, or responsibility.
- Include which agent/persona or workflow owns each responsibility when known.

### T2: Define Experiment and Candidate Artifact Layout
- Specify lab root, experiment manifest, candidate directory, baseline snapshot, evaluation report, lineage log, and learning log.
- Reference generated capability layout from HSEA-1.2b where relevant.
- Require artifacts to live outside canonical `.agent/` paths until promotion.

### T3: Define Candidate Lifecycle and Lineage Rules
- Define lifecycle states and allowed transitions.
- Require append-only lineage events for every state change.
- Define minimum lineage fields: timestamp, parent, child, state, evaluator, score summary, holdout result, decision, reason, and source refs.

### T4: Define Safety, Legal, and Scope Boundaries
- State clean-room behavior and no AGPL source import.
- State markdown-first scope: skills, workflows, checklists, story templates, and governance fragments.
- Defer production source-code evolution, unattended continuous evolution, and external Darwinian engine adapter.
- Preserve human promotion gates and canonical asset protection.

### T5: Define Integration Points and Downstream Boundaries
- Connect the model to memory admission, capability provenance/lineage, graph backend selection, and future scoring/population stories.
- Define how stale/sensitive/low-confidence/graph-unavailable evidence is treated.
- Identify HSEA-2.2, HSEA-2.3, HSEA-3.1, HSEA-3.2, and HSEA-3.3 responsibilities.

### T6: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Run `npm run build`.
- Update File List and Agent Record.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Core concepts defined | T1 | Concepts, I-Wish mapping, ownership | ✅ |
| AC2 | Artifact layout outside canonical assets | T2, T4 | Lab/generated paths, canonical protection | ✅ |
| AC3 | Candidate lifecycle defined | T3 | States, transitions, append-only lineage | ✅ |
| AC4 | Clean-room and scope boundaries explicit | T4 | AGPL boundary, markdown-first, deferred source evolution | ✅ |
| AC5 | Memory/provenance/graph integration defined | T5 | HSEA-1.1b, HSEA-1.2b, HSEA-4.5 links | ✅ |
| AC6 | Downstream story boundaries preserved | T5 | HSEA-2.2/2.3/3.x boundary map | ✅ |
| AC7 | Trial targets named without implementing trial | T5 | Repo absorption, security, UX/checklist examples | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 7 ACs, below >8 threshold | 0 |
| Data Model Spread | No DB schema changes; file/contract model only | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Memory/provenance, capability drafts, graph evidence, scoring/trial boundaries | 3 |
| Flow Complexity | Multi-stage candidate lifecycle and lineage flow | 2 |
| Test Burden | Script/build validation only | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - keep this story as a core model specification. Do not implement scoring formulas, mutation runner, fixture generation, or promotion automation in this slice.

## 7. Dev Notes

- This is a **model/specification story**, not an evolution runner implementation story.
- Do not import, vendor, translate, or structurally copy Darwinian Evolver AGPL source code.
- Do not mutate canonical `.agent/` assets. Candidates must live outside canonical runtime paths until a later promotion gate.
- Use HSEA-1.1b memory admission to decide which failures or user corrections are eligible as evolution evidence.
- Use HSEA-1.2b provenance/lineage to connect candidates to source failures, holdout results, parent/child relationships, and reviewer decisions.
- Use HSEA-4.5 graph backend policy when the model mentions CodebaseGraph, FeatureGraph, or MemoryGraph evidence. Missing graph evidence means unavailable, not no-impact.
- Keep candidate bodies lean. Store raw evidence behind refs, not inside evolved `SKILL.md` or workflow bodies.
- HSEA-2.2 owns numeric scoring, novelty, parent selection, holdout weighting, and population policy.
- HSEA-2.3 owns exact Darwinian external-reference and optional external-engine boundaries.
- HSEA-3.1 owns concrete fixtures for repo absorption, security guardian, and UX quality/checklist trial targets.
- HSEA-3.2 owns running the trial and producing the empirical scorecard.
- HSEA-3.3 owns promotion and rollback governance after trial evidence exists.
- Project memory check: `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` were not present in this checkout during create-story, so no persistent memory constraints were applied.

## 8. Definition of Done

- [x] Core Evolution Lab model vocabulary is documented.
- [x] Experiment and candidate artifact layout is documented.
- [x] Candidate lifecycle and append-only lineage rules are documented.
- [x] Clean-room, legal, and scope boundaries are explicit.
- [x] Integration points with memory, provenance, and graph evidence are documented.
- [x] Downstream story boundaries are explicit.
- [x] Initial trial target examples are named without implementing fixtures.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] `npm run build` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story defines the model needed before scoring or runner implementation begins. |
| Data Integrity & State | 9 | Candidate lifecycle, lineage, and non-canonical storage prevent state confusion and accidental overwrites. |
| Security & Validation | 9 | Clean-room AGPL boundary, sensitive evidence handling, and human promotion gates are explicit. |
| Performance & Scalability | 9 | Markdown-first scope and deferred runner/scoring details keep the first slice tractable. |
| Error Handling & Recovery | 9 | Rejected, rolled-back, and archived states preserve failed attempts for learning instead of hiding them. |
| Code Quality & Maintainability | 9 | Clear vocabulary and downstream boundaries reduce drift between scoring, fixtures, and promotion stories. |
| UX Empathy | 9 | Maintainers get an understandable lab model with explicit safety rails before automation appears. |

**Total Average:** 9.00 / 10 - PASS

## 10. File List

- `.agent/fragments/evolution-lab-core-model.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.1-evolution-lab-core-model.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.2-scoring-novelty-population-policy.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-3.1-evolution-lab-trial-fixtures.md`
- `_iwish-output/stories/sprint-status.yaml`

## 11. Agent Record

### Planned

- Implement HSEA-2.1 as a specification-first Evolution Lab core model.
- Preserve HSEA-2.2/HSEA-2.3/HSEA-3.x downstream boundaries.
- Avoid runner, scoring, fixture, promotion, external-engine, or production source-code evolution scope.

### Implementation Status

- Added `.agent/fragments/evolution-lab-core-model.md` as the Evolution Lab core model contract.
- Defined core vocabulary: target asset, organism, candidate, baseline, failure case, trainable case, holdout case, constraint, mutator, evaluator, scorecard, population, lineage, learning log, and promotion recommendation.
- Defined experiment layout under `${IWISH_HOME}/evolution-lab/` with manifest, baseline, fixtures, candidates, learning log, and population summary.
- Defined candidate lifecycle states and append-only lineage event requirements.
- Defined structural validation rules, clean-room/AGPL boundaries, markdown-first scope, and canonical `.agent/` write protection.
- Connected model to memory admission, capability provenance/lineage, graph backend policy, and downstream HSEA story ownership.
- Named initial trial target examples without implementing fixtures.
- Marked story `DONE` and sprint status `done`.

### Tests / Validation Run

- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.

### Decisions

- Kept HSEA-2.1 focused on the core model only. Numeric scoring, novelty, holdouts, and population selection remain in HSEA-2.2.
- Kept Darwinian Evolver as behavioral-pattern inspiration only; no AGPL source-code import is permitted.
- Kept trial fixtures and empirical scorecard out of this story so HSEA-3.1 and HSEA-3.2 remain meaningful.
- Did not create a runner or mutate generated/canonical capabilities in this story.
- CodeGraph/FeatureGraph MCP tools were unavailable in this session; blast-radius review used repository file search and existing HSEA source artifacts.

## 12. Senior Developer Review (AI)

**Review Date:** 2026-05-11  
**Reviewer:** Codex / I-Wish Code Review  
**Outcome:** Changes Requested - Fixed

### Findings

1. **P1 - Candidate state is defined as prose/lineage only, not as a machine-readable current-state contract.**  
   Evidence: AC3 requires a candidate lifecycle with states and append-only lineage events. The fragment defines allowed states at `.agent/fragments/evolution-lab-core-model.md:101-114` and a lineage event shape at `.agent/fragments/evolution-lab-core-model.md:134-148`, but the `experiment.yaml` contract at `.agent/fragments/evolution-lab-core-model.md:69-97` has no `candidates[]`, `current_state`, or state enum field. Downstream HSEA-2.2/HSEA-3.2/HSEA-3.3 tooling would have to reconstruct the current candidate state by scanning JSONL history, and the code-review contract drift gate requires newly introduced machine-readable statuses to appear in the structured output shape.  
   Confidence: 9/10.

2. **P1 - Invalid drafted candidates have no valid rejection transition before evaluation.**  
   Evidence: Structural validation is required before evaluation at `.agent/fragments/evolution-lab-core-model.md:151-162`; the transition table moves `drafted` only to `structurally_validated` at `.agent/fragments/evolution-lab-core-model.md:120-122`; rejection is allowed only from "Any evaluated state" at `.agent/fragments/evolution-lab-core-model.md:125`. A draft that fails required-file, canonical-path, lean-body, holdout-visibility, or AGPL checks is not yet evaluated and has no defined transition to `rejected` or `archived`. This creates an ambiguous failure state right at the safety gate.  
   Confidence: 9/10.

3. **P2 - The new core model fragment is not discoverable by downstream HSEA stories or workflow surfaces.**  
   Evidence: The story target integration surface calls for pointer-level references for downstream scoring/trial/promotion stories, but `rg "evolution-lab-core-model|Evolution Lab Core Model" .agent _iwish-output docs templates` only finds the fragment itself and this story record. HSEA-2.2 and HSEA-3.1 remain unpatched, so the next stories can proceed without loading the new source-of-truth fragment. This is not a runtime bug yet, but it weakens AC6's downstream boundary preservation.  
   Confidence: 8/10.

4. **P2 - Candidate body layout does not preserve target-specific filenames or frontmatter.**  
   Evidence: The experiment layout stores every candidate body as generic `candidate.md` at `.agent/fragments/evolution-lab-core-model.md:51-58`, while `target_asset.type` allows `SKILL`, `WORKFLOW`, `CHECKLIST`, `STORY_TEMPLATE`, and `FRAGMENT` at `.agent/fragments/evolution-lab-core-model.md:72-74`. The Hermes self-evolution source explicitly preserves skill frontmatter; this model does not state whether `SKILL.md` frontmatter, workflow frontmatter, command metadata, or original filenames must be preserved in the candidate package. Future evaluators may score text that cannot be promoted without manual reconstruction.  
   Confidence: 8/10.

### Action Items

- [x] [AI-Review][P1] Add a machine-readable candidate manifest/metadata contract with `candidate_id`, `parent_id`, `target_asset`, `current_state`, allowed state enum, state source, and latest lineage event reference.
- [x] [AI-Review][P1] Add failure transitions from `drafted` and `structurally_validated` to `rejected` for structural/safety/AGPL/holdout-visibility failures.
- [x] [AI-Review][P2] Add explicit pointers to `.agent/fragments/evolution-lab-core-model.md` in HSEA-2.2 and HSEA-3.1, or a shared index/workflow surface that downstream stories must load.
- [x] [AI-Review][P2] Define target-specific candidate packaging rules, including original filename preservation and frontmatter/metadata preservation for skills and workflows.

### Fix Resolution

- Added `candidate.yaml` and `experiment.yaml` `candidates[]` contract with `candidate_id`, `parent_id`, `target_asset`, `current_state`, allowed state enum, `state_source`, and `latest_lineage_event`.
- Added fast-read/current-state reconciliation rule: `current_state` supports tools and reviewers; `lineage.jsonl` remains append-only audit history.
- Added target-specific packaging rules so `SKILL`, `WORKFLOW`, `CHECKLIST`, `STORY_TEMPLATE`, and `FRAGMENT` candidates preserve original filenames, frontmatter, metadata, placeholders, and machine-readable enums.
- Added explicit pre-evaluation rejection transitions from `drafted` and `structurally_validated` to `rejected`.
- Added required upstream model pointers to HSEA-2.2 and HSEA-3.1 so downstream scoring and fixture stories load `.agent/fragments/evolution-lab-core-model.md`.

### Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.
- FeatureGraph validation was skipped because FeatureGraph MCP tools were not available in this execution context. This story introduces no Prisma/DataEntity/Event/SeedData code.

### Fix Validation

- `rg -n "candidate.yaml|current_state|state_source|Target-Specific Candidate Packaging|drafted.*rejected|structurally_validated.*rejected" .agent/fragments/evolution-lab-core-model.md` - PASS.
- `rg -n "evolution-lab-core-model" _iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.2-scoring-novelty-population-policy.md _iwish-output/stories/epic-hermes-self-evolution/story-hsea-3.1-evolution-lab-trial-fixtures.md` - PASS.
- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.

### QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The model now includes current-state metadata, lifecycle transitions, typed packaging, and downstream load requirements. |
| Data Integrity & State | 9 | `candidate.yaml`, manifest `candidates[]`, `current_state`, `state_source`, and append-only lineage give both fast-read and audit-safe state. |
| Security & Validation | 9 | Failed structural/safety/AGPL/holdout checks now have explicit rejection transitions before evaluation. |
| Performance & Scalability | 8 | The model remains lightweight and markdown-first. |
| Error Handling & Recovery | 9 | Invalid drafts and structurally validated candidates can now reject cleanly with lineage evidence. |
| Code Quality & Maintainability | 9 | Downstream stories now reference the model, and candidate packaging preserves original asset shape. |
| UX Empathy | 8 | Maintainers can inspect current state quickly and still rely on lineage for audit history. |

**Total Average:** 8.71 / 10 - PASS AFTER FIXES
