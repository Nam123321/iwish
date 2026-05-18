---
story_id: "STORY-HSEA-1.3"
epic_id: "EPIC-HSEA"
title: "Add Background Review and Learning Log Governance"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: ["STORY-HSEA-1.1b", "story-hsea-1.2-skill-authoring-curator-rules.md", "story-hsea-1.2-skill-authoring-curator-rules.mdb", "story-hsea-1.2-skill-authoring-curator-rules.mdc"]
phase: "forge"

---
# Story HSEA-1.3: Add Background Review and Learning Log Governance

## 1. Objective

Define I-Wish governance for background review recommendations and auditable learning logs so session lessons, review findings, validation failures, user corrections, and evolution-trial evidence can be reused without hidden canonical mutation.

## 1.1 Context

Hermes can run background review after a session to improve memories and skills. I-Wish should preserve the learning value but keep updates explicit, auditable, project-scoped, source-linked, and promotion-gated.

HSEA-1.1b defined memory admission and routing. HSEA-1.2 defined authoring and curator recommendation rules. HSEA-1.2b defined provenance and lineage for generated capabilities. HSEA-1.2c defined governed draft skill creation from session feedback. This story fills the remaining governance gap: the durable learning-log and background-review output contract that sits before memory updates, draft capability creation, or future Evolution Lab fixture selection.

This is not a scheduler or autonomous background worker story. It defines the log schema, recommendation boundaries, dispositions, and integration points that later automation may consume.

**Source artifacts:**
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1b-memory-admission-scoring.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2-skill-authoring-curator-rules.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2b-skill-provenance-lineage.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.2c-governed-draft-skill-creation.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/learning-context-loop.md`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/fragments/draft-skill-creation-governance.md`
- `${IWISH_HOME}/repo-dna/hermes-agent-dna.md`

**Target integration surface:**
- A new reusable background review and learning-log governance fragment under `.agent/fragments/`.
- A pointer from `.agent/memory/MEMORY_SCHEMA.md` to the new governance fragment.
- A narrow pointer from `.agent/fragments/learning-context-loop.md` so SAVE output can route learning-log candidates without bypassing memory admission.
- This story record and sprint tracker.

**Dependency state:**
- `STORY-HSEA-1.1b` is done and defines memory admission scoring and routing.
- `story-hsea-1.2-skill-authoring-curator-rules.md` is done and defines curator recommendation lifecycle and non-destructive capability governance.
- `story-hsea-1.2-skill-authoring-curator-rules.mdb` is done and defines provenance/lineage fields for generated capabilities.
- `story-hsea-1.2-skill-authoring-curator-rules.mdc` is done and defines draft skill creation governance.

## 2. User Story

As a I-Wish workflow owner,  
I want session learnings and background review findings stored as auditable learning-log entries,  
So that future memory, capability, and evolution decisions use evidence without silently rewriting project assets.

## 3. Acceptance Criteria

### AC1: Learning Log Schema Is Defined
**Given** a user correction, QA finding, validation failure, bug-fix lesson, code-review finding, curator signal, or evolution-trial result occurs  
**When** it is recorded as a learning-log entry  
**Then** the schema captures source, timestamp, story/workflow, target asset, candidate type, failure case, attempted change, outcome, reviewer decision, confidence, sensitivity, follow-up, and source references.

### AC2: Learning Log Dispositions Are Explicit
**Given** a learning-log entry is reviewed  
**When** a workflow decides what to do next  
**Then** the allowed dispositions are defined as `skip`, `log_only`, `project_memory_candidate`, `workflow_memory_candidate`, `instinct_candidate`, `kg_learning_candidate`, `draft_capability_candidate`, `curator_recommendation`, `evolution_fixture_candidate`, and `holdout_candidate`.

### AC3: Background Review Is Recommendation-Only
**Given** a background review detects a possible memory, skill, workflow, agent, fragment, or compound capability update  
**When** the review completes  
**Then** it emits a learning-log entry, curator recommendation, or generated candidate spec  
**And** it does not modify canonical `.agent/`, `templates/`, `PROJECT.md`, `USER.md`, KG/MemoryGraph nodes, or `${IWISH_HOME}/generated-*` drafts unless an active workflow explicitly authorizes that action.

### AC4: Project Scope and Sensitivity Are Preserved
**Given** a lesson belongs to one project, workflow, or source artifact  
**When** it is stored or recommended  
**Then** it remains project-scoped with compact source references  
**And** it is not promoted to `USER.md`, global memory, canonical capability assets, or reusable skills unless explicitly approved after sensitivity review.

### AC5: Memory Admission and Classification Non-Bypass Are Preserved
**Given** a learning-log entry is memory-shaped, skill-shaped, workflow-shaped, agent-shaped, fragment-shaped, or compound-shaped  
**When** routing occurs  
**Then** `.agent/fragments/memory-admission-protocol.md` and the Classification Funnel determine destination before durable memory or capability draft creation  
**And** high source frequency or repeated appearance is not enough to bypass approval gates.

### AC6: Evolution Lab Can Reuse Logs Safely
**Given** the future Evolution Lab needs failure cases, train cases, holdouts, rejected mutations, or score evidence  
**When** learning logs are queried  
**Then** logs can be selected as trainable cases, holdout cases, or negative examples using confidence, sensitivity, recency, severity, source refs, and reviewer decision  
**And** selected cases still require independent validation before promotion.

### AC7: Auditability and Retention Rules Are Defined
**Given** learning-log entries accumulate over time  
**When** entries become stale, superseded, sensitive, low-confidence, resolved, or promoted  
**Then** governance defines how to mark status, preserve source refs, avoid raw evidence dumps, and keep append-only audit history instead of rewriting or deleting records silently.

## 4. Proposed Learning Log Contract

Minimum entry shape:

```yaml
id: "learning-log-<stable-id>"
ts: "YYYY-MM-DD"
source:
  type: "session|story|implementation|fix-bug|code-review|qa|curator|background-review|evolution-trial|user-correction"
  ref: "<story id, bug id, review id, repo-relative path, or ${IWISH_HOME} artifact>"
story_id: "STORY-HSEA-1.3"
workflow: "<workflow-or-agent-name>"
target:
  type: "project-memory|user-memory|workflow-memory|instinct|kg-learning|skill|workflow|agent|fragment|compound|unknown"
  path: "<repo-relative path, ${IWISH_HOME} path, or null>"
evidence:
  failure_case: "<compact description>"
  attempted_change: "<compact description or null>"
  outcome: "passed|failed|partial|not_run|recommendation_only"
  severity: 1-5
  source_refs:
    - "<compact source ref>"
routing:
  admission_score: 0
  classification: "memory|skill|workflow|agent|fragment|compound|unknown"
  disposition: "skip|log_only|project_memory_candidate|workflow_memory_candidate|instinct_candidate|kg_learning_candidate|draft_capability_candidate|curator_recommendation|evolution_fixture_candidate|holdout_candidate"
review:
  reviewer: null
  decision: "pending|accepted|rejected|deferred|promoted|superseded"
  confidence: 1-10
  sensitivity: "public|project|private|security-sensitive"
  follow_up: "<next action or none>"
status: "active|resolved|promoted|stale|superseded|sensitive|archived"
```

Contract rules:

- Store lessons and source refs, not raw logs, transcripts, graph dumps, or source files.
- Authorized foreground workflows persist learning-log entries as append-only JSONL rows in `.agent/memory/learning-log.jsonl`.
- Use append-only updates or status events for material changes; do not silently rewrite historical decisions.
- Material changes append a new row with the same `id`, updated `status` or `review.decision`, and a compact source ref to the prior entry or triggering artifact.
- `severity` is required on a `1-5` scale and can raise review priority, but cannot bypass admission, classification, validation, sensitivity, or approval gates.
- `sensitivity: private` or `security-sensitive` blocks global promotion and requires reviewer-visible handling.
- `classification: unknown` blocks draft creation and routes to human review.
- `disposition: draft_capability_candidate` must route through HSEA-1.2c and generated `${IWISH_HOME}/generated-*` rules.
- `disposition: curator_recommendation` must follow the HSEA-1.2 Curator Recommendation Contract.
- `evolution_fixture_candidate` and `holdout_candidate` are inputs to future Evolution Lab stories only; they do not prove correctness.

## 5. Tasks

### T1: Create Background Review and Learning Log Governance Fragment
- Add `.agent/fragments/background-review-learning-log-governance.md`.
- Define purpose, scope, non-automation boundary, and required upstream fragments.
- Define learning-log entry schema, storage path, append convention, and allowed status values.
- Define allowed dispositions and routing meaning.

### T2: Define Background Review Recommendation Boundary
- State that background review is recommendation-only.
- Forbid direct canonical `.agent/`, `templates/`, `PROJECT.md`, `USER.md`, KG/MemoryGraph, or generated draft writes unless an active workflow explicitly authorizes them.
- Define what background review may emit: learning-log entry, curator recommendation, candidate spec, or reviewer-visible follow-up.

### T3: Define Project Scope, Sensitivity, and Retention Rules
- Require project/workflow/source scope on every entry.
- Define sensitivity handling for `public`, `project`, `private`, and `security-sensitive`.
- Define stale, superseded, resolved, promoted, archived, and sensitive status behavior.
- Keep raw evidence in source artifacts and compact refs in logs.

### T4: Connect Learning Logs to Memory, Capability, and Evolution Routing
- Reference `.agent/fragments/memory-admission-protocol.md`.
- Reference `.agent/fragments/draft-skill-creation-governance.md`.
- Reference `.agent/fragments/capability-authoring-curator-rules.md`.
- Reference `.agent/fragments/capability-provenance-lineage.md`.
- Define how evolution stories may select train, holdout, and negative examples from logs.

### T5: Add Narrow Discovery Pointers
- Update `.agent/memory/MEMORY_SCHEMA.md` with a pointer to the new learning-log governance fragment.
- Update `.agent/fragments/learning-context-loop.md` with a narrow note that SAVE candidates may become learning-log entries before KG learning files.
- Keep changes pointer-level; do not implement a scheduler or background worker.

### T6: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm story and changed guidance use repo-relative paths, `{project-root}`, or `${IWISH_HOME}`.
- Update File List and Vegeta Agent Record after implementation.

## 6. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Learning log schema defined | T1 | Schema fields, status values | ✅ |
| AC2 | Learning log dispositions explicit | T1, T4 | Disposition enum, routing meaning | ✅ |
| AC3 | Background review recommendation-only | T2 | Non-mutation boundary, allowed outputs | ✅ |
| AC4 | Project scope and sensitivity preserved | T3 | Scope refs, sensitivity handling, promotion limits | ✅ |
| AC5 | Admission and classification non-bypass | T4 | Memory admission, capability routing, approval gates | ✅ |
| AC6 | Evolution Lab can reuse logs safely | T4 | Train/holdout/negative selection guidance | ✅ |
| AC7 | Auditability and retention rules defined | T3 | Append-only history, stale/superseded/resolved handling | ✅ |

## 7. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 7 ACs, below >8 threshold | 0 |
| Data Model Spread | Markdown schema/contract only; no DB models | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Memory, background review, curator, generated capability, evolution evidence | 3 |
| Flow Complexity | Recommendation and routing flow across memory/capability/evolution paths | 2 |
| Test Burden | No E2E/manual-test tagged ACs | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - scope crosses multiple governance surfaces. Keep implementation fragment-first and pointer-only; defer background scheduling, graph writes, and Evolution Lab runner behavior to later stories.

## 8. Create-Story Readiness Notes

This story is ready for implementation as a governance/documentation story. It should create the learning-log/background-review contract and narrow pointers. It should not implement background execution, hidden memory writes, graph indexing, or generated capability creation.

**Primary implementation target:** `.agent/fragments/background-review-learning-log-governance.md`.

**Secondary implementation targets:** `.agent/memory/MEMORY_SCHEMA.md` and `.agent/fragments/learning-context-loop.md` only for concise discovery/routing pointers.

**Out of scope for this story:**
- background scheduler or daemon;
- automatic session-end review;
- direct writes into `PROJECT.md`, `USER.md`, `.agent/skills`, `.agent/workflows`, `.agent/agents`, `templates/`, KG, MemoryGraph, or `${IWISH_HOME}/generated-*`;
- Evolution Lab candidate scoring runner;
- holdout execution;
- raw transcript or memorygraph dump storage;
- importing Hermes runtime code.

**Project memory gate:** `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` are not present in this checkout. Use HSEA epic artifacts and `.agent/fragments/` governance files as current project authority. If memory files are added later, load only HSEA-relevant sections and treat `PROJECT.md` as primary.

**Workflow availability note:** `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml` are present. The create-story wrapper references `.agent/skills/qa-simulator-guardian.md`, but the canonical installed skill path is `.agent/skills/qa-simulator-guardian/SKILL.md`; use that file for the Fat-Guardian scorecard.

## 9. Dev Notes

- HSEA-1.1b already defines memory admission and says background review is recommendation-only.
- HSEA-1.2 already defines curator recommendation dispositions. Reuse its recommendation contract rather than creating a second curator shape.
- HSEA-1.2b already defines generated capability provenance and lineage. Learning logs should reference source evidence compactly and should not duplicate `lineage.jsonl`.
- HSEA-1.2c already defines when a learning becomes a draft skill. This story should route to that fragment for draft capability candidates.
- `.agent/fragments/learning-context-loop.md` already has LOAD/SAVE protocols. Add only a small pointer so SAVE can produce learning-log candidates before durable KG learning files.
- `.agent/memory/MEMORY_SCHEMA.md` is human reference. Keep executable agent behavior in fragments.
- Treat learning logs as evidence for future decisions, not proof. Frequency and recurrence increase priority but do not bypass validation or approval.
- Sensitive evidence should stay in source artifacts with compact refs; logs should record enough to audit without leaking details.

## 10. Definition of Done

- [x] Background review and learning-log governance fragment exists.
- [x] Learning-log schema and status values are documented.
- [x] Allowed dispositions are documented with routing meaning.
- [x] Background review recommendation-only boundary is explicit.
- [x] Project scope, sensitivity, and retention rules are documented.
- [x] Memory admission and Classification Funnel non-bypass behavior is referenced.
- [x] Evolution Lab reuse guidance for train/holdout/negative examples is documented.
- [x] Discovery pointers are narrow and non-automating.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] Deterministic compiler check passes.

## 11. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story defines the missing background-review and learning-log contract without sneaking in automation. |
| Data Integrity & State | 9 | Entries carry source, scope, status, reviewer decision, sensitivity, and disposition, preserving auditability. |
| Security & Validation | 9 | Recommendation-only boundaries and sensitivity rules prevent hidden canonical writes and evidence leakage. |
| Performance & Scalability | 9 | Compact refs and log dispositions keep long-term evidence reusable without prompt-memory bloat. |
| Error Handling & Recovery | 9 | Stale, superseded, resolved, archived, and sensitive statuses support review and rollback paths. |
| Code Quality & Maintainability | 9 | A reusable fragment plus narrow pointers centralizes governance and avoids parallel workflow-specific contracts. |
| UX Empathy | 9 | User corrections and review outcomes can improve I-Wish without surprising the user with silent changes. |

**Total Average:** 9.00 / 10 - PASS

## 12. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.3-background-review-learning-log.md`
- `.agent/fragments/background-review-learning-log-governance.md`
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/fragments/learning-context-loop.md`

## 13. Vegeta Agent Record

### Planned

- Create `.agent/fragments/background-review-learning-log-governance.md`.
- Add narrow discovery pointers from memory schema and learning context loop.
- Keep implementation governance-only and non-automating.
- Run KG and portability validation.

### Implementation Status

- Added `.agent/fragments/background-review-learning-log-governance.md` as the canonical governance fragment for session lessons, background-review findings, user corrections, QA findings, code-review findings, curator signals, and evolution-trial evidence.
- Defined the learning-log entry contract with source, target, evidence, routing, review, sensitivity, and status fields.
- Defined allowed dispositions: `skip`, `log_only`, `project_memory_candidate`, `workflow_memory_candidate`, `instinct_candidate`, `kg_learning_candidate`, `draft_capability_candidate`, `curator_recommendation`, `evolution_fixture_candidate`, and `holdout_candidate`.
- Documented background review as recommendation-only and forbade direct writes to `PROJECT.md`, `USER.md`, `.agent/`, `templates/`, KG/MemoryGraph nodes, or `${IWISH_HOME}/generated-*` drafts unless an active workflow explicitly authorizes the action.
- Added project scope, sensitivity, and retention rules for `public`, `project`, `private`, `security-sensitive`, `active`, `resolved`, `stale`, `superseded`, `sensitive`, and `archived`.
- Connected learning-log routing to memory admission, capability classification, curator recommendations, draft skill governance, provenance/lineage, and future Evolution Lab train/holdout/negative example selection.
- Updated `.agent/memory/MEMORY_SCHEMA.md` with a pointer to the new learning-log/background-review governance fragment.
- Updated `.agent/fragments/learning-context-loop.md` SAVE Protocol to load the new fragment and route audit-only candidates as learning-log/background-review recommendations before creating KG learning files.

### Code Review Fix Pass

- Added required `evidence.severity` to the learning-log contract and documented that severity raises review priority without bypassing gates.
- Added `promoted` to the canonical status enum and status handling table.
- Defined `.agent/memory/learning-log.jsonl` as the authorized append-only storage path for persisted learning-log entries.
- Updated SAVE routing and memory schema pointers to name the learning-log path and append-only convention.

### Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` passed.
- `./.agent/scripts/validate-kg.sh` passed after fragment creation.
- `./.agent/scripts/validate-portability.sh` passed after fragment creation.
- `./.agent/scripts/validate-kg.sh` passed after pointer updates.
- `./.agent/scripts/validate-portability.sh` passed after pointer updates.
- `npm run build` passed.
- `./.agent/scripts/validate-kg.sh` passed after code-review fix pass.
- `./.agent/scripts/validate-portability.sh` passed after code-review fix pass.
- `npm run build` passed after code-review fix pass.

### Notes

- CodebaseGraph and FeatureGraph query tools were not callable in this session, so blast-radius review used local `rg` searches and direct file inspection.
- No UI implementation was involved; Stitch and visual gates were not applicable.
