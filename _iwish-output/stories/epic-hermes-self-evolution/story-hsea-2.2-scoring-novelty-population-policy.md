---
story_id: "STORY-HSEA-2.2"
epic_id: "EPIC-HSEA"
title: "Define Scoring, Novelty, Holdout, and Population Policy"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-2.1"]
blocks: ["STORY-HSEA-3.1", "STORY-HSEA-3.2"]
phase: "forge"

---
# Story HSEA-2.2: Define Scoring, Novelty, Holdout, and Population Policy

## 1. Objective

Define how I-Wish scores Evolution Lab candidates, separates fitness from novelty, protects holdout cases, penalizes regressions, selects parents/recommendations from a population, and records score deltas for future learning.

## 1.1 Context

HSEA-2.1 defined the Evolution Lab core model: candidate packaging, `candidate.yaml`, `current_state`, lineage, typed target preservation, clean-room boundaries, and downstream ownership. HSEA-2.2 must define the scoring and population policy that later fixture and trial stories will use. It must not implement a runner, create fixtures, mutate assets, or promote candidates.

The user explicitly requested a plan to test, learn, and improve scoring/novelty-to-population behavior. This story makes that measurable before any runner or automated evolution is promoted.

**Required upstream model:** Load `.agent/fragments/evolution-lab-core-model.md` before defining scoring, novelty, holdout, or population policy. HSEA-2.2 must reuse the candidate states, candidate manifest/current-state contract, lineage event shape, target-specific packaging rules, and downstream boundaries from HSEA-2.1 instead of redefining them.

**Source artifacts:**
- `.agent/fragments/evolution-lab-core-model.md`
- `.agent/fragments/capability-provenance-lineage.md`
- `.agent/fragments/memory-admission-protocol.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.1-evolution-lab-core-model.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/self-evolution-analysis.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/darwinian-evolver-research.md`
- `${IWISH_HOME}/absorbed-repos/hermes-agent/iwish-evolution-lab-trial-plan.md`

**Target integration surface:**
- A reusable scoring/novelty/population policy fragment or documentation artifact.
- Pointer-level handoff for HSEA-3.1 fixture creation and HSEA-3.2 trial execution.
- Story record and sprint tracker.

## 2. User Story

As a I-Wish reviewer,  
I want scoring and novelty rules that distinguish real improvement from cosmetic rewrites,  
So that evolved skills/workflows become more effective across edge cases without weakening governance or overfitting to the latest failure.

## 3. Acceptance Criteria

### AC1: Fitness Dimensions Are Weighted
**Given** a candidate is evaluated  
**When** scoring occurs  
**Then** it uses a 100-point fitness rubric covering scenario pass rate, holdout preservation, specificity/actionability, governance preservation, brevity/token discipline, project fit, and reviewer confidence  
**And** the rubric states what each dimension measures and how it is evidenced.

### AC2: Novelty Is Separate From Fitness
**Given** a candidate differs from its parent  
**When** novelty is scored  
**Then** novelty is calculated separately from fitness  
**And** it rewards materially different solutions to failure cases while penalizing cosmetic rewrites, style churn, or longer text without coverage gain.

### AC3: Holdout and Regression Policy Exists
**Given** a candidate improves trainable cases  
**When** holdout cases run  
**Then** withheld-case regression blocks promotion or applies a heavy regression penalty  
**And** holdout cases must not be visible to the mutator or candidate body.

### AC4: Population Selection Is Defined
**Given** multiple candidates exist in an experiment  
**When** selecting parents or recommendations  
**Then** the policy considers fitness, bounded novelty, regression penalty, lineage diversity, reviewer confidence, and source sensitivity  
**And** it prevents a single lucky candidate from overwriting the canonical asset.

### AC5: Learning Loop Captures Score Deltas
**Given** a candidate is accepted, rejected, archived, or recommended  
**When** the decision is recorded  
**Then** the learning log captures parent score, candidate score, score delta, novelty score, regression penalty, holdout result, reviewer reason, and lesson category.

### AC6: Anti-Gaming and Safety Rules Are Defined
**Given** a candidate can improve apparent metrics  
**When** it increases length, removes constraints, hides uncertainty, weakens safety gates, or optimizes for trainable cases only  
**Then** the policy penalizes or blocks it even if some scenario pass rate improves.

### AC7: State and Lineage Integration Is Explicit
**Given** scoring changes candidate state  
**When** a scorecard is produced  
**Then** it updates `candidate.yaml` / `experiment.yaml` `current_state` only through append-only lineage events  
**And** it uses HSEA-2.1 states without redefining state names.

### AC8: Downstream Boundaries Are Preserved
**Given** later stories create fixtures and run trials  
**When** HSEA-2.2 is complete  
**Then** HSEA-3.1 owns concrete train/holdout fixtures  
**And** HSEA-3.2 owns executing scorecards and comparing empirical trial results.

## 4. Tasks

### T1: Define 100-Point Fitness Rubric
- Define weighted dimensions and evidence requirements.
- Include baseline comparison rules.
- Define minimum fields for a machine-readable fitness summary.

### T2: Define Novelty Rubric and Anti-Gaming Rules
- Define novelty score separately from fitness.
- Reward material new solutions, missing validation gates, clearer structure, and context-load reduction.
- Penalize cosmetic rewrites, style churn, verbosity, constraint removal, and ungrounded confidence.

### T3: Define Holdout and Regression Policy
- Define holdout isolation rules.
- Define blocking regression cases.
- Define regression penalty categories and when a candidate moves to `rejected`.

### T4: Define Population Selection Policy
- Define parent selection and recommendation formula.
- Include bounded novelty, regression penalty, lineage diversity, reviewer confidence, and sensitivity review.
- Define conditions for maintaining multiple viable candidates instead of recommending one.

### T5: Define Learning-Log and Lineage Fields
- Define score delta fields.
- Define lesson categories for accepted/rejected candidates.
- Require append-only lineage events and `current_state` reconciliation with HSEA-2.1.

### T6: Define Handoff to Fixture and Trial Stories
- State what HSEA-3.1 must provide as trainable/holdout fixtures.
- State what HSEA-3.2 must calculate during trial execution.
- Keep this story policy-only; do not create fixtures or run trials.

### T7: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Run `npm run build`.
- Update File List and Agent Record.

## 5. Proposed Policy Shape

The implementation should produce a reusable policy artifact with at least these sections:

```text
Fitness Rubric
Novelty Rubric
Regression and Holdout Policy
Population Selection
Learning Log Contract
State/Lineage Integration
Anti-Gaming Rules
Downstream Handoff
```

Suggested initial fitness weights, based on the approved trial plan:

| Dimension | Weight |
|---|---:|
| Scenario pass rate | 25 |
| Holdout preservation | 20 |
| Specificity/actionability | 15 |
| Governance preservation | 15 |
| Brevity/token discipline | 10 |
| Project fit | 10 |
| Reviewer confidence | 5 |

Suggested selection formula:

```text
selection_score = fitness + min(novelty, 10) - regression_penalty + lineage_diversity_bonus
```

The final implementation may tune names or weights, but any deviation must be documented in the story Agent Record and must not collapse novelty into fitness.

## 6. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Weighted fitness dimensions | T1 | 100-point rubric, evidence, baseline comparison | ✅ |
| AC2 | Novelty separate from fitness | T2 | Novelty rubric, rewards, penalties | ✅ |
| AC3 | Holdout and regression policy | T3 | Holdout isolation, blockers, penalties | ✅ |
| AC4 | Population selection | T4 | Selection formula, diversity, sensitivity, no lucky overwrite | ✅ |
| AC5 | Learning loop score deltas | T5 | Score delta fields, reviewer reason, lesson categories | ✅ |
| AC6 | Anti-gaming and safety | T2, T3 | Verbosity, gate weakening, overfit, ungrounded confidence | ✅ |
| AC7 | State and lineage integration | T5 | Append-only lineage, `current_state`, HSEA-2.1 states | ✅ |
| AC8 | Downstream boundaries | T6 | HSEA-3.1 fixtures, HSEA-3.2 trial execution | ✅ |

## 7. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 8 ACs, not above >8 threshold | 0 |
| Data Model Spread | No DB changes; file/contract policy only | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Scoring, novelty, holdouts, population, lineage, governance | 3 |
| Flow Complexity | Multi-stage scoring and population selection flow | 2 |
| Test Burden | Script/build validation only; trial execution deferred | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - this is cross-domain policy work. Keep implementation contract-first and do not create fixtures, runner code, or promotion automation in this story.

## 8. Dev Notes

- This is a **policy/specification story**, not a trial runner implementation.
- HSEA-2.1 is done and defines the candidate manifest, `current_state`, state enum, typed packaging, and lineage integration. Do not redefine those state names.
- HSEA-3.1 must create concrete fixtures. HSEA-2.2 may define fixture requirements only.
- HSEA-3.2 must run empirical trials and score real candidates. HSEA-2.2 may define the scorecard contract only.
- HSEA-3.3 owns promotion/rollback decisions. HSEA-2.2 may recommend but must not promote.
- Novelty is not a free bonus. It must be bounded and must never compensate for safety regression, holdout failure, or governance weakening.
- Regression penalty should be severe when a candidate removes human checkpoints, weakens evidence discipline, embeds sensitive sources, or exposes holdout content.
- Keep Darwinian Evolver as behavioral reference only. Do not copy AGPL source or require an external engine.
- Preserve raw evidence behind refs. Do not embed full transcripts, graph dumps, or fixture answers in scoring policy.
- FeatureGraph validation is expected to be unavailable in some sessions; if unavailable, state that no DataEntity/Event/SeedData code was introduced rather than inferring no graph impact.
- Project memory check: `.agent/memory/PROJECT.md` and `.agent/memory/USER.md` were not present in this checkout during create-story, so no persistent memory constraints were applied.

## 9. Definition of Done

- [x] Fitness rubric is documented with weights and evidence rules.
- [x] Novelty rubric is documented separately from fitness.
- [x] Holdout isolation and regression penalty policy are documented.
- [x] Population selection policy is documented.
- [x] Learning-log score delta contract is documented.
- [x] State/lineage integration with HSEA-2.1 is documented.
- [x] Anti-gaming and safety rules are documented.
- [x] Handoff boundaries for HSEA-3.1 and HSEA-3.2 are documented.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] `npm run build` passes.

## 10. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story makes evolution measurable before runner implementation and preserves the HSEA-2.1 candidate model. |
| Data Integrity & State | 9 | Score deltas, lineage events, and `current_state` reconciliation keep candidate history auditable. |
| Security & Validation | 9 | Holdout protection, regression blockers, governance preservation, and anti-gaming rules protect safety. |
| Performance & Scalability | 9 | Bounded novelty and brevity/token discipline reduce wasteful style churn. |
| Error Handling & Recovery | 9 | Rejected candidates keep reviewer reasons and lessons for future mutation rounds. |
| Code Quality & Maintainability | 9 | A reusable policy artifact gives downstream fixture/trial stories a stable contract. |
| UX Empathy | 9 | Reviewers can explain why a candidate improved or failed instead of trusting opaque automation. |

**Total Average:** 9.00 / 10 - PASS

## 11. File List

- `.agent/fragments/evolution-lab-scoring-policy.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-2.2-scoring-novelty-population-policy.md`
- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-3.2-run-trial-scorecard.md`
- `_iwish-output/stories/sprint-status.yaml`

## 12. Agent Record

### Planned

- Implement HSEA-2.2 as a reusable scoring, novelty, holdout, and population policy.
- Preserve HSEA-2.1 state/manifest/lineage contract.
- Keep scoring and population work policy-only.

### Implementation Status

- Added `.agent/fragments/evolution-lab-scoring-policy.md`.
- Defined 100-point fitness rubric with evidence requirements and baseline comparison rules.
- Defined novelty rubric separately from fitness with bounded selection contribution.
- Defined holdout isolation, blocking regressions, regression penalties, and anti-gaming rules.
- Defined population selection formula, lineage diversity bonus, recommendation categories, and no-lucky-overwrite rules.
- Defined learning-log score delta contract and state/lineage integration with HSEA-2.1.
- Defined downstream handoff requirements for HSEA-3.1 fixtures and HSEA-3.2 trial execution.
- Added explicit evaluation thresholds and experiment override fields for deterministic HSEA-3.2 state transitions.
- Split `recommendation_category` from `lineage_decision` so HSEA-2.2 stays compatible with HSEA-2.1 lineage enums.
- Added structured source-sensitivity and curator-approval fields to fitness, selection, and learning-log outputs.
- Bound HSEA-3.2 directly to the HSEA-2.2 scoring policy contract.
- Marked story `DONE` and sprint status `done`.

### Tests / Validation Run

- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.
- Post-fix verification: `./.agent/scripts/validate-kg.sh` - PASS.
- Post-fix verification: `./.agent/scripts/validate-portability.sh` - PASS.
- Post-fix verification: `npm run build` - PASS.

### Decisions

- Kept HSEA-2.2 focused on scoring/novelty/holdout/population policy only.
- Deferred fixture creation to HSEA-3.1 and trial execution to HSEA-3.2.
- Required HSEA-2.2 to reuse HSEA-2.1 candidate state and lineage model instead of redefining it.
- Did not implement a runner, create fixture files, mutate candidates, or promote assets.
- CodeGraph/FeatureGraph MCP tools were unavailable in this session; blast-radius review used repository file search and existing HSEA source artifacts.

## 13. Senior Developer Review (AI)

**Review Date:** 2026-05-11  
**Reviewer:** Codex / I-Wish Code Review  
**Outcome:** Changes Requested

### Findings

1. **P1 - Scoring policy references state transition thresholds but does not define them.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:192-200` introduces transitions for "train score below minimum", "train score passes", and "recommendation criteria pass", while `.agent/fragments/evolution-lab-core-model.md:166-168` delegates the minimum train threshold and recommendation evidence to HSEA-2.2. No numeric/default threshold, per-experiment override field, or required threshold source is defined in the new machine-readable contract. HSEA-3.2 cannot deterministically decide `train_evaluated -> holdout_evaluated`, `holdout_evaluated -> recommended`, or rejection without inventing its own rule.  
   Confidence: 9/10.

2. **P1 - Recommendation categories drift from the HSEA-2.1 lineage decision enum.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:143-151` and `.agent/fragments/evolution-lab-scoring-policy.md:173` introduce `retry_with_constraints`, `archive_as_learning`, and `needs_human_review`; the HSEA-2.1 lineage event contract allows only `continue|reject|recommend|promote|rollback|archive` at `.agent/fragments/evolution-lab-core-model.md:175-191`. Because scoring may update `candidate.yaml`, `experiment.yaml`, and `lineage.jsonl` (`.agent/fragments/evolution-lab-scoring-policy.md:188-215`), this mismatch will create invalid lineage events or force downstream tools to silently remap decisions.  
   Confidence: 9/10.

3. **P1 - Source sensitivity is enforced only in prose, not in structured scoring outputs.**  
   Evidence: AC4 requires population selection to consider source sensitivity (`story-hsea-2.2-scoring-novelty-population-policy.md:65-69`), and the policy says not to select unresolved sensitive/private sources unless curator-approved (`.agent/fragments/evolution-lab-scoring-policy.md:135-141`). However, the machine-readable `fitness`, `novelty`, `regression`, and `learning-log.jsonl` examples at `.agent/fragments/evolution-lab-scoring-policy.md:23-39`, `.agent/fragments/evolution-lab-scoring-policy.md:61-70`, `.agent/fragments/evolution-lab-scoring-policy.md:104-114`, and `.agent/fragments/evolution-lab-scoring-policy.md:157-179` contain no `source_sensitivity`, `sensitivity_status`, or `curator_approval` field. This weakens the gate from a tool-checkable rule to reviewer memory.  
   Confidence: 8/10.

4. **P2 - HSEA-3.2 is named as a downstream owner, but its story is not updated to load or apply the scoring policy.**  
   Evidence: the story explicitly requires pointer-level handoff for HSEA-3.1 and HSEA-3.2 (`story-hsea-2.2-scoring-novelty-population-policy.md:35-37`, `story-hsea-2.2-scoring-novelty-population-policy.md:88-92`), and the policy lists HSEA-3.2 required calculations at `.agent/fragments/evolution-lab-scoring-policy.md:242-253`. Repository search only finds `evolution-lab-scoring-policy` in this story and the new fragment, not in `story-hsea-3.2-run-trial-scorecard.md`. HSEA-3.2 can still be implemented later, but the handoff is currently weaker than the story asks for.  
   Confidence: 8/10.

5. **P2 - Learning-log wording includes an `accepted` decision that the decision enum cannot represent.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:153-155` says "Every accepted, rejected, archived, or recommended candidate decision", but the learning-log `decision` enum at `.agent/fragments/evolution-lab-scoring-policy.md:173` does not include `accepted`. This is smaller than the lineage mismatch above, but it will confuse fixture authors and trial scorecard implementers.  
   Confidence: 8/10.

### Runtime / Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.
- CodeGraph/FeatureGraph MCP tools were unavailable; contract drift review used direct repository search and HSEA source artifacts.

### QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 6 | The policy defines useful scoring dimensions, but missing thresholds block deterministic downstream execution. |
| Data Integrity & State | 5 | Decision enums drift from HSEA-2.1 lineage, risking invalid or silently remapped state events. |
| Security & Validation | 7 | Holdout and anti-gaming protections are strong, but source sensitivity is not structured enough for tooling. |
| Performance & Scalability | 8 | Bounded novelty and population rules avoid style churn. |
| Error Handling & Recovery | 7 | Rejection and learning loops exist, but decision taxonomy needs alignment before runners rely on it. |
| Code Quality & Maintainability | 7 | The fragment is readable and scoped, but downstream story handoff needs a stronger pointer. |
| UX Empathy | 8 | Reviewer-readable reasons and confidence fields make candidate decisions explainable. |

**Total Average:** 6.86 / 10 - CHANGES REQUESTED

## 14. Senior Developer Review Round 2 (AI)

**Review Date:** 2026-05-11  
**Reviewer:** Codex / I-Wish Code Review  
**Outcome:** Changes Requested

### Findings

1. **P1 - Previous threshold finding remains open: state transitions still depend on undefined minimums.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:192-200` still uses "train score below minimum", "train score passes", and "recommendation criteria pass"; `.agent/fragments/evolution-lab-core-model.md:166-168` still delegates the minimum train threshold and recommendation evidence to HSEA-2.2. The policy has no default values such as `minimum_train_score`, `minimum_score_delta`, `minimum_reviewer_confidence`, `holdout_required`, or an explicit per-experiment override field. HSEA-3.2 still cannot update candidate states deterministically.  
   Confidence: 9/10.

2. **P1 - Previous lineage decision drift remains open.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:143-151` and `.agent/fragments/evolution-lab-scoring-policy.md:173` still use recommendation/learning decisions `retry_with_constraints`, `archive_as_learning`, and `needs_human_review`; HSEA-2.1 lineage allows only `continue|reject|recommend|promote|rollback|archive` at `.agent/fragments/evolution-lab-core-model.md:175-191`. Because scoring updates lineage and `current_state`, this remains a contract drift issue, not a naming preference.  
   Confidence: 9/10.

3. **P1 - Previous source-sensitivity structured-output gap remains open.**  
   Evidence: AC4 requires source sensitivity in selection (`story-hsea-2.2-scoring-novelty-population-policy.md:66-70`), and the policy blocks unresolved sensitive/private sources unless curator-approved (`.agent/fragments/evolution-lab-scoring-policy.md:135-141`). The structured outputs at `.agent/fragments/evolution-lab-scoring-policy.md:23-39`, `.agent/fragments/evolution-lab-scoring-policy.md:61-70`, `.agent/fragments/evolution-lab-scoring-policy.md:104-114`, and `.agent/fragments/evolution-lab-scoring-policy.md:157-179` still have no machine-readable sensitivity status or curator approval field. Tooling cannot enforce this gate.  
   Confidence: 8/10.

4. **P2 - Previous HSEA-3.2 handoff gap remains open.**  
   Evidence: the story requires pointer-level handoff for HSEA-3.2 at `story-hsea-2.2-scoring-novelty-population-policy.md:35-37` and `story-hsea-2.2-scoring-novelty-population-policy.md:88-92`, while `.agent/fragments/evolution-lab-scoring-policy.md:242-253` lists HSEA-3.2 calculations. Repository search still does not show `evolution-lab-scoring-policy` referenced from `story-hsea-3.2-run-trial-scorecard.md`, so the downstream runner story is not explicitly bound to this contract.  
   Confidence: 8/10.

5. **P2 - Previous learning-log decision wording mismatch remains open.**  
   Evidence: `.agent/fragments/evolution-lab-scoring-policy.md:153-155` still says "accepted, rejected, archived, or recommended", but `.agent/fragments/evolution-lab-scoring-policy.md:173` still omits `accepted` from the decision enum. This should either be replaced with `recommend`/`archive` wording or mapped explicitly to the HSEA-2.1 lineage decision enum.  
   Confidence: 8/10.

### Runtime / Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `npm run build` - PASS.
- `./.agent/scripts/validate-portability.sh` - FAIL, but the reported violation is unrelated to HSEA-2.2: `_iwish-output/stories/epic-pocock-skills-absorption/story-psa-2.2-local-devex-ops-integration.md:3` contained a user-specific absolute link at the time of review.
- FeatureGraph MCP tools were unavailable in this session; no DataEntity/Event/SeedData implementation was introduced by HSEA-2.2.

### QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 6 | The policy remains directionally useful, but missing thresholds prevent deterministic HSEA-3.2 execution. |
| Data Integrity & State | 5 | Decision enum drift still risks invalid lineage rows or hidden remapping. |
| Security & Validation | 7 | Holdout and anti-gaming rules remain strong, but source sensitivity is not structured for enforcement. |
| Performance & Scalability | 8 | Bounded novelty and regression penalties reduce churn and bloated candidates. |
| Error Handling & Recovery | 7 | Rejection/learning paths exist, but unresolved decision taxonomy weakens recovery automation. |
| Architectural Depth & Leverage | 6 | The contract is reusable, but HSEA-3.2 is not explicitly bound to it and core/scoring enums diverge. |
| UX Empathy | 8 | Reviewer reasons remain clear, though ambiguous decisions will slow human review. |

**Total Average:** 6.71 / 10 - CHANGES REQUESTED

### Architectural DNA Check

- **Tracer Bullet?** FAIL - this is correctly a policy-only story, but the downstream HSEA-3.2 binding is incomplete.
- **Deletion Testable?** PASS - the policy fragment can be validated by removing/referencing it from downstream stories.
- **Interface vs Implementation?** FAIL - the structured contract interface is smaller than the prose behavior and omits required branching fields.

## 15. Resolution Update

Post-review fixes completed on 2026-05-11:

- Added deterministic scoring thresholds and experiment override fields to `.agent/fragments/evolution-lab-scoring-policy.md`.
- Replaced recommendation-as-lineage drift with explicit `recommendation_category` and `lineage_decision` mapping.
- Added machine-readable source sensitivity and curator approval fields to scoring outputs.
- Updated HSEA-3.2 so the trial story must load and apply the HSEA-2.2 scoring contract.
- Cleared unrelated portability drift caused by an absolute local link in a PSA story.

Verification after fixes:

- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.
