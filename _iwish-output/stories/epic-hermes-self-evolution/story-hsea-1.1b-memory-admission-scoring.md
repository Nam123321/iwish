---
story_id: "story-hsea-1.1-project-memory-model.mdb"
epic_id: "EPIC-HSEA"
title: "Define Memory Admission Scoring and Trigger Routing"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: ["story-hsea-1.1-project-memory-model.md"]
phase: "forge"

---
# Story HSEA-1.1b: Define Memory Admission Scoring and Trigger Routing

## 1. Objective

Define when I-Wish should run memory selection/scoring, how memory candidates are routed, and how the scoring gate respects existing I-Wish classification and action flows.

## 1.1 Context

`story-hsea-1.1-project-memory-model.md` established the memory layers: `PROJECT.md`, `USER.md`, workflow memory, and session/learning logs. It did not define how a candidate memory earns admission into those layers.

Hermes uses heuristic memory selection: save preferences, environment facts, corrections, conventions, completed work, and explicit remember requests; skip trivial facts, easily rediscovered knowledge, raw dumps, session-only details, and content already available in context files. Hermes also uses strict capacity limits, duplicate prevention, consolidation, security scanning, and background review. It does not expose a full numeric memory admission score in the core memory docs.

I-Wish needs a stricter routing model because it already has classification and action flows for skills, workflows, agents, generated capabilities, KG learnings, and operational instincts. Memory scoring must not bypass those flows.

**Source artifacts:**
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/fragments/learning-context-loop.md`
- `.agent/workflows/create-capability.md`
- `.agent/workflows/enhance-capability.md`
- `.agent/workflows/step-w-01-triage.md`
- `.agent/workflows/step-w-02-spec.md`
- `.agent/workflows/step-w-04-validate.md`
- `.agent/agents/grand-priest.md`
- `.agent/agents/whis.md`
- `${IWISH_HOME}/sandbox/hermes-agent/website/docs/user-guide/features/memory.md`

## 2. User Story

As a I-Wish workflow owner,  
I want memory admission scoring to run only at approved trigger points after classification,  
So that useful learnings are preserved without polluting memory or bypassing skill/workflow promotion gates.

## 3. Acceptance Criteria

### AC1: Trigger Points Are Defined by Stage
**Given** an agent discovers a possible durable lesson  
**When** the memory admission protocol is evaluated  
**Then** the story defines which I-Wish stages may run selection/scoring  
**And** each stage explains whether it can save directly, create a candidate, or must wait for approval.

### AC2: Scoring Rubric Is Defined
**Given** a candidate memory exists  
**When** admission is scored  
**Then** the rubric includes durability, actionability, project specificity, recurrence, source confidence, rediscoverability, risk, scope, and capacity impact.

### AC3: Routing Respects Classification Funnel
**Given** a candidate is actually a skill, workflow, agent, or compound capability  
**When** memory scoring runs  
**Then** it routes to the existing create/enhance capability flow or generated runtime draft  
**And** it does not store implementation methodology as loose memory.

### AC4: Memory Destination Matrix Is Defined
**Given** a candidate passes scoring  
**When** it is routed  
**Then** the destination matrix maps it to `PROJECT.md`, `USER.md`, workflow memory, `instincts.jsonl`, KG learning, generated capability draft, or skip/defer.

### AC5: Hermes Differences Are Explicit
**Given** I-Wish is absorbing Hermes memory behavior  
**When** the admission protocol is documented  
**Then** it explains which Hermes heuristics are adopted  
**And** which I-Wish governance additions are required.

### AC6: Workflow Patch Scope Is Clear
**Given** later stories implement the protocol  
**When** patches are planned  
**Then** the target surfaces include create-story, Vegeta-story, code-review, Grand-Priest save phase, Whis create/enhance capability, and learning-context-loop  
**And** no canonical asset may be updated automatically without the existing promotion/approval gate.

## 4. Research Findings: Trigger Placement

Memory admission scoring should run at these stages only:

| Stage | Trigger | Run Selection/Scoring? | Allowed Result |
|---|---|---|---|
| Session start / LOAD Protocol | Agent retrieves prior learnings | No admission scoring; retrieval filtering only | Load up to relevant prior learnings by tag/confidence. |
| Story creation | After requirements, ACs, Dev Notes, and project context are assembled | Yes, for newly discovered project constraints or story-generation lessons | Candidate for `PROJECT.md`, workflow memory, or learning log; no auto-promotion. |
| Vegeta implementation | After each task/test completion and before Agent Record finalization | Yes, for implementation lessons, tool quirks, project conventions, and repeated failures | Candidate for `PROJECT.md`, `instincts.jsonl`, or workflow memory. |
| Fix-bug / SBRP | After Phase 3 RCA and again after Phase 5 fix validation / Phase 7 tracker update | Yes, for root-cause lessons, recurrence patterns, missing guardrails, and validated bad/good fix patterns | Candidate for `instincts.jsonl`, bug tracker lesson, workflow memory, or capability-enhancement follow-up. |
| Code review | After findings are calibrated and before review conclusion | Yes, for durable review rules and recurring defect patterns | Candidate for `instincts.jsonl`, workflow memory, or governance follow-up. |
| Grand-Priest SAVE phase | After Classification Funnel determines type | Yes, but only after classifying the learning as memory, capability, KG learning, or generated draft | Route to memory only if it is not a capability candidate. |
| Whis create-capability Step W-01/W-02 | After capability type triage and spec approval | Yes, but as routing validation, not direct memory save | Capability knowledge goes to `${IWISH_HOME}/generated-*`, not memory. |
| Whis create-capability Step W-04 | After user approves promotion | Yes, for meta-learning only | Append promotion meta-instinct after approval, matching existing policy. |
| Whis enhance-capability Step E-01/E-02 | During reflection and clustering | Yes, for scoring unresolved instincts and selecting evolution targets | Cluster/rank instincts; route to UPDATE_SKILL, CREATE_SKILL, or UPDATE_WORKFLOW. |
| Retrospective / incident / QA finding | After evidence is available | Yes | Candidate for `instincts.jsonl`, KG learning, or workflow memory. |
| Background review | After session end, if implemented later | Yes, recommendation-only | Emit candidates; do not modify canonical assets directly. |

Do not run memory admission scoring:

- before the task/domain is understood;
- before capability classification when the candidate may be a skill/workflow/agent;
- inside external repo absorption before RAP artifacts are written;
- during fix-bug triage before RCA evidence exists;
- as a hidden background auto-write to canonical `.agent/` assets;
- for raw logs, code dumps, or facts that are easy to rediscover from source files.

## 5. Draft Memory Admission Rubric

Score each dimension from 0-2 unless otherwise specified:

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Durability | Session-only | Useful for current phase | Likely useful across future sessions |
| Actionability | Interesting but not usable | Helps review/decision | Directly changes agent behavior |
| Project Specificity | Generic knowledge | Applies to this project and maybe others | Project-specific constraint or convention |
| Recurrence | One-off | May recur | Already repeated or high likelihood |
| Source Confidence | Speculative | Inferred from evidence | User-approved or directly verified |
| Rediscoverability | Easy to rediscover | Moderately costly | Hard/costly to rediscover at the right time |
| Risk If Forgotten | Low | Medium | High |
| Scope Clarity | Unclear destination | Possible destination | Clear destination |

Capacity impact modifier:

- `-2`: verbose, duplicative, or bloats memory.
- `0`: normal compact entry.
- `+1`: compact and high-signal.

Suggested thresholds:

- `>= 13`: admit to the correct memory layer after routing checks.
- `10-12`: keep as learning-log candidate or reviewer-visible recommendation.
- `< 10`: skip or keep only in session notes.
- Any candidate with source confidence `0` cannot be admitted to `PROJECT.md` or `USER.md`.
- Any capability-shaped candidate must route to create/enhance capability flow regardless of score.

## 6. Routing Matrix

| Candidate Type | Destination | Notes |
|---|---|---|
| Stable cross-project user preference | `.agent/memory/USER.md` | Preference only; never technical authority. |
| Project/product constraint, convention, architecture decision | `.agent/memory/PROJECT.md` | Requires strong source confidence or approved artifact reference. |
| Repeated workflow failure or tuning rule | Workflow memory / future `.agent/memory/workflows/*.md` | May also become an evolution-lab fixture later. |
| Concrete operational defect pattern | `.agent/memory/instincts.jsonl` | Dense JSONL with `bad`, `good`, `sev`, `ctx`, and `ref`. |
| Bug root-cause pattern or recurrence lesson | `.agent/memory/instincts.jsonl` + `_iwish-output/bug-tracker.yaml` / bug report reference | Save after RCA/fix validation, not before. Use `src: fix-bug` and cite the bug/story/report. |
| Durable lesson requiring search/reuse | `.agent/learnings/*.md` + KG node | Follow `learning-context-loop.md`; max 3 loaded per session. |
| New skill/workflow/persona/compound methodology | `${IWISH_HOME}/generated-*` via create-capability or enhance-capability | Do not bury as memory. |
| External repo behavior/pattern | RAP DNA/gap-analysis/research artifact | Promote only through approved integration story. |
| Raw evidence/log/code dump | Skip; link to source artifact | Memory should store the lesson, not the dump. |

## 7. Tasks

### T1: Document Admission Scoring
- Add numeric scoring dimensions and threshold guidance.
- Include capacity and source-confidence blockers.
- Add the rubric to `.agent/memory/MEMORY_SCHEMA.md` or a directly linked memory governance artifact.
- Preserve the rule that speculative candidates cannot enter `PROJECT.md` or `USER.md`.

### T2: Document Trigger Stages
- Map admission scoring to story creation, implementation, code review, save phase, create/enhance capability, retrospective, and background review.
- Clarify retrieval filtering vs admission scoring.
- Include `fix-bug` / SBRP trigger placement after RCA and fix validation.
- Explicitly state which stages can write directly, create a candidate, or require approval.

### T3: Document Routing Rules
- Define destination matrix.
- Add explicit rule: capability-shaped learnings route to existing classification/action flows.
- Ensure the routing matrix covers `PROJECT.md`, `USER.md`, workflow memory, `instincts.jsonl`, KG learning, generated capability drafts, source artifacts, and skip/defer.
- Add a non-bypass rule for `create-capability` and `enhance-capability`.

### T4: Identify Future Patch Surfaces
- List target workflow/agent fragments for later implementation.
- Keep this story as specification only unless user approves patches.
- Identify the exact follow-up patch surfaces: `create-story`, Vegeta story execution, code review, `fix-bug`, Grand-Priest save phase, Whis create/enhance capability, and learning-context-loop.

### T5: Validate
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Confirm the story and any changed guidance use repo-relative paths, `{project-root}`, or `${IWISH_HOME}` only.

## 8. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Trigger points defined by stage | T2 | Story/create, Vegeta, fix-bug, code-review, save phase, Whis flows, retrospective, background review | ✅ |
| AC2 | Scoring rubric defined | T1 | Dimensions, thresholds, capacity modifier, source-confidence blockers | ✅ |
| AC3 | Routing respects classification funnel | T3 | Capability-shaped candidate non-bypass rule, generated draft routing | ✅ |
| AC4 | Destination matrix defined | T3 | Memory layers, instinct/KG/generated/source/skip routes | ✅ |
| AC5 | Hermes differences explicit | T1, T2 | Adopted heuristics, I-Wish governance additions, direct-Hermes gaps | ✅ |
| AC6 | Workflow patch scope clear | T4 | Future patch surfaces and no-canonical-auto-write rule | ✅ |

## 9. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | Memory schema/routing spec only | 1 |
| UI Surface | No UI | 0 |
| Cross-Domain | Memory, workflow, capability routing | 2 |
| Flow Complexity | Trigger matrix across multiple stages | 2 |
| Test Burden | Script validation only | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - cross-workflow coordination is real; keep this story specification-first and defer broad workflow patches to later implementation stories.

## 9.1 Create-Story Readiness Notes

This story is ready for implementation as a governance/specification story, not as a runtime automation story. The first implementation slice should update memory governance documentation and create precise follow-up patch guidance. It should not patch every listed workflow in one pass unless the implementer re-runs the complexity check and confirms the scope remains bounded.

**Project memory gate:** If `.agent/memory/PROJECT.md` exists, load only HSEA-relevant sections before implementation. `USER.md` may inform collaboration style only and must not override the memory admission rules.

**Primary implementation target:** `.agent/memory/MEMORY_SCHEMA.md` or a directly linked memory governance artifact.

**Secondary implementation target:** This story record and sprint tracker only, unless follow-up workflow patch scope is explicitly approved.

**Implementation caution:** The trigger matrix is a policy map. Do not implement hidden automatic writes to `PROJECT.md`, `USER.md`, `instincts.jsonl`, or canonical `.agent/` assets in this story.

## 10. Dev Notes

- Do not add hidden automatic writes to `PROJECT.md`, `USER.md`, or canonical `.agent/` files.
- Do not replace the existing Classification Funnel; memory admission scoring runs after or beside classification, never before it.
- Treat Hermes memory rules as useful heuristics, not as enough governance for I-Wish.
- Treat `instincts.jsonl` as operational machine memory, not as a general dumping ground.
- Prefer references to source artifacts over copying long context into memory.
- For `fix-bug`, run admission scoring only after evidence exists: RCA, validated fix, regression result, or recurrence classification. Triage hypotheses should remain in the bug report, not memory.
- Preserve the distinction between admission scoring and retrieval filtering: retrieval decides what existing memory to load; admission decides whether a new candidate deserves durable storage.
- Memorygraph is the long-term retrieval layer; prompt memory should stay compact and curated.

## 11. Definition of Done

- [x] Admission scoring rubric is documented.
- [x] Trigger-stage matrix is documented.
- [x] Routing matrix is documented.
- [x] Classification/action-flow non-bypass rule is explicit.
- [x] Hermes heuristic differences are documented.
- [x] Validation scripts pass.

## 12. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-1.1b-memory-admission-scoring.md`
- `_iwish-output/stories/sprint-status.yaml`
- `.agent/memory/MEMORY_SCHEMA.md`
- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/learning-context-loop.md`

## 13. Vegeta Agent Record

### Planned

- Implement the admission scoring governance spec.
- Add trigger-stage and routing guidance to the memory governance surface.
- Keep implementation specification-first and avoid broad workflow rewrites.
- Run KG and portability validation.

### Implementation Status

- Updated `.agent/memory/MEMORY_SCHEMA.md` with a dedicated `Memory Admission Protocol`.
- Added `.agent/fragments/memory-admission-protocol.md` as the agent-facing admission/routing protocol.
- Updated `.agent/memory/MEMORY_SCHEMA.md` to point agents to the fragment instead of treating the human schema as the execution surface.
- Updated `.agent/fragments/learning-context-loop.md` SAVE Protocol to load and apply memory admission before creating learning files or KG nodes.
- Added approved trigger-stage matrix covering story creation, Vegeta implementation, fix-bug/SBRP, code review, Grand-Priest save phase, Whis create/enhance capability, retrospectives, and future background review.
- Added admission scoring rubric with 0-2 dimensions, capacity modifier, thresholds, and source-confidence blocker.
- Tightened Source Confidence `0` so it cannot enter any durable memory store or KG learning; it remains session/source-artifact only.
- Added routing matrix covering `PROJECT.md`, `USER.md`, workflow memory, `instincts.jsonl`, KG learnings, generated capability drafts, RAP/source artifacts, and skip/defer.
- Added classification non-bypass rule so skill/workflow/agent/compound-shaped candidates route to create/enhance capability or `${IWISH_HOME}/generated-*`.
- Added exact future patch-surface handoff in the agent-facing fragment.
- Added Hermes adaptation notes distinguishing adopted Hermes heuristics from I-Wish governance additions.
- Kept implementation specification-first and did not patch broad workflow engines or add hidden auto-writes.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` -> pass.
- Ran `./.agent/scripts/validate-portability.sh` -> pass.
- Ran `npm run build` -> pass.

### Decisions

- Used `.agent/memory/MEMORY_SCHEMA.md` as the canonical memory governance surface for this story.
- Split execution guidance into `.agent/fragments/memory-admission-protocol.md` because `MEMORY_SCHEMA.md` is marked human-reference-only.
- Deferred broad workflow patching to later stories because this story's Plan Tune score is WARN-level and the Dev Notes explicitly keep it specification-first.
- Preserved memorygraph as the scalable retrieval layer while keeping prompt memory compact and curated.

## 14. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story defines when memory scoring runs and prevents indiscriminate memory writes. |
| Data Integrity & State | 9 | Routing separates user preference, project memory, workflow memory, instincts, KG learnings, and generated capabilities. |
| Security & Validation | 9 | It forbids hidden canonical writes and respects existing approval gates. |
| Performance & Scalability | 9 | Scoring and capacity modifiers prevent context bloat. |
| Error Handling & Recovery | 9 | Low-confidence and capability-shaped candidates are deferred or routed instead of stored blindly. |
| Code Quality & Maintainability | 9 | Trigger placement aligns with existing I-Wish workflow stages and classification flows. |
| UX Empathy | 9 | Useful user/project learnings are preserved without surprising users with invisible behavior changes. |

**Total Average:** 9.00 / 10 - PASS
