---
name: enhance-skill
description: Analyze accumulated instincts and evolve existing
  Skills/Workflows/Agents using capability-agent
---

# /enhance-skill — Skill and Capability Evolution Pipeline

> **Agent:** capability-agent (Capability Management Master)

## Overview
Analyze learned instincts from Machine Memory and evolve existing I-Wish capabilities while preserving legacy I-Wish compatibility.

## 0. Gateways & Initialization

**Concurrency Lock (Hard Gate):**
- **Action:** Sanitize the capability name using regex `^[a-zA-Z0-9_-]{1,64}$`.
- **Action:** Create an atomic lock directory: `mkdir .lock`. If it fails, check the timestamp. If older than 2 hours, prompt the user to override. If not, HALT and report that another pipeline is running.

**State Machine Checkpoint:**
- **Action:** Check for existing `state.json`. If found, prompt the user: "Checkpoint found. Resume or restart?"
- **Action:** If corrupted or unparseable, DO NOT DELETE. Rename to `state.corrupt.json`, HALT the pipeline, and escalate to the user for manual intervention.

Before proposing an update, merge, split, archive, or rewrite, load `.agent/fragments/capability-authoring-curator-rules.md`, `.agent/fragments/capability-provenance-lineage.md`, and `.agent/fragments/draft-skill-creation-governance.md`. Apply curator lifecycle, trigger-quality, duplicate-risk, context-budget, provenance, lineage, draft-versus-patch routing, and non-destructive approval rules. This workflow may recommend changes or create drafts, but it must not auto-delete, auto-archive, auto-merge, or overwrite canonical `.agent/` assets without explicit approval.

If the overlap target is ambiguous, or if the user is effectively asking “what existing capability or repo should we use for this problem?”, run `research-solution-sources.md` first. Enhancement should start from the best target, not from the first skill that looks vaguely related.

If an instinct cluster or review finding looks skill-shaped but overlaps an existing skill, prefer `patch`, `merge`, `split`, or `rewrite` over creating a new `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-skills` draft. Create a new draft skill only when the draft-skill creation gates pass and the related-asset review shows no better existing target.

When evolving an existing capability, preserve existing provenance and append a new `lineage.jsonl` event for candidate creation, evaluation, rejection, promotion, rollback, merge, split, archive, rewrite, supersession, stale source, or sensitive source handling. Do not rewrite old lineage events. If the evolved capability lacks provenance, create a reviewer-visible provenance gap recommendation before promotion.

I-Wish package preservation rules:

- Keep `SKILL.md` as the callable entrypoint.
- Add or refresh `DESIGN.md` when the capability is orchestration-heavy, graph-dependent, or has reverse-sync obligations.
- Keep compatibility aliases in manifest/catalog files rather than re-introducing legacy naming into canonical package bodies.
- Preserve or adopt step-file execution for workflow-shaped and compound capabilities per `.agent/templates/iwish-step-file-standard.md`.

## 1. Hard Gateway Delegation

> [!IMPORTANT]
> **DELEGATION MANTRA:**
> This Master Router serves ONLY to enforce the Zero-Trust Concurrency and State locks. It MUST NOT execute the steps.
> You MUST now immediately read and execute `step-e-01-reflection.md` to begin the pipeline.

## 2. Zero-Trust Watchmen Enforcement

When enhancing any capability that involves modifying **Zero-Trust Category A scripts** (e.g. scripts inside `.agent/scripts/`):

1. **Mandatory Injection:** You MUST ensure the following lines exist at the absolute top of the Python script:
   ```python
   import watchmen_core
   watchmen_core.verify_execution(__file__)
   ```
2. **Signature Registration:** You MUST prompt the Admin to run `watchmen_signer.py` to update the script's hash in `.agent/config/scripts-lock.sig`.
3. **Automated Compliance Check:** Before finalizing the workflow, you MUST run the compliance detector:
   ```bash
   python3 .agent/scripts/validate-watchmen-compliance.py --script <path_to_modified_script>
   ```
   If this check fails, the workflow is BLOCKED. You must fix the script before ending your turn.
