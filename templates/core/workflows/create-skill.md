---
name: create-skill
description: Build a new Skill, Workflow, or Agent from external knowledge
  sources using capability-agent
---

# /create-skill — Skill and Capability Creation Pipeline

> **Agent:** capability-agent (Capability Management Master)

## Overview
Guided workflow to create new AI capabilities (Skills, Workflows, or Agents) from external knowledge sources.

## Runtime & Promotion Policy

Use `IWISH_HOME=${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}` for all generated drafts. This workflow MUST create draft artifacts under `${IWISH_HOME}` first, then promote them into canonical repo paths only after explicit approval. `IWISH_HOME` remains a legacy input alias only; new runtime outputs are canonicalized to I-Wish packaging.

Before Step 0 and again during Step 1 triage, load `.agent/fragments/capability-authoring-curator-rules.md`, `.agent/fragments/capability-provenance-lineage.md`, and `.agent/fragments/draft-skill-creation-governance.md`. Apply authoring, trigger-quality, duplicate-risk, context-budget, non-destructive curator, provenance, lineage, and draft-skill creation rules. If the source learning is capability-shaped, follow the Classification Funnel and this workflow instead of saving the procedure as loose memory. If the source mostly patches or overlaps an existing capability, route to `enhance-skill` instead of creating a near-duplicate draft. If the source is skill-shaped, create `${IWISH_HOME}/generated-skills/<name>/` only after the draft creation gates pass.

If the user does not provide strong reference material, or if it is unclear whether an internal capability or external repo already solves the problem, run `research-solution-sources.md` first. Do not jump straight into net-new creation when the better move may be `enhance-skill`, `register-skill-pack`, or `absorb-repo`.

Draft targets:

```text
${IWISH_HOME}/generated-skills/<name>/
${IWISH_HOME}/generated-workflows/<name>/
${IWISH_HOME}/generated-agents/<name>/
```

Every draft MUST include `metadata.yaml` with `status: draft`, nested `origin.created_by: create-skill`, `promotion_target`, and `path_policy: runtime` following `.agent/fragments/capability-provenance-lineage.md`.

Every draft MUST also include `lineage.jsonl` and `promotion-plan.md`. `metadata.yaml` and `lineage.jsonl` MUST follow `.agent/fragments/capability-provenance-lineage.md`. Capability bodies MUST keep raw memorygraph, transcript, bug, review, and source-artifact dumps out of the loadable skill/workflow/agent content.

Canonical package expectation for I-Wish:

- Callable capabilities MUST include `SKILL.md`.
- Callable/generated capabilities SHOULD also include `routing-profile.yaml` per `docs/iwish-routing-profile-standard.md`.
- Complex, orchestration-heavy, graph-dependent, or UX-heavy capabilities MUST also include `DESIGN.md`.
- Override-ready capabilities SHOULD include `customize.toml`.
- Workflow-shaped or compound capabilities SHOULD follow `.agent/templates/iwish-step-file-standard.md`.
- New generated capabilities SHOULD also produce an adoption review pack per `docs/iwish-adoption-review-pack-standard.md`, including:
  - `integration-guide.md`
  - `integration-guide.html`
  This pack must summarize use cases, edge cases, stress cases, constraints, routing hints, and review questions for the user.
  When the draft is materialized by runtime automation or follow-up tooling, prefer `iwish generate-review-pack` so the review pack stays consistent with the module/repo intake flow.

## Steps

### Step 0: Quick Rule Scan (Pre-Triage)

Before analyzing the full source document, run a rapid keyword density scan to estimate its complexity and nature:

```bash
# Count directive keywords to estimate "rule density"
grep -cinE '(MUST|SHALL|SHOULD|NEVER|FORBIDDEN|CRITICAL|REQUIRED|MANDATORY)' <source_file>
```

**Interpretation:**
- **Density > 20 rules:** High-constraint document → likely a **Skill** or **Agent** (complex behavioral rules).
- **Density 5–20 rules:** Moderate → likely a **Workflow** (step-by-step process with some constraints).
- **Density < 5 rules:** Low-constraint → likely a **Fragment** (simple reference or principle set).

**Additional extraction:**
```bash
# Extract the top 15 most critical rules for quick preview
grep -inE '(MUST|NEVER|FORBIDDEN|CRITICAL)' <source_file> | head -15
```

This pre-triage informs the classification decision in Step 1 and prevents mis-categorization (e.g., treating a complex behavioral spec as a simple fragment).

Also run a duplicate/related-asset scan before Step 1:

```bash
# Find existing capabilities with overlapping names, triggers, or domain terms
rg -n "<capability-name>|<primary-trigger>|<domain-term>" .agent/skills .agent/workflows .agent/agents .agent/fragments templates/core templates/library
```

If the scan shows strong overlap, classify the request as an enhancement, merge, split, or rewrite candidate using `.agent/fragments/capability-authoring-curator-rules.md` and `.agent/fragments/draft-skill-creation-governance.md` before creating a new draft.

### Step 1: Triage
Read and execute: `step-w-01-triage.md`
*(Use the Quick Rule Scan and duplicate/related-asset scan results above to inform classification)*

### Step 2: Spec
Read and execute: `step-w-02-spec.md`

### Step 2b: RED Phase — Pressure Test
Read and execute: `step-w-02b-red-phase.md`

### Step 3: Forge
Read and execute: `step-w-03-forge.md`

### Step 4: Validate
Read and execute: `step-w-04-validate.md`
