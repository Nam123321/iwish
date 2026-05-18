---
story_id: "story-1.17"
title: "Context-First Semantic Routing for Orch Agent"
status: "review"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
refs:
  - "story-1.16-solution-source-research-before-create-or-enhance.md"
  - "_iwish-output/stories/epic-superpowers-absorption/story-sp-6-orchestration-evolution.md"
---

# Story 1.17: Context-First Semantic Routing for Orch Agent

## 1. Objective

Upgrade `orch-agent` from keyword-heavy intent routing to **context-first semantic routing**, where the agent:

1. reads recent conversation context first
2. scores contextual hypotheses
3. identifies the active working thread
4. only then selects the next workflow, skill, agent, or question

## 2. Problem Statement

Current Orch routing is materially better than the old static menu, but it still has a structural weakness:

- it relies too much on the current utterance
- it relies too much on local keyword/trigger matches
- it does not sufficiently model the immediate conversational thread

This causes failures such as:

- prior turns were clearly about **creating Story 1.16**
- the user then says something short like `create story 1.16`
- Orch should infer this is a continuation of the current thread and route deterministically to `/make-story`
- instead, the execution path can fall back to direct artifact writing or shallow keyword-based routing

This is a semantic-routing failure, not just a missing trigger.

## 3. Relationship to Existing Story SP-6

This story is **not** a duplicate of `story-sp-6-orchestration-evolution`.

`story-sp-6` solved:

- replacing static menu thinking
- basic intent extraction
- confidence thresholds
- routing confirmation / fallback behavior
- anti-planning, routing-only behavior

This story extends that work into a stronger Orch model:

- **thread-aware routing**
- **context scoring**
- **working-memory hypothesis selection**
- **action-after-context**, not action-after-keyword

In short:

- `SP-6` = semantic orchestrator v1
- `story-1.17` = context-first semantic orchestrator v2

## 4. Desired Orch Decision Model

Before selecting an action, Orch should evaluate at least these layers in order:

1. **Recent conversation context**
   - what was being discussed in the last few turns
   - whether there is an active artifact / story / epic / workflow thread

2. **Source-of-truth context**
   - matched story IDs
   - sprint / epic / reconciliation state
   - known artifacts already created
   - current artifact maturity and compliance state
   - whether the referenced story has already gone through the canonical upstream workflow it depends on

3. **Routing-profile evidence**
   - candidate workflows / agents / skills
   - role, phase, stage, anti-triggers

4. **Current-turn wording**
   - local phrasing
   - explicit commands
   - specific trigger hints

The current-turn wording should be important, but it should not dominate the routing decision when thread context is much stronger.

## 5. Context Scoring Requirement

Orch should compute a lightweight scoring model before final route selection.

Suggested scoring dimensions:

- `thread_continuity_score`
  - how strongly the current turn continues the immediately previous discussion

- `artifact_focus_score`
  - whether a specific artifact or story is already the center of the thread

- `source_of_truth_match_score`
  - whether IDs, files, stories, or epics match current project state
  - whether the matched story or epic is in a state that implies the next canonical action

- `artifact_readiness_score`
  - whether the referenced story/spec/artifact already exists
  - whether it appears complete enough to move to the next phase
  - whether it still looks like a draft or a non-compliant placeholder

- `routing_profile_fit_score`
  - whether candidate workflow/agent role fits the current phase/stage

- `current_turn_keyword_score`
  - local lexical evidence only

- `ambiguity_penalty`
  - penalize shallow multi-match situations

The selected action should be based on a weighted combination, not on keyword hits alone.

## 5.1 Context Scoring vs Confidence Threshold

These two concepts are related, but they are **not the same**.

### `context scoring`

This is the **internal reasoning layer**.

It answers:

- what thread are we probably in?
- what artifact is the center of attention?
- what does source-of-truth say about current project state?
- which workflow best fits this situation?

This layer should aggregate multiple signals and produce ranked hypotheses.

### `confidence threshold`

This is the **action policy layer** inherited from `SP-6`.

It answers:

- should Orch act directly?
- should Orch present 2-3 options?
- should Orch ask a clarifying question?

The thresholds should remain compatible with `SP-6`:

- **90% - 100%**
  - proceed with the most likely canonical action directly
- **70% - 89%**
  - present a small set of likely actions/options
- **below 70%**
  - ask for clarification about context and intent

So:

- `context scoring` = how Orch reasons
- `confidence threshold` = how Orch behaves after reasoning

## 5.2 Source-of-Truth Status and Primary-Flow Gating

When the current thread is about **primary product-development flow**, Orch should not only match IDs. It should also inspect the status and maturity of the referenced artifacts.

Example:

- user says: `tiến hành story 1.17`
- source-of-truth shows `story-1.17` exists and is `TODO`
- Orch should then inspect whether the story content is already compliant enough for execution
- if the story is still missing canonical structure, or clearly has not gone through `/make-story` properly, Orch should increase the hypothesis that the correct next step is `/make-story`

In other words, a story ID match alone is not enough.

Orch should additionally ask:

- does the story file exist?
- what is its actual `status:` in the story file?
- is it only a placeholder or incomplete draft?
- does it appear to satisfy the expected structure for a usable story?
- has the story already passed through the canonical story-creation flow?

This should affect confidence.

### Expected behavior

- If the story exists and is high-quality, ready, and implementation-oriented:
  - Orch may route toward `/code`
- If the story is in `review`:
  - Orch should prefer `/review`
- If the story exists but is still incomplete, TODO, thin, or structurally weak:
  - Orch should lean toward `/make-story`
- If the story is already completed:
  - Orch should not fall back into `/make-story`
  - Orch should prefer `/status`, follow-up orchestration, or clarification depending on the current request
- If the story is already completed but the user asks to implement it again:
  - Orch should interpret that as a reopen/rescope situation
  - Orch should not jump directly to `/code` without confirming the intended next move
- If the story reference is ambiguous:
  - Orch should fall back to the `70-89%` options band or `<70%` clarification band

## 6. Example Failure This Story Must Prevent

### Scenario

- prior turns discuss creating `story-1.16`
- user then says: `@orch-agent create story 1.16`

### Correct Orch behavior

- detect high thread continuity
- detect active artifact focus on `story-1.16`
- inspect actual story status and artifact maturity
- infer this is a continuation of story-creation work
- route to `/make-story`
- avoid direct ad-hoc story creation outside workflow

### Wrong behavior

- ignore prior turns
- over-read the short current turn
- bypass `/make-story`
- write a story directly “by instinct”

## 7. Acceptance Criteria

- **AC1:** Orch has an explicit context-first routing policy documented in canonical agent/runtime surfaces.
- **AC2:** Routing evaluates recent conversation context before final action selection.
- **AC3:** A scoring model exists for context, source-of-truth, routing-fit, and current-turn wording.
- **AC3b:** The scoring model explicitly distinguishes internal `context scoring` from external `confidence threshold` behavior.
- **AC4:** Story/epic/spec creation requests in an active thread route deterministically to canonical planning workflows instead of direct ad-hoc artifact writing.
- **AC4b:** When a story/epic is referenced in a primary-flow thread, Orch inspects actual artifact status and readiness before deciding between `/make-story`, `/plan`, or `/code`.
- **AC5:** Orch can explain *why* it routed a request using context evidence, not only keyword evidence.
- **AC6:** The new policy explicitly distinguishes:
  - thread continuation
  - source-of-truth match
  - local trigger match
- **AC6b:** The new policy incorporates story/artifact maturity and canonical-workflow compliance as part of confidence building.
- **AC7:** A regression test scenario is documented for the `story-1.16` style failure.

## 8. Task Breakdown

| Task | Description | Maps To |
|---|---|---|
| T1 | Update canonical Orch policy to require context-first routing | AC1 |
| T2 | Extend routing engine with recent-thread/context scoring inputs | AC2, AC3 |
| T3 | Add explicit scoring/explanation output to route decisions and separate it from action-threshold policy | AC3, AC3b, AC5 |
| T4 | Add deterministic guardrails for story/spec/epic creation flows using artifact status and readiness checks | AC4, AC4b, AC6b |
| T5 | Add regression scenario for `create story 1.16` after prior thread context | AC7 |
| T6 | Document how thread continuity, source-of-truth status, and current-turn wording compete in the final route decision | AC5, AC6, AC6b |

## 9. Expected Outputs

- updates to `orch-agent.md`
- routing-engine/runtime changes
- scoring/explanation fields in route decision output
- regression fixture or documented replay scenario
- updated story/sprint references

## 10. Notes

- This story should reduce “keyword coercion” and increase context-sensitive inference.
- The goal is not just better NLP labeling, but better orchestration judgment.
- Orch should feel like it is following the thread of work, not reacting as a stateless router on every turn.
