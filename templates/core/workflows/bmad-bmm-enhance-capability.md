---
name: 'enhance-skill'
description: 'Analyze accumulated instincts and evolve existing Skills/Workflows/Agents using Whis'
---

# /enhance-skill — Skill and Capability Evolution Pipeline

> **Agent:** Whis (Capability Management Master)
> **Purpose:** Analyze learned instincts from Machine Memory and use them to upgrade existing BMAD capabilities.

## Overview

This workflow enables Whis to perform periodic evolution cycles:

1. **Reflection** — Read and analyze all unresolved instincts
2. **Clustering** — Group instincts by context tags to find patterns
3. **Upgrade** — Modify existing SKILL.md / instructions.xml with new rules
4. **Commit** — Mark instincts as resolved and report changes

Before proposing an update, merge, split, archive, or rewrite, load `.agent/fragments/capability-authoring-curator-rules.md`, `.agent/fragments/capability-provenance-lineage.md`, and `.agent/fragments/draft-skill-creation-governance.md`. Apply curator lifecycle, trigger-quality, duplicate-risk, context-budget, provenance, lineage, draft-versus-patch routing, and non-destructive approval rules. This workflow may recommend changes or create drafts, but it must not auto-delete, auto-archive, auto-merge, or overwrite canonical `.agent/` assets without explicit approval.

If an instinct cluster or review finding looks skill-shaped but overlaps an existing skill, prefer `patch`, `merge`, `split`, or `rewrite` over creating a new `${BMAD_HOME}/generated-skills` draft. Create a new draft skill only when the draft-skill creation gates pass and the related-asset review shows no better existing target.

When evolving an existing capability, preserve existing provenance and append a new `lineage.jsonl` event for candidate creation, evaluation, rejection, promotion, rollback, merge, split, archive, rewrite, supersession, stale source, or sensitive source handling. Do not rewrite old lineage events. If the evolved capability lacks provenance, create a reviewer-visible provenance gap recommendation before promotion.

## Execution

Follow these steps in order:

### Step 1: Reflection
Read and execute: `step-e-01-reflection.md`

### Step 2: Clustering
Read and execute: `step-e-02-clustering.md`

### Step 3: Upgrade
Read and execute: `step-e-03-upgrade.md`

### Step 4: Commit
Read and execute: `step-e-04-commit.md`
