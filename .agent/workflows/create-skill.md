---
name: create-skill
description: Build a new Skill, Workflow, or Agent from external knowledge
  sources using capability-agent
---

# /create-skill — Skill and Capability Creation Pipeline

> **Agent:** capability-agent (Capability Management Master)

## Overview
Guided workflow to create new AI capabilities (Skills, Workflows, or Agents) from external knowledge sources.

## 0. Gateways & Initialization

**Concurrency Lock (Hard Gate):**
- **Action:** Sanitize the capability name using regex `^[a-zA-Z0-9_-]{1,64}$`.
- **Action:** Create an atomic lock directory: `mkdir .lock`. If it fails, check the timestamp. If older than 2 hours, prompt the user to override. If not, HALT and report that another pipeline is running.

**State Machine Checkpoint:**
- **Action:** Check for existing `state.json`. If found, prompt the user: "Checkpoint found. Resume or restart?"
- **Action:** If corrupted or unparseable, DO NOT DELETE. Rename to `state.corrupt.json`, HALT the pipeline, and escalate to the user for manual intervention.

## Runtime & Promotion Policy

Use `IWISH_HOME=${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}` for all generated drafts. This workflow MUST create draft artifacts under `${IWISH_HOME}` first, then promote them into canonical repo paths only after explicit approval. `IWISH_HOME` remains a legacy input alias only; new runtime outputs are canonicalized to I-Wish packaging.

Before Step 0 and again during Step 1 triage, load `.agent/fragments/capability-authoring-curator-rules.md`, `.agent/fragments/capability-provenance-lineage.md`, `.agent/fragments/draft-skill-creation-governance.md`, and `.agent/fragments/prompt-engineering.md`. Apply authoring, trigger-quality, duplicate-risk, context-budget, non-destructive curator, provenance, lineage, draft-skill creation, and prompt engineering rules. If the source learning is capability-shaped, follow the Classification Funnel and this workflow instead of saving the procedure as loose memory. If the source mostly patches or overlaps an existing capability, route to `enhance-skill` instead of creating a near-duplicate draft. If the source is skill-shaped, create `${IWISH_HOME}/generated-skills/<name>/` only after the draft creation gates pass.

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

## 1. Hard Gateway Delegation

> [!IMPORTANT]
> **DELEGATION MANTRA:**
> This Master Router serves ONLY to enforce the Zero-Trust Concurrency and State locks. It MUST NOT execute the steps.
> You MUST now immediately read and execute `step-w-01-triage.md` to begin the pipeline.

## 2. Zero-Trust Watchmen Enforcement

When creating any capability that involves generating **Zero-Trust Category A scripts** (e.g. scripts inside `.agent/scripts/`):

1. **Mandatory Injection:** You MUST inject the following lines at the absolute top of the Python script:
   ```python
   import watchmen_core
   watchmen_core.verify_execution(__file__)
   ```
2. **Signature Registration:** You MUST prompt the Admin to run `watchmen_signer.py` to register the script's hash into `.agent/config/scripts-lock.sig`.
3. **Automated Compliance Check:** Before finalizing the workflow, you MUST run the compliance detector:
   ```bash
   python3 .agent/scripts/validate-watchmen-compliance.py --script <path_to_new_script>
   ```
   If this check fails, the workflow is BLOCKED. You must fix the script before ending your turn.
