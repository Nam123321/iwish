---
name: market-research
description: Conduct market research covering market size, growth, competition,
  and customer insights using current web data and verified sources.
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/workflow-market-research.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. **[ZERO-TRUST PRE-PUSH]** Push the user's initial query/intent to NotebookLM (Layer 1). Save MCP response to `_iwish-output/adhoc-workspace/scratch/nlm_evidence_pre_push.json` and validate using `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. HALT if failed.
2. **[BUILD LAYER 2]** Request NotebookLM to compile/build the Layer 2 Research Notebook `RL-1a`.
3. **[PULL & AE ORCHESTRATOR]** Use `/ae-notebook-orchestrator` to cross-query NotebookLM. You MUST save the aggregated analysis to a physical evidence file `_iwish-output/adhoc-workspace/scratch/ae_pull_evidence.json`.
4. **[GENERATE (Evidence-Based)]** FOLLOW THE ABOVE COMMAND FIRST to complete the workflow (`workflow-market-research.md`). You MUST cite data from `ae_pull_evidence.json` when generating the markdown file. No hallucination allowed.
5. **[NAVIGATOR SYNC]** Upon saving output files, explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
6. **[ZERO-TRUST POST-PUSH]** Push the final generated research markdown file back to Notebook Layer 1 (`PC-4`). Save MCP response to `_iwish-output/adhoc-workspace/scratch/nlm_evidence_post_push.json` and validate with `pipeline-integrity-runner.py --target "project" --type project --phase discovery`.
</steps>
