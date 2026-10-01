---
name: 'create-ux-design'
description: 'Work with a peer UX Design expert to plan your applications UX patterns, look and feel.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-00-visual-research.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. **Zero-Trust Design Audit Gate:** Before completing the UX design, you MUST run `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase spec`. This verifies the 7-Pass Design Audit score. If the score is below 6/10, the script will fail (exit code 1). If it fails, you MUST HALT and revise the UI design until it meets the minimum threshold.
</steps>

---

> **📘 NotebookLM Integration Hook**
> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered after UX design creation.

### PUSH + CREATE: Create PC-3 (Core-UX)

1. Load `notebook-lifecycle-manager` → Create `{Project}/Core-UX` (PC-3) if not exists
2. Scan `_iwish-output/2. Product Planning/` for files matching `*ui-ux*`, `*ux-spec*`, `*ux-design*` → Push to PC-3 (Replace mode). **Do NOT hardcode filenames.**
3. Load `notebook-cross-query-engine` → Cross-query PC-3 ↔ PC-2 (Architecture alignment)
4. Update `foundation-checklist.yaml`: set `PC-3.status = created`
