# Evolution Lab Scoring, Novelty, Holdout, and Population Policy

> **Purpose:** Define how I-Wish scores Evolution Lab candidates, rewards useful novelty, protects holdouts, selects parents/recommendations, and records learning without implementing a runner.

Load `.agent/fragments/evolution-lab-core-model.md` before this fragment. This policy reuses HSEA-2.1 candidate states, `candidate.yaml`, `current_state`, target-specific packaging, and append-only lineage rules.

This fragment is contract-only. It does not create fixtures, mutate candidates, run evaluations, promote assets, install external engines, or copy Darwinian Evolver source code.

## Fitness Rubric

Fitness is a 100-point score. It measures whether a candidate is better than the baseline for the target objective.

| Dimension | Weight | Measures | Evidence |
|---|---:|---|---|
| Scenario pass rate | 25 | Candidate resolves trainable failure cases and expected scenario checks. | Fixture/scenario result IDs, pass/partial/fail counts, evaluator notes. |
| Holdout preservation | 20 | Candidate avoids regression on withheld cases. | Holdout summary only; do not expose holdout prompts/content to mutator. |
| Specificity/actionability | 15 | Candidate gives concrete, executable guidance rather than vague prose. | Reviewer rubric, checklist deltas, examples of clearer criteria. |
| Governance preservation | 15 | Candidate preserves I-Wish safety, approval, source, and human review gates. | Structural validation, authority checks, no removed constraints. |
| Brevity/token discipline | 10 | Candidate improves signal without unnecessary length or context bloat. | Token/line delta, duplicated section check, removed fluff. |
| Project fit | 10 | Candidate respects project memory, story scope, persona, and domain context. | Source refs, PROJECT.md/config refs when available, reviewer notes. |
| Reviewer confidence | 5 | Human or review workflow can explain why the candidate should proceed. | Reviewer reason and confidence score. |

Minimum machine-readable fitness summary:

```yaml
fitness:
  total: 0
  max: 100
  dimensions:
    scenario_pass_rate: {score: 0, max: 25, evidence_refs: []}
    holdout_preservation: {score: 0, max: 20, evidence_refs: []}
    specificity_actionability: {score: 0, max: 15, evidence_refs: []}
    governance_preservation: {score: 0, max: 15, evidence_refs: []}
    brevity_token_discipline: {score: 0, max: 10, evidence_refs: []}
    project_fit: {score: 0, max: 10, evidence_refs: []}
    reviewer_confidence: {score: 0, max: 5, evidence_refs: []}
  source_sensitivity:
    level: "public|internal|private|security_sensitive|mixed|unknown"
    curator_approval_required: false
    curator_approval_status: "not_required|pending|approved|rejected"
    evidence_refs: []
  baseline_total: 0
  score_delta: 0
```

Baseline comparison rule:

- Evaluate baseline and candidate with the same visible trainable cases and the same scoring rubric.
- Do not compare a candidate's train score to a baseline's holdout score.
- A candidate that cannot be compared to baseline receives `reviewer_confidence <= 2` until evidence exists.

## Novelty Rubric

Novelty is separate from fitness. It is capped when contributing to selection.

| Novelty Signal | Score |
|---|---:|
| Solves a failure through a materially clearer structure or missing validation gate | 8-10 |
| Reduces context load while preserving or improving behavior | 5-7 |
| Converts vague advice into checkable criteria | 5-7 |
| Adds a useful alternate path without weakening governance | 3-5 |
| Renames sections, reorders prose, or changes tone only | 0-2 |
| Adds length without measurable coverage gain | -3-0 |
| Removes constraints, hides uncertainty, or weakens safety while appearing novel | Blocker |

Novelty summary:

```yaml
novelty:
  score: 0
  cap_for_selection: 10
  material_difference_refs: []
  cosmetic_change_refs: []
  verdict: "material|minor|cosmetic|negative|blocked"
```

Novelty must never compensate for:

- holdout failure;
- safety regression;
- removed human approval gate;
- exposed private/security-sensitive evidence;
- copied AGPL/source-derived structure;
- hidden uncertainty or overconfident claims.

## Regression and Holdout Policy

Holdout cases are withheld from the mutator and candidate body. They may be summarized in evaluation outputs only after scoring.

Blocking regressions:

- safety/governance gate removed or weakened;
- evidence discipline weakened;
- private/security-sensitive evidence embedded in candidate body;
- holdout prompt/content leaked into trainable context;
- candidate copies AGPL source text or source-derived implementation structure;
- candidate changes target type packaging so promotion cannot preserve original shape.

Regression penalties:

| Category | Penalty | Result |
|---|---:|---|
| Critical safety/governance regression | 100 | Candidate moves to `rejected`. |
| Holdout failure on core behavior | 50-80 | Candidate usually moves to `rejected`; reviewer may keep as archived learning only. |
| Specificity/actionability regression | 10-30 | Candidate may remain viable only if train/holdout gains justify it. |
| Brevity/token bloat without coverage gain | 5-20 | Penalize selection score; may mark novelty negative. |
| Project-fit mismatch | 10-40 | Penalize or reject depending on severity. |

Regression summary:

```yaml
regression:
  penalty: 0
  blockers: []
  holdout_result: "not_run|passed|failed|blocked"
  leaked_holdout: false
  safety_regression: false
  reviewer_required: true
```

## Population Selection

Evaluation thresholds:

```yaml
evaluation_thresholds:
  minimum_train_fitness: 70
  minimum_train_score_delta: 5
  minimum_holdout_score: 15
  minimum_reviewer_confidence_for_holdout: 3
  minimum_reviewer_confidence_for_recommendation: 4
  holdout_required_for_recommendation: true
  maximum_regression_penalty_for_recommendation: 0
  required_curator_approval_levels: ["private", "security_sensitive", "mixed"]
  experiment_override_fields:
    - minimum_train_fitness
    - minimum_train_score_delta
    - minimum_holdout_score
    - minimum_reviewer_confidence_for_holdout
    - minimum_reviewer_confidence_for_recommendation
    - holdout_required_for_recommendation
    - maximum_regression_penalty_for_recommendation
```

Threshold rules:

- Use the defaults above unless `experiment.yaml` declares explicit overrides for the named `experiment_override_fields`.
- A candidate reaches `holdout_evaluated` only when `fitness.total >= minimum_train_fitness`, `score_delta >= minimum_train_score_delta`, and `reviewer_confidence >= minimum_reviewer_confidence_for_holdout`.
- A candidate reaches `recommended` only when `holdout_preservation.score >= minimum_holdout_score`, `holdout_result == passed`, `regression.penalty <= maximum_regression_penalty_for_recommendation`, `reviewer_confidence >= minimum_reviewer_confidence_for_recommendation`, and any required curator approval is `approved`.

Selection does not promote. It chooses parents for future mutation or recommends candidates for human review.

Default formula:

```text
selection_score = fitness.total + min(novelty.score, 10) - regression.penalty + lineage_diversity_bonus
```

Lineage diversity bonus:

| Condition | Bonus |
|---|---:|
| Candidate comes from an underrepresented parent branch and passes holdout | +1 to +5 |
| Candidate solves a distinct failure class from current leader | +1 to +5 |
| Candidate only duplicates existing successful branch | 0 |
| Candidate shares rejected ancestor pattern without fixing rejection reason | -5 to 0 |

Parent selection rules:

- Keep at least one high-fitness candidate and one materially different viable candidate when both pass holdouts.
- Do not select parents with unresolved sensitive/private source warnings unless curator-approved.
- Do not select a candidate solely because it is longest, newest, or most different.
- Keep rejected candidates in population history, but do not sample them as parents unless the mutation explicitly addresses the rejection reason.
- A single high score does not authorize canonical overwrite; promotion remains HSEA-3.3.

Minimum machine-readable selection summary:

```yaml
selection:
  selection_score: 0
  lineage_diversity_bonus: 0
  recommendation_category: "recommend|retry_with_constraints|archive_as_learning|reject|needs_human_review"
  lineage_decision: "continue|reject|recommend|archive"
  target_state: "train_evaluated|holdout_evaluated|recommended|rejected|archived"
  source_sensitivity:
    level: "public|internal|private|security_sensitive|mixed|unknown"
    curator_approval_required: false
    curator_approval_status: "not_required|pending|approved|rejected"
  reviewer_confidence_gate_passed: false
```

Recommendation categories:

```text
recommend
retry_with_constraints
archive_as_learning
reject
needs_human_review
```

Category mapping rules:

- `recommend` -> `lineage_decision: recommend` and `target_state: recommended`
- `retry_with_constraints` -> `lineage_decision: continue` and `target_state` stays at the latest evaluated non-terminal state
- `archive_as_learning` -> `lineage_decision: archive` and `target_state: archived`
- `reject` -> `lineage_decision: reject` and `target_state: rejected`
- `needs_human_review` -> `lineage_decision: continue` and `target_state` stays at the latest evaluated non-terminal state until reviewer resolution

## Learning Log Contract

Every continued, rejected, archived, or recommended candidate outcome appends a learning entry.

Minimum `learning-log.jsonl` event:

```json
{
  "ts": "YYYY-MM-DD",
  "experiment_id": "<experiment-id>",
  "candidate_id": "<candidate-id>",
  "parent_id": "<parent-id>",
  "target_asset": ".agent/skills/example/SKILL.md",
  "parent_score": 0,
  "candidate_score": 0,
  "score_delta": 0,
  "novelty_score": 0,
  "regression_penalty": 0,
  "holdout_result": "not_run|passed|failed|blocked",
  "selection_score": 0,
  "recommendation_category": "recommend|retry_with_constraints|archive_as_learning|reject|needs_human_review",
  "lineage_decision": "continue|reject|recommend|archive",
  "target_state": "train_evaluated|holdout_evaluated|recommended|rejected|archived",
  "source_sensitivity": {
    "level": "public|internal|private|security_sensitive|mixed|unknown",
    "curator_approval_required": false,
    "curator_approval_status": "not_required|pending|approved|rejected"
  },
  "lesson_category": "overfit|unsafe|bloated|style_only|material_improvement|project_mismatch|holdout_regression|governance_preserved",
  "reviewer": "human|agent|workflow-id",
  "reason": "<compact reason>",
  "source_refs": []
}
```

Learning rules:

- Record score deltas for rejected candidates too.
- Feed only relevant learning summaries into later mutation rounds.
- Do not feed holdout content into mutation prompts.
- Mark repeated rejection reasons so future mutations can avoid them.

## State and Lineage Integration

Scoring may update `candidate.yaml` and `experiment.yaml` `current_state` only after appending a lineage event.

State transitions owned by this policy:

| Scoring Result | State Transition |
|---|---|
| Structural checks passed and train score produced | `structurally_validated` -> `train_evaluated` |
| Train score below `minimum_train_fitness`, score delta below `minimum_train_score_delta`, reviewer confidence below `minimum_reviewer_confidence_for_holdout`, or blocker found | current state -> `rejected` |
| Train score passes all holdout-entry thresholds and holdout runs | `train_evaluated` -> `holdout_evaluated` |
| Holdout passes, recommendation thresholds pass, and required curator approval is resolved | `holdout_evaluated` -> `recommended` |
| Holdout fails or critical regression appears | current state -> `rejected` |
| Candidate receives `archive_as_learning` | current state -> `archived` |
| Candidate receives `retry_with_constraints` or `needs_human_review` | current state remains unchanged and a lineage event records `decision: continue` |

Lineage event score fields:

```json
"score_summary": {
  "fitness": 0,
  "novelty": 0,
  "regression_penalty": 0,
  "selection_score": 0,
  "score_delta": 0
}
```

When `current_state` and `lineage.jsonl` disagree, the candidate is invalid until reviewer reconciliation follows `.agent/fragments/evolution-lab-core-model.md`.

## Anti-Gaming Rules

Block or penalize candidates that:

- improve visible/trainable cases by embedding holdout clues;
- remove approval, security, privacy, source, or review gates;
- replace specific checks with broad inspirational prose;
- inflate length without measurable scenario or holdout gain;
- hide uncertainty or overclaim confidence;
- collapse multiple personas/domains into one generic rule;
- bury source references or provenance in body text;
- copy external source text or source-derived structure from AGPL materials;
- pass trainable cases while reducing project fit or reviewer confidence.

## Downstream Handoff

HSEA-3.1 fixture packs must provide:

- trainable case IDs;
- holdout case IDs;
- expected pass/partial/fail/regression signals;
- source refs;
- sensitivity level;
- whether the case can be shown to mutator.

HSEA-3.2 trial execution must calculate:

- baseline fitness;
- candidate fitness;
- score delta;
- novelty score;
- regression penalty;
- selection score;
- holdout result;
- source sensitivity and curator approval status;
- recommendation category;
- lineage decision mapping;
- learning-log event;
- lineage event and `current_state` update using the category mapping rules above.

HSEA-3.3 promotion/rollback remains the only story authorized to approve canonical asset updates.
