---
name: unknowns-scanner
description: "Lightweight unknowns scanning protocol for embedding in existing workflows. Runs 1-3 tools from the Unknowns Tool Registry and writes to Knowledge Bus. Includes FMEA Scanning and Deviation Logging capabilities."
inputs: [phase, context_file, depth_hint]
outputs: [unknowns-ledger.yaml entries, macro-risks.yaml updates]
mcp_tools_required: []
subagent_triggers: []
---

# Unknowns Scanner (Embedded Skill)

## Purpose
This skill allows existing workflows (like `/make-story`, `/create-prd`) to invoke a lightweight scan for unknowns without triggering the entire `/unknowns` pipeline. It now centralizes risk and deviation analysis by integrating `fmea_scanner` and `deviation_logger` operational modes.

## Execution Rules
1. Call `.agent/scripts/uip-filter.py` with `depth=quick` to get the top priority tools for the provided phase and context.
2. Execute the tools natively. Remember that scripts in the Tool Registry act as Prompt Generators. Use your LLM reasoning to evaluate the prompts against the context.
3. Write findings to `_iwish-output/unknowns/unknowns-ledger.yaml`.
4. If `scope=macro`, write findings to `_iwish-output/unknowns/macro-risks.yaml`.
5. If any finding has a confidence < 0.5 and severity=critical, HALT and present to the user immediately.

## Operational Mode: FMEA Scanning
Use this mode to perform Failure Mode and Effects Analysis (FMEA) on specifications or code.
- **Enforcement Maturity Requirement**: You MUST use the **Hybrid A+B Approach**.
  - **Phase 1 (Type A)**: Execute `.agent/scripts/uip-fmea-scanner.py --context <file> --deep`. This performs a deterministic regex-based analysis for error handling patterns, risks, and missing tests.
  - **Phase 2 (Type B)**: The `--deep` flag generates a YAML prompt template at the end of the script output. You MUST use this generated prompt as instructions for your LLM reasoning to identify *additional* logical failure modes, race conditions, and business rule violations not caught by the regex.
- Calculate the RPN (Risk Priority Number) = Severity × Occurrence × Detection for any newly identified failure modes based on the generated prompt's rubrics.
- Write the final combined findings using the Deviation Logging mode.

## Operational Mode: Deviation Logging
Use this mode to deterministically record deviations, evidence, or risks found during scans (including FMEA findings).
- Execute `.agent/scripts/uip-deviation-logger.py --context <file>` to generate the base structure.
- **Strict Structural Logging**: When appending to the `deviations` list or logging to the `unknowns-ledger.yaml`, you MUST strictly adhere to the following schema:
  - `Risk ID`: Unique identifier for the risk/deviation.
  - `Description`: Clear explanation of the failure mode or deviation.
  - `Severity`: Numerical severity score (1-10).
  - `Citations`: **Mandatory**. You MUST include explicit, physical citations (e.g., exact line numbers, code snippets, or architectural component names). Hallucinated risks without explicit physical citations MUST be rejected.
