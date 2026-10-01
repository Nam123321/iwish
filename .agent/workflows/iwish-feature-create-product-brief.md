---
name: 'create-product-brief'
description: 'Create comprehensive product briefs through collaborative step-by-step discovery as creative Business analyst-agent working with the user as peers.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **ANTI-SYCOPHANCY PREAMBLE (MANDATORY):**
> Before facilitating product discovery, you MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md`. Apply all 6 Forcing Questions before finalizing the brief. Default posture: Constructive Skepticism. Banned Phrases are STRICTLY FORBIDDEN.

> [!WARNING]
> **UNKNOWNS GATE: Pre-Scope Check (MANDATORY)**
> After completing Step 4 (Journeys/Metrics) and before Step 5 (Scope/Domain), you MUST run the `unknowns-scanner` skill with:
> - phase: `discovery`
> - scope: `partial` (2 tools)
> - tools: `risk-scanner --mode assumptions` (extract unverified assumptions from journeys/metrics), `confidence-scorer` (score epistemic confidence of major claims)
>
> Append a `## Unknowns Gate: Pre-Scope Check` section to the brief containing:
> - Assumptions embedded in user journeys that lack evidence
> - Metrics that may be unmeasurable or vanity metrics
> - Domain constraints not yet explored
> - Confidence scores for each major product claim
>
> Write findings to `unknowns-ledger.yaml` with `source_phase: product-brief`.
> If confidence score < 0.4 for any critical claim, HALT and flag for user review before proceeding to scope.

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-02-vision.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to complete the workflow.
2. CRITICAL — NAVIGATOR GUARDIAN SYNC. Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
</steps>


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered at Step 06 (Complete).

### PUSH + FOUNDATION: Initialize PC-4 (Core-Business-GTM)

1. Load `notebook-registry-manager` skill → check if PC-4 exists in `_iwish-output/notebooks/notebook-registry.yaml`
2. If NOT exists: Load `notebook-lifecycle-manager` → create notebook `{Project}/Core-Business-GTM`
3. Load `notebook-request-engineer` → Push product-brief content as text source to PC-4
4. Update `foundation-checklist.yaml`: set `PC-4.status = created`
5. Update `notebook-registry.yaml` with new notebook entry
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
