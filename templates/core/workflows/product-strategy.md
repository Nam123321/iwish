---
name: product-strategy
description: Synthesize all Phase 1 Discovery outputs into a comprehensive Product Strategy document for Go/No-Go decision. Outcome document for agents alongside project-context.
---

# `/product-strategy` — Product Strategy Synthesis

## When to Use

Run **after** all Phase 1 Discovery workflows are complete:

| Prerequisite Workflow | Status Required |
|---|---|
| `/idea-discover` | ✅ Complete |
| `/research` (market + competitor + technical) | ✅ Complete |
| `/idea-challenge` | ✅ Complete |
| `/unique-advantage` (optional) | ⬜ Recommended |

Run **before** `/plan` (PRD creation). This is the strategic gate between Discovery and Planning.

## What This Workflow Owns

Consolidation of **all** discovery artifacts into a single, comprehensive strategic assessment document. This file + `project-context.md` form the **foundational context pair** for every downstream agent (PRD, Architecture, Epics, Sprint Planning).

## Prerequisites — File Verification

Before starting, the agent **MUST** verify these files exist. If any required file is missing, STOP and inform the user which discovery step needs to be completed first.

### Required Files

```
- Canonical: `_iwish-output/1. Idea Discovery/1.1. idea-discovery.md` or fallback to any file matching `*discovery*.md` in `_iwish-output/` resolved dynamically via keyword search.
- Canonical: `_iwish-output/1. Idea Discovery/1.3. idea-challenge-*.md` (or distillate) or fallback to any file matching `*challenge*.md` in `_iwish-output/` resolved dynamically.
- Canonical: `_iwish-output/1. Idea Discovery/1.4. research/market-research.md` or fallback to any file matching `*market-research*.md` in `_iwish-output/` resolved dynamically.
- Canonical: `_iwish-output/1. Idea Discovery/1.4. research/competitor-research.md` or fallback to any file matching `*competitor-research*.md` in `_iwish-output/` resolved dynamically.
- Canonical: `_iwish-output/1. Idea Discovery/1.4. research/technical-research.md` or fallback to any file matching `*technical-research*.md` in `_iwish-output/` resolved dynamically.
```

### Optional Files (enhance quality if present)

```
- Canonical: `_iwish-output/1. Idea Discovery/biz-stack.md` (from `/unique-advantage`) or fallback to any file matching `*biz-stack*.md` resolved dynamically.
- Canonical: `_iwish-output/1. Idea Discovery/1.4. research/domain-research.md` or fallback to any file matching `*domain-research*.md` resolved dynamically.
```

## Execution Steps

### Step 1: Verify Prerequisites

1. Scan `_iwish-output/1. Idea Discovery/` for all required files listed above.
2. If any **required** file is missing → STOP, report which workflow(s) must run first.
3. If all required files exist → proceed. Log which optional files were found.

### Step 2: Load Template

1. Read the template from `.agent/workflows/product-strategy-template.md`.
2. This template defines the 7-Pillar structure the output must follow.

### Step 3: Populate Pillars

For each Pillar in the template, cross-reference the relevant discovery artifacts:

| Pillar | Primary Source(s) |
|---|---|
| 1. Problem & Value Proposition | `idea-discovery.md` |
| 2. Market & Blue Ocean | `market-research.md`, `competitor-research.md` |
| 3. Business Model Canvas | `idea-discovery.md`, `market-research.md`, `biz-stack.md` |
| 4. GTM & Distribution | `market-research.md`, `biz-stack.md` |
| 5. Hypothesis Registry | All discovery artifacts (synthesize assumptions) |
| 6. Four Risks Assessment | `idea-challenge-*.md`, `technical-research.md` |
| 7. Synthesis Decision | All Pillars above (aggregate) |

**Rules for population:**
- Use **direct evidence** from source files. Do NOT hallucinate data.
- Where data is missing, mark the field as `⚠️ DATA GAP — requires [workflow]`.
- Preserve `<!-- source: filename.md -->` comments from the template.
- Add specific quotes or data points from source files where possible.

### Step 4: Compute Verdict

Apply the verdict logic in this exact order:

```
1. Scan Pillar 5 (Hypothesis Registry):
   - IF any hypothesis is ❌ Unverified AND Risk Level = Critical
     → Verdict = PIVOT (or recommend additional targeted research)

2. Compute Pillar 6 (Feasibility Score):
   - Score = average of (Value + Usability + Feasibility + Viability) / 4
   - IF Score < 3.5 → flag `needs-heat`, consider PIVOT

3. Apply final decision:
   - IF no Critical unverified hypotheses AND Score >= 3.5 → GO
   - IF fixable gaps exist → PIVOT (with specific actions)
   - IF fundamental assumptions are invalid → KILL
```

### Step 5: Present for Review

1. Present the completed Product Strategy document to the user.
2. Highlight:
   - The final **Verdict** (GO / PIVOT / KILL)
   - Any **data gaps** that were flagged
   - The **Feasibility Score** and any `needs-heat` flags
3. Ask user to confirm or adjust the verdict.

### Step 6: Route Based on Verdict

| Verdict | Action |
|---|---|
| **GO** | Save document → Route to `/plan` (PRD creation) |
| **PIVOT** | Save document → Route to `/pivot-project` with specific pivot actions |
| **KILL** | Save document → Archive all discovery artifacts under `_iwish-output/archived/` |

## Output

```
`_iwish-output/1. Idea Discovery/product-strategy.md` (or dynamic fallback `_iwish-output/product-strategy.md`)
```

This file becomes a **first-class input** for:
- `/create-prd` (PRD generation)
- `/create-architecture` (system design)
- `/create-epics-and-stories` (implementation breakdown)
- All agent context loading (alongside `project-context.md`)

## Navigator Sync

After completing, invoke `navigator-guardian` to sync the dashboard:
- Update Phase 1 status to reflect strategy completion
- Record verdict and feasibility score
- Update routing recommendations based on verdict

## Error Handling

| Condition | Action |
|---|---|
| Missing required discovery file | STOP — tell user which `/workflow` to run |
| Template file not found | STOP — report missing template |
| All hypotheses unverified | Recommend re-running `/idea-challenge` |
| Score = exactly 3.5 | Treat as borderline — present both GO and PIVOT options to user |
