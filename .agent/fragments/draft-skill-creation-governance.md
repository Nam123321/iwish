# Draft Skill Creation Governance

> **Purpose:** Decide when I-Wish may create a generated draft skill from session feedback or review evidence, and define the safety gates before that draft can affect canonical `.agent/` behavior.

Use this fragment when session feedback, user corrections, bug fixes, code review findings, learning logs, curator recommendations, or memorygraph/KG clusters appear to justify a new reusable skill. This fragment is governance-only: it does not authorize background schedulers, automatic promotion, template mutation, canonical graph registration, or direct writes into `.agent/skills`.

Load these fragments alongside this one:

- `.agent/fragments/memory-admission-protocol.md`
- `.agent/fragments/capability-authoring-curator-rules.md`
- `.agent/fragments/capability-provenance-lineage.md`

## Draft Creation Decision

Create a draft skill only when all conditions are true:

| Gate | Required Result |
|---|---|
| Memory admission | Candidate is durable, actionable, recurring or high-risk, and has source confidence above speculative. |
| Classification | Candidate is skill-shaped after the Classification Funnel, not workflow-shaped, agent-shaped, fragment-shaped, or compound-shaped. |
| Evidence quality | Evidence comes from repeated user corrections, verified bug/review findings, accepted curator signals, explicit user request, or a high-confidence memorygraph/KG cluster. |
| Existing coverage | No existing skill covers the behavior, or the existing skill is unsuitable after documented duplicate/related-asset review. |
| Reusability | Candidate describes class-level operational behavior, not one project-only note or one-off session preference. |
| Provenance readiness | Candidate can satisfy `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md` requirements from `.agent/fragments/capability-provenance-lineage.md`. |

If any gate fails, do not create a draft skill. Route the candidate using the fallback matrix below.

## Fallback Routing Matrix

| Candidate Signal | Route |
|---|---|
| Stable project convention, architecture decision, or product constraint | `.agent/memory/PROJECT.md` candidate, after memory admission. |
| Stable cross-project user preference | `.agent/memory/USER.md` candidate, never technical authority. |
| Concrete defect pattern or workflow lesson | `.agent/memory/instincts.jsonl`, bug report, learning log, or workflow memory candidate. |
| Small rule or wording patch to an existing skill | `enhance-skill` with `patch` recommendation. |
| Strong overlap with existing skill | `enhance-skill` with `merge`, `split`, or `rewrite` recommendation. |
| Workflow, agent, fragment, or compound-shaped learning | Route to the matching generated capability path, not `${IWISH_HOME}/generated-skills`. |
| Speculative, stale, private, security-sensitive, or weak evidence | Reviewer-visible recommendation only; do not create a draft body unless the user approves handling. |
| Raw logs, transcripts, memorygraph dumps, or source code blobs | Link from source artifacts; do not embed in draft skill bodies. |

## Classification and Duplicate-Risk Rules

Before creating `${IWISH_HOME}/generated-skills/<name>/`, run classification and related-asset checks:

1. Classify the candidate as `skill`, `workflow`, `agent`, `fragment`, or `compound`.
2. Search existing `.agent/skills`, `.agent/workflows`, `.agent/agents`, `.agent/fragments`, and relevant templates for overlapping names, triggers, and domain terms.
3. If overlap is strong, prefer `enhance-skill` over new draft creation.
4. If the candidate spans more than one coherent job, recommend `split` or route to a workflow/compound capability.
5. If `target_type` remains unknown, emit a curator recommendation with `blocked_reason` and wait for human review.

A draft skill must never be used as a workaround for unclear classification.

## Runtime Draft File Contract

Generated skill drafts MUST start under:

```text
${IWISH_HOME}/generated-skills/<name>/
```

Required files:

```text
${IWISH_HOME}/generated-skills/<name>/SKILL.md
${IWISH_HOME}/generated-skills/<name>/metadata.yaml
${IWISH_HOME}/generated-skills/<name>/lineage.jsonl
${IWISH_HOME}/generated-skills/<name>/promotion-plan.md
```

`SKILL.md` must contain operational trigger rules, procedure, anti-patterns, and validation notes. It must not contain raw transcripts, full bug reports, memorygraph dumps, or copied source artifacts.

`metadata.yaml` must follow `.agent/fragments/capability-provenance-lineage.md` and include `status: draft`, `type: SKILL`, `origin`, `provenance`, `path_policy: runtime`, `promotion_target`, and `approval.required: true`.

`lineage.jsonl` must start with a compact `candidate_created` event and remain append-only.

`promotion-plan.md` must explain the intended canonical target, reviewer checklist, validation commands, rollback/recovery notes, and any template or graph updates that would be requested after approval.

Draft creation may not modify:

- `.agent/skills/**`
- `templates/**`
- `.agent/knowledge-graph.yaml`
- canonical workflow references

Those changes require explicit promotion approval.

## Draft Quality Gate

Before a generated draft skill is considered ready for review, validate:

| Check | Requirement |
|---|---|
| Trigger quality | Trigger is specific enough for another agent to know when to load the skill. |
| Scope boundary | Skill solves one coherent operational job and names out-of-scope cases. |
| Frontmatter | `name` and `description` are present and concise. |
| Anti-patterns | Draft states what not to do, including duplicate creation and raw evidence embedding. |
| Best practices | Procedure reuses existing I-Wish fragments/workflows instead of creating parallel rules. |
| Verification | Validation commands or reviewer checks are concrete and runnable when applicable. |
| Provenance | Source refs are compact, confidence is recorded, and sensitive/stale sources are flagged. |
| Lineage | `lineage.jsonl` exists and follows the append-only event contract. |
| Promotion plan | Human approval, canonical target, and rollback/recovery notes are explicit. |
| Context budget | Large references stay on demand; the skill body is loadable without token sprawl. |

Any failed quality check blocks promotion. Low-confidence or sensitive-source drafts may remain reviewer-visible proposals but must not be used as active skills.

## Promotion and Background Review Rules

Promotion is a separate human-approved action. A draft skill may enter canonical `.agent/skills` only after the user approves:

- copying or rewriting canonical skill files;
- updating templates or distribution assets;
- registering KG or MemoryGraph nodes;
- changing workflow references to load the promoted skill.

Background review may emit:

- a curator recommendation;
- a candidate spec;
- a generated draft under `${IWISH_HOME}/generated-skills` if the user or active workflow authorizes draft writing;
- a learning-log or memory pointer.

Background review may not:

- write canonical `.agent/skills`;
- self-promote a generated skill;
- auto-update templates;
- auto-register canonical graph nodes;
- treat source frequency as proof of correctness.

## Recommendation Shape

When a draft is blocked, deferred, or routed away from new-skill creation, emit the Curator Recommendation Contract from `.agent/fragments/capability-authoring-curator-rules.md` with these additions in `proposed_action` or `blocked_reason`:

- whether the candidate failed memory admission, classification, duplicate review, provenance readiness, or quality gate;
- whether it should route to memory, `enhance-skill`, workflow/agent/fragment creation, or human review;
- whether sensitive or stale evidence requires redaction before any draft body is written.
