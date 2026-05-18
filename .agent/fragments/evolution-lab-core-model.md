# Evolution Lab Core Model

> **Purpose:** Define the I-Wish-native model for evolving skills, workflows, checklists, story templates, and governance fragments through measured candidate experiments.

This fragment is contract-only. It does not implement a mutator, scoring formula, external engine adapter, production source-code evolution, or automatic promotion.

## Core Principles

- Use clean-room behavioral absorption only. Do not copy, vendor, translate, or structurally mirror AGPL Darwinian Evolver source code.
- Keep canonical `.agent/` assets immutable during experiments. Evolution candidates must live outside canonical runtime paths until an explicit promotion story/gate approves them.
- Optimize from concrete failure evidence, not vague "make better" prompts.
- Keep trainable cases and holdout cases separate.
- Preserve rejected candidates and failed mutations as learning evidence.
- Treat provenance count as context, not correctness. Validation, scorecards, holdouts, and human review own correctness.
- Keep candidate bodies lean. Store raw evidence behind references, not inside evolved skill/workflow/checklist bodies.

## Core Vocabulary

| Concept | I-Wish Meaning | Artifact / Responsibility |
|---|---|---|
| `target_asset` | Canonical or generated I-Wish asset being considered for improvement. | Repo-relative path such as `.agent/skills/...`, `.agent/workflows/...`, `.agent/fragments/...`, or story template path. |
| `organism` | A versioned candidate artifact package that can be evaluated and compared. | Candidate directory under `${IWISH_HOME}/evolution-lab/<experiment-id>/candidates/<candidate-id>/`. |
| `candidate` | A proposed child version of the target asset. | Candidate body plus `metadata.yaml`, `lineage.jsonl`, and evaluation outputs. |
| `baseline` | The parent/current target version used for comparison. | Baseline snapshot under the experiment directory. |
| `failure_case` | Concrete evidence of a missed edge case, bad guidance, user correction, review finding, failed scenario, bug, or regression. | Referenced by ID/path from memory, issue/story/review artifacts, or trial fixtures. |
| `trainable_case` | Failure/evaluation case visible to the mutator. | Fixture metadata owned by HSEA-3.1 and scoring policy owned by HSEA-2.2. |
| `holdout_case` | Withheld case used to detect overfitting/regression. | Fixture metadata owned by HSEA-3.1; never embedded in mutation prompts. |
| `constraint` | Structural, safety, size, scope, or governance rule a candidate must satisfy before evaluation/promotion. | Constraint checklist in experiment manifest and candidate validation report. |
| `mutator` | Human or LLM-assisted proposal mechanism that creates a child candidate from parent + selected trainable cases. | Future runner/workflow responsibility; not implemented by HSEA-2.1. |
| `evaluator` | Rubric, scenario runner, checklist, reviewer, or validation workflow that scores candidates. | HSEA-2.2 defines scoring; HSEA-3.2 executes trial scorecards. |
| `scorecard` | Structured evaluation result comparing baseline and candidate. | Candidate `evaluation-report.md` and machine-readable summary. |
| `population` | Set of candidates, baselines, score histories, and lineage relationships for an experiment. | Experiment manifest plus candidate directories and append-only logs. |
| `lineage` | Append-only record of candidate state changes and parent/child relationships. | `lineage.jsonl`; follows `.agent/fragments/capability-provenance-lineage.md`. |
| `learning_log` | Compact record of attempted mutations, score deltas, decisions, and lessons for future iterations. | Experiment-level `learning-log.jsonl`. |
| `promotion_recommendation` | Human-readable recommendation to promote, reject, retry, split, or archive a candidate. | Candidate `promotion-recommendation.md`; promotion execution belongs to HSEA-3.3. |

## Experiment Layout

Evolution Lab artifacts live outside canonical runtime paths:

```text
${IWISH_HOME}/evolution-lab/
  <experiment-id>/
    experiment.yaml
    baseline/
      target-snapshot.md
      baseline-metadata.yaml
    fixtures/
      trainable-cases.yaml
      holdout-cases.yaml
    candidates/
      <candidate-id>/
        candidate.yaml
        body/
          <original-relative-path-or-filename>.md
        metadata.yaml
        lineage.jsonl
        structural-validation.md
        evaluation-report.md
        promotion-recommendation.md
    learning-log.jsonl
    population-summary.md
```

Generated capability drafts may also use the `${IWISH_HOME}/generated-*` layout from `.agent/fragments/capability-provenance-lineage.md`. In both layouts, canonical `.agent/` files are read-only until a later promotion gate approves a controlled write.

## Experiment Manifest

Every experiment MUST include `experiment.yaml`:

```yaml
id: "<experiment-id>"
story: "STORY-HSEA-2.1"
target_asset:
  path: ".agent/skills/example/SKILL.md"
  type: "SKILL|WORKFLOW|CHECKLIST|STORY_TEMPLATE|FRAGMENT"
baseline:
  snapshot: "baseline/target-snapshot.md"
candidates:
  - candidate_id: "<candidate-id>"
    parent_id: "<baseline-or-parent-candidate-id>"
    target_asset:
      path: ".agent/skills/example/SKILL.md"
      type: "SKILL|WORKFLOW|CHECKLIST|STORY_TEMPLATE|FRAGMENT"
      original_filename: "SKILL.md"
      body_path: "candidates/<candidate-id>/body/SKILL.md"
      frontmatter_preserved: true
    current_state: "proposed"
    allowed_states:
      - proposed
      - drafted
      - structurally_validated
      - train_evaluated
      - holdout_evaluated
      - rejected
      - recommended
      - promoted
      - rolled_back
      - archived
    state_source: "candidates/<candidate-id>/lineage.jsonl"
    latest_lineage_event: null
scope:
  mode: "markdown-first"
  production_source_code: "deferred"
  external_engine: "not-enabled"
legal:
  darwinian_evolver_source_import: "forbidden"
evidence_policy:
  memory_admission: ".agent/fragments/memory-admission-protocol.md"
  provenance_lineage: ".agent/fragments/capability-provenance-lineage.md"
  graph_policy: ".agent/fragments/graph-backend-selection-policy.md"
constraints:
  canonical_write: "forbidden-until-promotion"
  raw_evidence_in_body: "forbidden"
  holdout_visible_to_mutator: false
downstream_owner:
  scoring_policy: "STORY-HSEA-2.2"
  external_reference: "STORY-HSEA-2.3"
  fixtures: "STORY-HSEA-3.1"
  trial_run: "STORY-HSEA-3.2"
  promotion_rollback: "STORY-HSEA-3.3"
```

Each candidate MUST also include `candidate.yaml` with the same machine-readable state fields as the matching `experiment.yaml` `candidates[]` entry. `current_state` is the fast-read state for tools and reviewers; `lineage.jsonl` remains the append-only source of audit history. When they disagree, the candidate is invalid until a reviewer reconciles the manifest by appending a lineage event and updating `current_state`.

## Target-Specific Candidate Packaging

Candidate packages must preserve enough target shape to make later promotion mechanical:

| Target Type | Candidate Body Rule | Preservation Rule |
|---|---|---|
| `SKILL` | Store as `body/SKILL.md` unless the source skill used another filename. | Preserve YAML frontmatter, trigger/description fields, and original section ordering unless mutation rationale explicitly changes them. |
| `WORKFLOW` | Store as `body/<original-workflow-filename>.md`. | Preserve workflow frontmatter, command metadata, wrapper/runtime notes, and I-Wish authority blocks. |
| `CHECKLIST` | Store as `body/<original-checklist-filename>.md`. | Preserve checklist identifiers, scoring rows, required fields, and source-of-truth references. |
| `STORY_TEMPLATE` | Store as `body/<original-template-filename>.md`. | Preserve placeholders, frontmatter, required sections, and output contract fields. |
| `FRAGMENT` | Store as `body/<original-fragment-filename>.md`. | Preserve heading anchors, machine-readable enums, and referenced paths. |

Do not collapse all target types into a generic `candidate.md` for evaluation. A generic rendered preview may be added, but it cannot replace the typed body file.

## Candidate Lifecycle

Allowed candidate states:

```text
proposed
drafted
structurally_validated
train_evaluated
holdout_evaluated
rejected
recommended
promoted
rolled_back
archived
```

Allowed transition outline:

| From | To | Required Evidence |
|---|---|---|
| `proposed` | `drafted` | Parent asset, selected trainable cases, mutation rationale. |
| `drafted` | `structurally_validated` | Required files present; no canonical write; lean-body check passes. |
| `drafted` | `rejected` | Missing required files, invalid package shape, forbidden canonical write, AGPL/source-copy risk, leaked holdout, or lean-body failure. |
| `structurally_validated` | `train_evaluated` | Trainable cases scored by HSEA-2.2 policy. |
| `structurally_validated` | `rejected` | Safety, scope, sensitivity, graph-evidence, provenance, or constraint failure discovered before scoring. |
| `train_evaluated` | `holdout_evaluated` | Candidate passes minimum train threshold; holdout remains hidden from mutator. |
| `holdout_evaluated` | `recommended` | No blocking holdout regression; reviewer confidence recorded. |
| Any evaluated state | `rejected` | Failed constraint, train score, holdout preservation, safety, scope, or reviewer decision. |
| `recommended` | `promoted` | Later promotion story/gate approves canonical update. |
| `promoted` | `rolled_back` | Later rollback governance records regression or user rejection. |
| Any terminal state | `archived` | Human or governance decision to retire candidate. |

Every transition MUST append a `lineage.jsonl` event. Do not rewrite prior lineage rows.

Minimum lineage event fields:

```json
{
  "ts": "YYYY-MM-DD",
  "candidate_id": "<candidate-id>",
  "parent_id": "<parent-id-or-null>",
  "child_id": "<child-id-or-null>",
  "from_state": "drafted",
  "to_state": "structurally_validated",
  "evaluator": "Vegeta|Hit|Whis|workflow-id|human",
  "score_summary": {"fitness": null, "novelty": null, "regression_penalty": null},
  "holdout_result": "not_run|passed|failed|blocked",
  "decision": "continue|reject|recommend|promote|rollback|archive",
  "reason": "<compact reason>",
  "source_refs": ["STORY-HSEA-2.1"]
}
```

## Structural Validation

Before evaluation, every candidate MUST pass these checks:

- Candidate files live outside canonical `.agent/` runtime paths.
- Required metadata and lineage files exist.
- Candidate body contains operational rules only, not raw transcripts, graph dumps, or long source artifacts.
- Source refs use repo-relative paths, story IDs, bug IDs, graph IDs, URLs approved by source artifacts, or `${IWISH_HOME}` paths.
- Private/security-sensitive evidence is not embedded in distributable bodies.
- Holdout cases are not visible to the mutator or candidate body.
- Scope remains markdown/governance only unless a later story explicitly expands scope.
- No AGPL source text or source-derived implementation structure is copied.

## Evidence and Context Selection

Use `.agent/fragments/memory-admission-protocol.md` before converting feedback into evolution evidence:

- Durable, high-confidence failures may become `failure_case` refs.
- Capability-shaped learnings route through generated capability/evolution paths, not loose memory.
- Raw logs and easy-to-rediscover facts remain source refs, not mutation context dumps.

Use `.agent/fragments/capability-provenance-lineage.md` for candidate provenance:

- Record source nodes, source artifacts, sensitivity, confidence, parent IDs, generation, and approval state.
- Rejected mutations and holdout failures remain useful negative examples.

Use `.agent/fragments/graph-backend-selection-policy.md` for graph-backed evidence:

- `MemoryGraph` may help retrieve prior lessons and candidate lineage.
- `FeatureGraph` may help identify feature/data validation impact.
- `CodebaseGraph` may help reason about workflow/code-adjacent blast radius.
- Missing, stale, partial, or unsupported graph evidence means `graph evidence unavailable`, not `no impact`.

Any source marked stale, superseded, low-confidence, private, or security-sensitive MUST produce a reviewer-visible caution and may not be treated as authoritative without curator approval.

## Clean-Room and Scope Boundaries

Allowed in the first lab scope:

- `.agent/skills/**/SKILL.md`
- `.agent/workflows/**/*.md`
- `.agent/fragments/**/*.md`
- quality checklists
- story templates and governance docs
- generated capability drafts under `${IWISH_HOME}/generated-*`

Deferred:

- production application source-code evolution;
- unattended continuous evolution;
- automatic canonical `.agent/` rewrites;
- exact DSPy/GEPA implementation;
- Darwinian Evolver external-engine adapter;
- any required dependency on AGPL code.

Darwinian Evolver may be used as an external conceptual reference for parent selection, failure-case sampling, novelty tuning, and population diversity only under HSEA-2.3 boundaries.

## Downstream Story Boundaries

| Story | Owns |
|---|---|
| `STORY-HSEA-2.2` | Fitness dimensions, novelty scoring, holdout weighting, regression penalties, parent/population selection, score delta fields. |
| `STORY-HSEA-2.3` | Darwinian external-reference criteria, legal/product review boundaries, optional external adapter rules. |
| `STORY-HSEA-3.1` | Concrete trial fixtures and train/holdout cases for initial assets. |
| `STORY-HSEA-3.2` | Running the trial, comparing candidates to baseline, producing empirical scorecards. |
| `STORY-HSEA-3.3` | Promotion, rollback, archival, and canonical asset update governance. |

HSEA-2.1 must not absorb the responsibilities above except by naming the boundary.

## Initial Trial Target Examples

These are examples only; HSEA-3.1 owns fixtures.

| Target Class | Example Asset | Why Useful |
|---|---|---|
| Repo absorption | `.agent/skills/repo-absorption/SKILL.md`, `.agent/workflows/absorb-repo.md` | Exercises trust gates, artifact completeness, source intake, and override handling. |
| Security guardian | `.agent/skills/security-guardian/SKILL.md` | Exercises evidence discipline, severity calibration, false-positive control, and refusal to overclaim. |
| UX quality/checklist | `.agent/skills/ux-pro-max/SKILL.md`, `docs/ux-pro-max-integration/quality-checklist.md` | Exercises specificity, edge-case coverage, persona-aware guidance, and reduction of vague advice. |

## Non-Goals

- Do not define final numeric scoring weights here.
- Do not define final novelty formula here.
- Do not generate train/holdout fixtures here.
- Do not run candidate trials here.
- Do not promote or roll back candidates here.
- Do not install, vendor, or require external evolutionary engines here.
