---
name: unknowns-scanner
description: "Lightweight unknowns scanning protocol for embedding in existing workflows. Runs 1-3 tools from the Unknowns Tool Registry and writes to Knowledge Bus."
inputs: [phase, context_file, depth_hint]
outputs: [unknowns-ledger.yaml entries, macro-risks.yaml updates]
mcp_tools_required: []
subagent_triggers: []
---

# Unknowns Scanner (Embedded Skill)

## Purpose
This skill allows existing workflows (like `/make-story`, `/create-prd`) to invoke a lightweight scan for unknowns without triggering the entire `/unknowns` pipeline.

## Execution Rules
1. Call `.agent/scripts/uip-filter.py` with `depth=quick` to get the top priority tools for the provided phase and context.
2. Execute the tools natively. Remember that scripts in the Tool Registry act as Prompt Generators. Use your LLM reasoning to evaluate the prompts against the context.
3. Write findings to `_iwish-output/unknowns/unknowns-ledger.yaml`.
4. If `scope=macro`, write findings to `_iwish-output/unknowns/macro-risks.yaml`.
5. If any finding has a confidence < 0.5 and severity=critical, HALT and present to the user immediately.
