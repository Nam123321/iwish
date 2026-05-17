# Capability Provenance and Lineage

> **Purpose:** Preserve why a generated BMAD capability exists, what evidence produced it, and how it evolves over time without bloating the capability body.

Use this fragment for generated skills, workflows, agents, fragments, and compound capability drafts created or updated from memorygraph/KG evidence, instincts, learning logs, bug fixes, review findings, user corrections, curator recommendations, absorbed repos, or evolution trials.

This fragment is contract-only. It does not authorize FeatureGraph/FalkorDB writes, automatic source polling, evolution runner behavior, auto-promotion, or direct canonical `.agent/` mutation.

## Core Rules

- Provenance belongs in `metadata.yaml` and `lineage.jsonl`, not in long-form capability bodies.
- Capability bodies must stay operational: rules, triggers, anti-patterns, validation notes, and concise context only.
- Raw memorygraph dumps, session transcripts, bug reports, review logs, or source artifacts must be referenced, not embedded.
- Lineage is append-only. Add events; do not rewrite or delete prior events.
- Provenance count is not proof of correctness. Independent validation, holdouts, scorecards, and human review own correctness.
- Any source marked stale, superseded, low-confidence, private, or security-sensitive must trigger curator/evolution review before the capability is treated as authoritative.

## Draft File Layout

Generated drafts MUST start under `${BMAD_HOME}/generated-*`:

```text
${BMAD_HOME}/generated-skills/<name>/SKILL.md
${BMAD_HOME}/generated-skills/<name>/metadata.yaml
${BMAD_HOME}/generated-skills/<name>/lineage.jsonl
${BMAD_HOME}/generated-skills/<name>/promotion-plan.md

${BMAD_HOME}/generated-workflows/<name>/<name>.md
${BMAD_HOME}/generated-workflows/<name>/metadata.yaml
${BMAD_HOME}/generated-workflows/<name>/lineage.jsonl
${BMAD_HOME}/generated-workflows/<name>/promotion-plan.md

${BMAD_HOME}/generated-agents/<name>/<name>.md
${BMAD_HOME}/generated-agents/<name>/metadata.yaml
${BMAD_HOME}/generated-agents/<name>/lineage.jsonl
${BMAD_HOME}/generated-agents/<name>/promotion-plan.md
```

Canonical promoted assets may keep `metadata.yaml` and `lineage.jsonl` beside the asset only when the promotion plan explicitly approves it. Otherwise, the canonical asset should point back to the runtime provenance store.

## Metadata Contract

Every generated `metadata.yaml` MUST include this provenance-ready shape:

```yaml
id: "<capability-id>"
type: "SKILL|WORKFLOW|AGENT|FRAGMENT|COMPOUND"
status: "draft|promoted|archived|superseded|rejected"
origin:
  type: "memorygraph-derived|curator-recommendation|bug-fix|code-review|user-correction|evolution-lab|external-absorption|manual"
  created_by: "create-skill|enhance-skill|evolution-lab|manual"
  created_at: "YYYY-MM-DD"
  source_story: "<story-id-or-null>"
provenance:
  source_nodes:
    - id: "<memorygraph-or-kg-node-id>"
      type: "Instinct|Learning|Bug|ReviewFinding|UserCorrection|CuratorRecommendation|EvolutionCase|ExternalSource"
      confidence: 1-10
      sensitivity: "public|project|private|security-sensitive"
      ref: "<repo-relative path, story id, bug id, graph id, or ${BMAD_HOME} artifact>"
      status: "active|stale|superseded|low-confidence|sensitive"
  source_clusters:
    - ctx: "<tag>"
      count: 1
      max_severity: 1-5
  source_artifacts:
    - "<repo-relative path or ${BMAD_HOME} artifact>"
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

## Source Rules

Source fields use these contracts:

| Field | Rule |
|---|---|
| `source_nodes[].type` | MUST be one of `Instinct`, `Learning`, `Bug`, `ReviewFinding`, `UserCorrection`, `CuratorRecommendation`, `EvolutionCase`, `ExternalSource`. |
| `source_nodes[].confidence` | MUST be `1-10`; values below `7` require reviewer-visible caution. |
| `source_nodes[].sensitivity` | MUST be `public`, `project`, `private`, or `security-sensitive`. |
| `source_nodes[].status` | MUST be `active`, `stale`, `superseded`, `low-confidence`, or `sensitive`. |
| `source_artifacts[]` | MUST use repo-relative paths, story/bug/review IDs, graph IDs, URLs approved by source artifacts, or `${BMAD_HOME}` paths. |

If a source status is `stale`, `superseded`, `low-confidence`, or `sensitive`, or if source sensitivity is `private` or `security-sensitive`, produce a curator/evolution review recommendation using `.agent/fragments/capability-authoring-curator-rules.md`.

## Lineage Contract

Every generated draft MUST include `lineage.jsonl`. Every row MUST be compact JSON with this shape:

```json
{
  "ts": "YYYY-MM-DD",
  "event": "candidate_created",
  "capability_id": "capability@gen1",
  "parent_id": "capability@gen0",
  "child_id": "capability@gen1",
  "source_failures": ["BUG-001"],
  "source_refs": ["STORY-HSEA-1.2b"],
  "score_delta": null,
  "holdout_result": "not_run",
  "reviewer": null,
  "decision": "draft",
  "reason": "created from validated recurring failure"
}
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

- Append new events only.
- Do not rewrite or delete old lineage rows.
- Use compact IDs and refs, not raw evidence dumps.
- Include `score_delta` and `holdout_result` even when the values are `null` or `not_run`.
- Preserve rejected candidates and holdout failures as negative examples for future evolution.
- Record reviewer decision and reason whenever a human or review workflow accepts, rejects, rolls back, merges, archives, or rewrites a candidate.

## Curator and Evolution Routing

Load `.agent/fragments/capability-authoring-curator-rules.md` alongside this fragment.

Use the Curator Recommendation Contract when:

- any provenance source is stale, superseded, low-confidence, private, or security-sensitive;
- a capability references a rejected mutation or holdout failure that still affects current behavior;
- provenance points to duplicate or conflicting source clusters;
- a generated draft lacks required metadata or lineage fields.

Future evolution-lab workflows may use provenance and lineage to retrieve failure cases, train cases, holdouts, rejected mutations, and parent candidates. They must still run independent validation and must not promote a candidate from provenance frequency alone.

## FeatureGraph/FalkorDB Boundary

BMAD FeatureGraph is FalkorDB-backed. This fragment defines file contracts and references only.

Do not create FeatureGraph/FalkorDB nodes from this fragment unless the active story explicitly introduces DataEntity, Event, SeedData, or graph-indexing behavior. If a later story adds that behavior, follow ADR-002 and use the relevant FeatureGraph tools or `GRAPH.QUERY featuregraph` path approved by that workflow.
