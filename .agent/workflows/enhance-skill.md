---
name: 'enhance-skill'
description: 'Analyze accumulated instincts and evolve existing Skills/Workflows/Agents using Whis'
---

# /enhance-skill — Skill and Capability Evolution Pipeline

> **Agent:** Whis (Capability Management Master)

## Overview
Analyze learned instincts from Machine Memory and evolve existing I-Wish capabilities while preserving legacy BMAD compatibility.

Before proposing an update, merge, split, archive, or rewrite, load `.agent/fragments/capability-authoring-curator-rules.md`, `.agent/fragments/capability-provenance-lineage.md`, and `.agent/fragments/draft-skill-creation-governance.md`. Apply curator lifecycle, trigger-quality, duplicate-risk, context-budget, provenance, lineage, draft-versus-patch routing, and non-destructive approval rules. This workflow may recommend changes or create drafts, but it must not auto-delete, auto-archive, auto-merge, or overwrite canonical `.agent/` assets without explicit approval.

If the overlap target is ambiguous, or if the user is effectively asking “what existing capability or repo should we use for this problem?”, run `research-solution-sources.md` first. Enhancement should start from the best target, not from the first skill that looks vaguely related.

If an instinct cluster or review finding looks skill-shaped but overlaps an existing skill, prefer `patch`, `merge`, `split`, or `rewrite` over creating a new `${IWISH_HOME:-${BMAD_HOME:-~/.iwish}}/generated-skills` draft. Create a new draft skill only when the draft-skill creation gates pass and the related-asset review shows no better existing target.

When evolving an existing capability, preserve existing provenance and append a new `lineage.jsonl` event for candidate creation, evaluation, rejection, promotion, rollback, merge, split, archive, rewrite, supersession, stale source, or sensitive source handling. Do not rewrite old lineage events. If the evolved capability lacks provenance, create a reviewer-visible provenance gap recommendation before promotion.

I-Wish package preservation rules:

- Keep `SKILL.md` as the callable entrypoint.
- Add or refresh `DESIGN.md` when the capability is orchestration-heavy, graph-dependent, or has reverse-sync obligations.
- Keep compatibility aliases in manifest/catalog files rather than re-introducing legacy naming into canonical package bodies.
- Preserve or adopt step-file execution for workflow-shaped and compound capabilities per `.agent/templates/iwish-step-file-standard.md`.

## Steps

1. **Reflection & Input Processing** — Read and execute: `step-e-01-reflection.md`
   - Accept manual triggers OR automated **Auto-Immune System** inputs (from `/fix-bug` Phase 7).
   - If triggered by Auto-Immune, extract the `lesson_learned` and `hotspot_score` to formulate a Draft Skill or Patch.
2. **Clustering** — Read and execute: `step-e-02-clustering.md`
3. **Upgrade & Dual-Run Lab** — Read and execute: `step-e-03-upgrade.md`
   - **CSO Validation Gate**: Explicitly audit the `description` field in the capability's YAML frontmatter. It MUST NOT contain workflow summaries and MUST ONLY contain triggering conditions (symptoms, keywords). If it contains verbs like "generates", "creates", "produces", or "reads", raise a warning flag and rewrite it. Fix any violations before proceeding.
   - **Dual-Run Gate (HSEA-2.4)**: BẮT BUỘC route Draft Skills/Patches through the Dual-Run Evolution Lab. Run parallel evaluations (Inhouse vs Darwinian) and pause at the **Notification Gate** for explicit User Approval before merging.
4. **Commit** — Read and execute: `step-e-04-commit.md`
