---
story_id: "STORY-HSEA-3.1"
epic_id: "EPIC-HSEA"
title: "Create Evolution Lab Trial Fixtures"
status: "done"
assignee: "Vegeta"
priority: "P0"
depends_on: ["story-hsea-2.4-dual-run-activation.md"]
blocks: ["STORY-HSEA-3.2", "STORY-HSEA-3.2b"]
phase: "origin"
---

# Story HSEA-3.1: Create Evolution Lab Trial Fixtures

## 1. Objective

Build the initial set of "Trial Fixtures" to validate the Evolution Lab engine. A Trial Fixture represents a complete vertical slice of testing: it contains the baseline source artifact (the skill to be evolved) AND an automated evaluation script/criteria. This ensures the "run-both-then-judge" paradigm is data-driven, allowing us to objectively score mutations from both the Native and Darwinian engines against a baseline.

## 1.1 Context & Tracer Bullet

**Tracer Bullet (Vertical Slice):**
The initial trial fixtures will target two specific, text-heavy I-Wish Skills:
1. **DevOps Skill:** `land-and-deploy` (Tests logic flow, safety checklists, and pipeline enforcement).
2. **Absorption Skill:** `repo-absorption` (Tests complex multi-phase extraction, indexing, and documentation logic).

**Fixture Anatomy:** Option A (Source + Automated Evaluation Script).
Each fixture will contain:
- The `baseline.md` (the current version of the skill).
- An automated evaluation criteria/script (e.g., `evaluator.js` or `eval-prompt.md`) that systematically scores mutated candidates on specific axes (e.g., structural clarity, novelty, constraint retention).

## 2. Acceptance Criteria

- **AC1: [Fixture Directory Structure]** The implementation MUST establish a standardized directory schema for fixtures (e.g., `.agent/evolution-lab/fixtures/[fixture-name]/`).
- **AC2: [DevOps Fixture]** MUST create a complete fixture for the `land-and-deploy` skill. This includes copying the current skill as `baseline.md` and defining its specific automated evaluation criteria to guard against unsafe mutations (e.g., accidentally removing manual deployment approvals).
- **AC3: [Absorption Fixture]** MUST create a complete fixture for the `repo-absorption` skill. This includes copying the current skill as `baseline.md` and defining its specific automated evaluation criteria to ensure multi-phase graph logic is preserved.
- **AC4: [Evaluation Baseline Format]** MUST define the standard output format that evaluator scripts/prompts will produce (e.g., a 1-10 score across defined axes like Logic Retention, Novelty, and Brevity), allowing the scorecard generator (in HSEA-3.2) to easily parse the results.

## 3. Technical Approach & Dev Notes

### 3.1 Fixture Isolation
Fixtures must live entirely within the `.agent/evolution-lab/fixtures/` namespace. They should not directly reference the live `.agent/skills/` files during the trial run to prevent accidental pollution. The runner will copy the `baseline.md` to a sandbox, mutate it, and then run the evaluator.

### 3.2 Evaluation Script Design
The evaluator can be a simple node script or a rigid LLM evaluation prompt that outputs strict JSON. 
Example Output Format required by AC4:
```json
{
  "axes": {
    "constraint_retention": 9,
    "novelty": 7,
    "brevity": 8
  },
  "total_score": 24,
  "fatal_degradations": []
}
```
If a mutation deletes a critical rule (like human checkpoints in `land-and-deploy`), the evaluator MUST flag it in `fatal_degradations`, automatically disqualifying the candidate regardless of its novelty score.

## 4. Tasks & Traceability

### AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Fixture Directory Structure | T1: Define and create `.agent/evolution-lab/fixtures/` schema | - | ☐ |
| AC2 | DevOps Fixture | T2: Build fixture for `land-and-deploy` (source + evaluator) | Write evaluator rules for deployment safety. | ☐ |
| AC3 | Absorption Fixture | T3: Build fixture for `repo-absorption` (source + evaluator) | Write evaluator rules for graph/phase logic. | ☐ |
| AC4 | Evaluation Baseline Format | T4: Document the JSON evaluation output schema | - | ☐ |

---

## 5. QA Simulator Guardian Audit (Fat-Guardian)

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | Perfectly translates FR6 into a testable, data-driven trial structure using specific, high-value skills. |
| Data Integrity & State | 10 | Fixtures are completely isolated from live skills, protecting canonical assets from trial mutation pollution. |
| Security & Validation | 9 | The evaluator specifically guards against unsafe mutations (like removing human checkpoints in DevOps skills). |
| Performance & Scalability | 9 | The standardized JSON evaluation output allows for rapid, automated scoring of thousands of candidates if necessary. |
| Error Handling & Recovery | 9 | `fatal_degradations` cleanly handles and disqualifies catastrophic mutations. |
| Code Quality & Maintainability | 9 | The fixture anatomy separates the baseline from the evaluator cleanly. |
| UX Empathy | 9 | Provides objective, parseable metrics for the human reviewer in later steps. |

**Total Average:** 9.14 / 10 - PASS
