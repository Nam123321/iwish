# Step U-02: Macro Scan

## Goal
Scan for strategic, cross-cutting unknowns and assumptions that could invalidate the product or architecture.

## Instructions
1. Check the `selected_tools` list from Step 1.
2. For each tool in the list that is applicable to macro scope (e.g., `pre-mortem`, `assumption-map`, `pmf-validator`, `competitive-blindspot`, `confidence-scorer`):
   - Invoke the tool's python script via `run_command`. Provide the context files as input.
   - Example: `python3 .agent/scripts/uip-pre-mortem.py --context "path/to/context"`
3. Collect the findings from the tools.
4. If this is a standalone `/unknowns` run, synthesize the findings. If this is an injected run (e.g., inside `/product-strategy`), hold the findings for injection into the host workflow's artifact.

## Exit Criteria
- All macro tools in `selected_tools` have been executed.
- Findings are collected and ready for processing.

Next, proceed to `step-u-04-bridge.md` (or finish Phase 1 execution).
