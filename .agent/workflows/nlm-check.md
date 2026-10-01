---
description: Lightweight fast-path entry to query the Unified Knowledge Pipeline (UKP)
---
# /nlm-check Workflow

## Purpose
A fast, lightweight workflow designed to execute a quick query against the NotebookLM ecosystem without triggering deep enrichment or scatter/gather processes. This serves as the primary gateway for the "Knowledge-First" research protocol.

## Step 1: Intake & Context Resolution
- Receive the `query` from the user or invoking agent.
- Run `python3 .agent/scripts/resolve-notebook-targets.py --query "<query>"` to deterministically identify the target notebook IDs based on the 4-Layer taxonomy.

## Step 2: UKP Orchestration (Quick Check Mode)
- Invoke `ae-notebook-orchestrator` with the following parameters:
  - `mode`: "quick-check"
  - `query`: The provided query
  - `target_notebooks`: The IDs resolved in Step 1.
- In "quick-check" mode, the orchestrator will:
  1. Bypass deep source enrichment evaluation.
  2. Perform a direct `notebook_query`.
  3. Validate the MCP receipt using `verify-nlm-checked.py`.
  4. Synthesize the answer.

## Step 3: Output & Decision
- If the orchestrator returns a high-confidence answer, present it to the user or invoking agent.
- If the orchestrator returns a "Gap Detected" or low-confidence response, prompt the user/agent:
  > "Knowledge gap detected in UKP. Would you like to escalate to `/nlm-research` for deep enrichment and web search?"
