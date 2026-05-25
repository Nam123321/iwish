# Memory Admission Protocol

> **Purpose:** Decide whether a newly discovered lesson should be saved, routed, deferred, or skipped. Use this before writing durable memory or creating a learning/capability candidate.

Admission scoring is different from retrieval filtering:

- **Retrieval filtering** decides what existing memory to load.
- **Admission scoring** decides whether a new candidate deserves durable storage.

## Trigger Stages

| Stage | Trigger | Scoring | Allowed Result |
|---|---|---|---|
| Session start / LOAD Protocol | Agent retrieves prior learnings | No admission scoring; retrieval filtering only | Load up to the relevant prior learnings by tag and confidence. |
| Story creation | Requirements, ACs, Dev Notes, and project context are assembled | Yes | Candidate for `PROJECT.md`, workflow memory, or learning log; no auto-promotion. |
| Vegeta implementation | After task/test completion and before Agent Record finalization | Yes | Candidate for `PROJECT.md`, `instincts.jsonl`, or workflow memory. |
| Fix-bug / SBRP | After Phase 3 RCA and again after Phase 5 fix validation / Phase 7 tracker update | Yes | Candidate for `instincts.jsonl`, bug tracker lesson, workflow memory, or capability-enhancement follow-up. |
| Code review | After findings are calibrated and before review conclusion | Yes | Candidate for `instincts.jsonl`, workflow memory, or governance follow-up. |
| Grand-Priest SAVE phase | After Classification Funnel determines type | Yes | Route to memory only if the learning is not a capability candidate. |
| Whis create-skill Step W-01/W-02 | After capability type triage and spec approval | Routing validation only | Capability knowledge goes to `${BMAD_HOME}/generated-*`, not loose memory. |
| Whis create-skill Step W-04 | After user approves promotion | Meta-learning only | Append promotion meta-instinct after approval, matching existing policy. |
| Whis enhance-skill Step E-01/E-02 | During reflection and clustering | Yes | Cluster/rank instincts; route to `UPDATE_SKILL`, `CREATE_SKILL`, or `UPDATE_WORKFLOW`. |
| Retrospective / incident / QA finding | After evidence is available | Yes | Candidate for `instincts.jsonl`, KG learning, or workflow memory. |
| Background review | After session end, if implemented later | Recommendation-only | Emit candidates; do not modify canonical assets directly. |

Do not run admission scoring before the task/domain is understood, before capability classification when the candidate may be a skill/workflow/agent, inside RAP before RAP artifacts are written, during fix-bug triage before RCA evidence exists, or for raw logs/code dumps/easily rediscovered facts.

## Admission Score

Score each dimension from 0-2:

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

- `-2`: verbose, duplicative, or memory-bloating.
- `0`: normal compact entry.
- `+1`: compact and high-signal.

Thresholds:

- `>= 13`: admit to the correct memory layer after routing checks.
- `10-12`: keep as learning-log candidate or reviewer-visible recommendation.
- `< 10`: skip or keep only in session notes/source artifacts.
- Source Confidence `0`: do not admit to any durable memory store, including `PROJECT.md`, `USER.md`, workflow memory, `instincts.jsonl`, or KG learning. Keep only as session note or source-artifact observation.
- Capability-shaped candidate: route to create/enhance capability flow regardless of score.

## Routing Matrix

| Candidate Type | Destination | Notes |
|---|---|---|
| Stable cross-project user preference | `.agent/memory/USER.md` | Preference only; never technical authority. |
| Project/product constraint, convention, architecture decision | `.agent/memory/PROJECT.md` | Requires strong source confidence or approved artifact reference. |
| Repeated workflow failure or tuning rule | Workflow memory / future `.agent/memory/workflows/*.md` | May become an evolution-lab fixture later. |
| Concrete operational defect pattern | `.agent/memory/instincts.jsonl` | Dense JSONL with `bad`, `good`, `sev`, `ctx`, and `ref`. |
| Bug root-cause pattern or recurrence lesson | `.agent/memory/instincts.jsonl` + bug tracker/report reference | Save after RCA/fix validation, not before. Use `src: fix-bug`. |
| Durable lesson requiring search/reuse | `.agent/learnings/*.md` + KG node | Follow `learning-context-loop.md`; max 3 loaded per session. |
| New skill/workflow/persona/compound methodology | `${BMAD_HOME}/generated-*` via create-skill or enhance-skill | Do not bury as memory. |
| External repo behavior/pattern | RAP DNA/gap-analysis/research artifact | Promote only through approved integration story. |
| Raw evidence/log/code dump | Skip; link to source artifact | Memory stores the lesson, not the dump. |

## Classification Non-Bypass Rule

Admission scoring must never replace BMAD's Classification Funnel. If a candidate is skill-shaped, workflow-shaped, agent-shaped, or compound-shaped, it must route to `create-skill`, `enhance-skill`, or a generated runtime draft under `${BMAD_HOME}`. Memory may store a compact pointer to the candidate, but it must not become the implementation carrier.

## Future Patch Surface Handoff

Later implementation stories should patch these exact surfaces when turning this specification into active workflow behavior:

| Surface | Expected Patch |
|---|---|
| `.agent/workflows/bmad-bmm-create-story.md` | Run admission scoring after story context/Dev Notes identify durable project or workflow lessons. |
| `.agent/agents/vegeta.md` | Run admission scoring after task/test completion and before Agent Record finalization. |
| `.agent/workflows/bmad-bmm-code-review.md` | Run admission scoring after findings are calibrated and before final review output. |
| `.agent/workflows/fix-bug.md` | Run admission scoring after RCA and after fix validation/tracker update, not during triage. |
| `.agent/agents/grand-priest.md` | In SAVE phase, classify learning first, then route memory-shaped candidates through this protocol. |
| `.agent/agents/whis.md` | Apply this protocol before writing instincts and before creating/enhancing capabilities from memory clusters. |
| `.agent/fragments/learning-context-loop.md` | Use admission scoring before creating learning files or KG learning nodes. |

## Hermes Adaptation

Adopt Hermes' useful heuristics: save preferences, durable environment/project facts, conventions, corrections, explicit remember requests, and completed-work lessons; skip trivial facts, rediscoverable knowledge, raw dumps, session-only details, and content already present in context files.

BMAD adds stricter governance: numeric admission scoring, project-first routing, capability classification, graph/source references, no hidden canonical writes, human promotion gates, and memorygraph-backed retrieval for scale.
