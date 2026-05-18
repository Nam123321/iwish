# Capability Authoring and Curator Rules

> **Purpose:** Define how I-Wish skills, workflows, agents, and generated capability drafts should be authored, reviewed, curated, and constrained before promotion.

Use this fragment when creating, enhancing, reviewing, or evolving I-Wish capabilities. It is governance-only: it does not authorize background mutation, automatic deletion, automatic archival, or direct canonical `.agent/` overwrites.

## Authoring Checklist

Every new or updated capability MUST have enough structure for another agent to decide when and how to use it without reading the author's mind.

| Area | Required Standard |
|---|---|
| Identity | Clear `name`, short `description`, capability type, owner/origin, and draft/canonical status. |
| Trigger | Specific trigger wording that explains when to load the capability and when not to load it. |
| Scope | A narrow problem boundary, explicit out-of-scope cases, and no hidden expansion into unrelated workflows. |
| Dependencies | Related skills, workflows, fragments, scripts, source artifacts, and required tools are named with repo-relative paths or `${IWISH_HOME}` paths. |
| Related assets | Existing overlapping or upstream capabilities are listed so duplicates can be merged or avoided. |
| Context budget | Large references are summarized; heavy files are loaded on demand; repeated rules are centralized in fragments. |
| Verification | Validation commands, manual review criteria, expected outputs, and failure signals are documented. |
| Source/provenance | The source artifact, user request, memorygraph/KG node, story, or evolution trial that justified the capability is recorded compactly. |

## Trigger Quality and Scope Rules

Before a capability is accepted as a draft or canonical patch, check:

- The trigger is concrete enough that an agent can choose it without guessing.
- The trigger does not overlap strongly with an existing capability unless the story explicitly calls for replacement or merge.
- The body solves one coherent job. If it combines unrelated jobs, split it or route it to a workflow/compound capability.
- Generic advice belongs in a fragment or source artifact, not a new standalone skill.
- Implementation methodology that is skill/workflow/agent-shaped must route through create/enhance capability instead of loose memory.
- If a capability only adds one small rule to an existing asset, prefer `enhance-skill` over creating a new draft.

## Curator Lifecycle

Curator output is a recommendation. It must explain evidence, risk, and next action, but it must not mutate canonical assets by itself.

| Disposition | Meaning | Allowed Next Action |
|---|---|---|
| `keep` | Capability is current, useful, scoped, and non-duplicative. | Leave as-is; optionally add a small note if evidence changed. |
| `pin` | Maintainer or project explicitly protects the capability from archive/merge suggestions. | Skip archive/merge recommendations unless the user asks to reevaluate. Patch suggestions remain allowed. |
| `patch` | Capability is useful but has stale wording, missing guardrails, weak triggers, or incomplete verification. | Create a focused patch proposal or generated draft. |
| `merge` | Capability duplicates another asset or overlaps so much that separate loading wastes context. | Propose a merge target, preserve unique rules, and require approval. |
| `split` | Capability is too broad or spans multiple bounded contexts. | Propose child capabilities or a workflow plus fragments. |
| `archive` | Capability is obsolete, unused, superseded, or unsafe to keep active. | Recommend recoverable archive only; never delete. |
| `rewrite` | Capability intent is valid but structure is too weak for patching. | Create a replacement draft and migration notes; require approval. |

## Curator Recommendation Contract

Any curator or evolution-lab recommendation MUST produce this machine-readable shape before a workflow branches on it:

```yaml
recommendation_id: "<stable-id>"
target_path: "<repo-relative path or ${IWISH_HOME}/generated-* path>"
target_type: "skill|workflow|agent|fragment|compound|unknown"
disposition: "keep|pin|patch|merge|split|archive|rewrite"
evidence_signals:
  - "duplicate-trigger|weak-trigger|missing-frontmatter|broad-scope|large-reference|stale-source|repeated-patch-no-gain|missing-validation|user-pinned|provenance-gap|other"
confidence: 0-10
risk_level: "low|medium|high"
approval_required: true
proposed_action: "<human-readable next action>"
related_assets:
  - "<repo-relative path or ${IWISH_HOME} path>"
recoverability_plan: "<required for merge|archive|rewrite; otherwise 'not_required'>"
provenance_refs:
  - "<story id, memorygraph/KG node, source artifact, or evolution trial id>"
blocked_reason: "<required when no action should be taken; otherwise 'none'>"
```

Contract rules:

- `disposition` MUST use exactly one lifecycle enum from the table above.
- `approval_required` MUST be `true` for `patch`, `merge`, `split`, `archive`, and `rewrite` against canonical `.agent/` assets.
- `recoverability_plan` MUST be concrete for `merge`, `archive`, and `rewrite`.
- `pin` MUST include the user/project protection source in `provenance_refs`.
- `confidence < 7` MUST keep the recommendation reviewer-visible only; it cannot drive automated branching.
- `target_type: unknown` MUST route to human review before any draft or patch is created.

## Review Signals

Deterministic review signals should be gathered before any model-assisted recommendation:

- duplicate or near-duplicate trigger text;
- missing frontmatter or weak description;
- broad body with multiple unrelated procedures;
- large embedded references that should be on-demand;
- stale source links, obsolete commands, or changed paths;
- repeated patch history without improved outcomes;
- missing validation commands or acceptance criteria;
- user pin/protection signal;
- provenance/source gap.

An LLM review may synthesize a recommendation after those signals are available, but it must cite the signals it used and mark uncertainty when evidence is weak.

## Safety and Recoverability Rules

- Do not auto-delete canonical `.agent/` assets.
- Do not auto-archive, auto-merge, or auto-rewrite canonical `.agent/` assets.
- Do not promote `${IWISH_HOME}/generated-*` drafts into `.agent/` without explicit approval.
- Archive recommendations must include the recoverable target path and restore note.
- Merge recommendations must list rules that would be kept, moved, or discarded.
- Rewrite recommendations must keep the old capability available until the replacement is approved.
- Pinned capabilities are protected from archive/merge recommendations unless the user explicitly asks for reevaluation.

## Memory Admission and Routing

Load `.agent/fragments/memory-admission-protocol.md` before turning session learnings into durable memory or generated capabilities.

Capability-shaped learnings MUST route through the Classification Funnel and one of these paths:

- new skill/workflow/agent draft under `${IWISH_HOME}/generated-*` via `create-skill`;
- patch or replacement proposal via `enhance-skill`;
- compact memory pointer only, if useful, after the capability route has been selected.

A high memory admission score is not permission to store implementation methodology as loose memory. Memory can preserve the lesson and source pointer; the reusable procedure belongs in a capability draft or patch.

## Generated Draft Standards

Generated capabilities MUST begin outside canonical `.agent/` paths:

```text
${IWISH_HOME}/generated-skills/<name>/
${IWISH_HOME}/generated-workflows/<name>/
${IWISH_HOME}/generated-agents/<name>/
```

Every generated draft MUST include:

- the proposed capability body;
- `metadata.yaml` with `status: draft`, `origin`, `promotion_target`, and `path_policy: runtime`;
- source/provenance notes sufficient for later lineage work;
- validation or review checklist;
- promotion plan and rollback/recovery note.

## Evolution Lab Constraint Interface

Future evolution-lab candidates must satisfy this fragment as structural constraints before score-based promotion is considered.

| Constraint | Candidate Check |
|---|---|
| Structural validity | Frontmatter, required sections, paths, and validation notes are present. |
| Trigger precision | Trigger is more specific or measurably clearer than baseline. |
| Duplicate risk | Candidate does not create a near-duplicate unless the proposal is explicitly merge/replace. |
| Token budget | Candidate reduces or justifies context load; large references remain on-demand. |
| Regression risk | Candidate preserves required gates, safety rules, and existing approved constraints. |
| Reviewer actionability | Diff, rationale, score signals, and promotion/rollback steps are clear. |
| Provenance readiness | Source artifacts and memorygraph/KG references can be attached by later lineage stories. |

Novelty must not outrank correctness. A candidate with a clever structure but weaker triggers, weaker safety gates, or worse validation should fail.

## Hermes and Darwinian Reference Boundary

Adopt the behavior pattern from Hermes curator and Darwinian-style evolution loops: usage-aware review, stale/duplicate detection, recoverable recommendations, candidate populations, scoring, novelty, and human promotion.

Do not copy Hermes or Darwinian Evolver runtime/source code into I-Wish canonical assets as part of this fragment. Treat them as external pattern references unless a later story approves an adapter after legal/product review.
