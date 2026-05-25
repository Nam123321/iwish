# Background Review and Learning Log Governance

> **Purpose:** Define how BMAD records session lessons and background-review findings as auditable evidence without allowing hidden automation to mutate canonical assets.

Use this fragment when a session, story, implementation pass, bug fix, code review, QA run, curator signal, user correction, or evolution trial produces a durable learning candidate.

This fragment is governance-only. It does not authorize background schedulers, hidden session-end jobs, automatic memory writes, canonical `.agent/` edits, template updates, KG/MemoryGraph writes, or generated capability drafts unless an active workflow explicitly authorizes those actions.

Load these fragments alongside this one when routing an entry:

- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/fragments/draft-skill-creation-governance.md`

## Learning Log Entry Contract

Minimum entry shape:

```yaml
id: "learning-log-<stable-id>"
ts: "YYYY-MM-DD"
source:
  type: "session|story|implementation|fix-bug|code-review|qa|curator|background-review|evolution-trial|user-correction"
  ref: "<story id, bug id, review id, repo-relative path, or ${BMAD_HOME} artifact>"
story_id: "<story-id-or-null>"
workflow: "<workflow-or-agent-name>"
target:
  type: "project-memory|user-memory|workflow-memory|instinct|kg-learning|skill|workflow|agent|fragment|compound|unknown"
  path: "<repo-relative path, ${BMAD_HOME} path, or null>"
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

Required rules:

- Store compact lessons and source references, not raw logs, transcripts, graph dumps, review dumps, or source files.
- Use repo-relative paths, story IDs, bug IDs, graph IDs, approved URLs, or `${BMAD_HOME}` artifacts for source refs.
- Keep `severity` on a `1-5` scale. Severity raises review priority but cannot bypass admission, classification, validation, sensitivity, or approval gates.
- Keep `confidence` on a `1-10` scale. Values below `7` are reviewer-visible only and cannot drive automated branching.
- Use append-only events or status changes for material updates. Do not silently rewrite historical decisions.
- `classification: unknown` blocks memory writes and draft creation until human review resolves the route.
- `sensitivity: private` or `security-sensitive` blocks global/user-memory promotion and requires reviewer-visible handling.

## Storage and Append Rules

Foreground workflows that are authorized to persist learning-log entries MUST append compact JSONL rows to `.agent/memory/learning-log.jsonl` using the same field names as the contract above.

Background review may emit candidate learning-log entries, but it must not append them to `.agent/memory/learning-log.jsonl` unless an active foreground workflow explicitly authorizes persistence.

For material changes, append a new row with the same `id`, updated `status` or `review.decision`, and a source ref to the prior entry or triggering artifact. Do not rewrite old rows. Keep raw evidence in source artifacts and store only compact references in the learning log.

## Dispositions

Every learning-log entry MUST use exactly one disposition:

| Disposition | Meaning | Allowed Next Action |
|---|---|---|
| `skip` | Evidence is too weak, speculative, duplicate, or not durable. | Keep only in source artifact or session notes. |
| `log_only` | Useful audit trail, but no durable memory or capability action yet. | Keep as learning-log evidence. |
| `project_memory_candidate` | Project-scoped constraint, convention, or recurring lesson. | Route through `.agent/fragments/memory-admission-protocol.md`; require source confidence. |
| `workflow_memory_candidate` | Workflow-specific tuning, failure, or guardrail. | Route to workflow memory or future `.agent/memory/workflows/*.md`. |
| `instinct_candidate` | Compact operational bad/good pattern. | Candidate for `.agent/memory/instincts.jsonl` after admission and source checks. |
| `kg_learning_candidate` | Durable lesson needs retrieval/search relationships. | Candidate for `.agent/learnings/*.md` plus KG registration after admission. |
| `draft_capability_candidate` | Learning is skill/workflow/agent/fragment/compound-shaped. | Route through classification and generated `${BMAD_HOME}/generated-*` rules. |
| `curator_recommendation` | Existing capability may need keep/pin/patch/merge/split/archive/rewrite. | Emit HSEA-1.2 Curator Recommendation Contract. |
| `evolution_fixture_candidate` | Evidence may become a training/evaluation case. | Defer to Evolution Lab stories; no promotion by itself. |
| `holdout_candidate` | Evidence should be preserved as a regression/holdout case. | Defer to Evolution Lab holdout policy; no promotion by itself. |

## Background Review Boundary

Background review may emit:

- a learning-log entry;
- a curator recommendation using `.agent/fragments/capability-authoring-curator-rules.md`;
- a generated candidate spec for a future active workflow;
- a reviewer-visible follow-up;
- a compact memory pointer after admission scoring.

Background review may not directly:

- write to `PROJECT.md` or `USER.md`;
- append to `.agent/memory/instincts.jsonl`;
- create `.agent/learnings/*.md` or KG/MemoryGraph nodes;
- create `${BMAD_HOME}/generated-*` drafts;
- update canonical `.agent/skills`, `.agent/workflows`, `.agent/agents`, or `.agent/fragments`;
- update `templates/`;
- promote, merge, archive, rewrite, or delete canonical assets.

An active foreground workflow may perform one of those actions only if its own instructions authorize the write and the relevant approval gates have passed.

## Scope, Sensitivity, and Retention

Scope rules:

- Every entry must name a project, story, workflow, source artifact, or target asset.
- Project-specific lessons stay project-scoped unless the user approves broader reuse.
- `USER.md` is for stable collaboration preferences only. Technical lessons do not promote there by default.
- Capability-shaped lessons route to generated capability governance instead of loose memory.

Sensitivity rules:

| Sensitivity | Handling |
|---|---|
| `public` | May be reused broadly if admission/classification gates pass. |
| `project` | Reuse inside the current project; broader promotion requires approval. |
| `private` | Keep source refs compact; do not promote globally without explicit approval. |
| `security-sensitive` | Do not embed raw evidence; require reviewer-visible handling and redaction before reuse. |

Status rules:

| Status | Meaning | Required Handling |
|---|---|---|
| `active` | Current evidence candidate. | Eligible for routing and review. |
| `resolved` | Follow-up action completed. | Preserve source refs and reviewer decision. |
| `promoted` | Entry drove an approved memory, capability, curator, or evolution action. | Preserve promotion target and reviewer decision in source refs or follow-up. |
| `stale` | Source or context may no longer apply. | Require review before reuse. |
| `superseded` | Newer entry replaces it. | Link or cite the newer source ref. |
| `sensitive` | Entry contains or points to sensitive evidence. | Limit reuse and require redaction review. |
| `archived` | Retained for audit but not active routing. | Keep recoverable; do not delete silently. |

## Routing Rules

Route in this order:

1. Run memory admission using `.agent/fragments/memory-admission-protocol.md`.
2. Classify the candidate as memory, skill, workflow, agent, fragment, compound, or unknown.
3. If capability-shaped, route through `.agent/fragments/draft-skill-creation-governance.md` and the create/enhance capability flows.
4. If it affects an existing capability, use the HSEA-1.2 Curator Recommendation Contract.
5. If it becomes a generated capability, use `.agent/fragments/capability-provenance-lineage.md`.
6. If it is evolution evidence, mark it as `evolution_fixture_candidate` or `holdout_candidate`; do not treat it as proof of correctness.

Frequency is a signal, not proof. Repeated evidence can raise priority and admission score, but it cannot bypass classification, validation, sensitivity review, or human approval gates.

## Evolution Lab Reuse

Future Evolution Lab workflows may select learning-log entries as:

- training examples for known failure modes;
- holdout cases for regression detection;
- negative examples from rejected or failed changes;
- score evidence for candidate comparison;
- source references for provenance and lineage.

Selection should consider confidence, sensitivity, recency, severity, reviewer decision, source refs, and whether the entry is stale or superseded. Evolution Lab candidates must still run independent validation and must not promote from learning-log frequency alone.
