---
name: validate-prd
description: Validate an existing PRD against I-Wish standards - comprehensive
  review for completeness, clarity, and quality
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/workflow-validate-prd.md, READ its entire contents and follow its directions exactly!


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered after validation.

### PULL + ENRICH: Validate PRD completeness via NotebookLM

1. Load `notebook-retrieval-engine` → Pull from PC-1 + RL-1a + RL-2
2. If validation reveals gaps: Enrich PC-1 with additional context
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
