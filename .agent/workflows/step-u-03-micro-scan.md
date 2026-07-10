# Step U-03: Micro Scan

## Goal
Scan for tactical unknowns, edge cases, and implementation drifts in stories, code, or reviews.

## Instructions
1. Check the `selected_tools` list from Step 1.
2. For each tool in the list that is applicable to micro scope (e.g., `fmea-scanner`, `drift-detector`, `deviation-logger`, `debiasing-check`):
   - Invoke the tool's python script via `run_command`. Provide the context files (e.g. story file, diff) as input.
   - Example: `python3 .agent/scripts/uip-fmea-scanner.py --context "path/to/story.md"`
3. Collect the findings from the tools.

## Exit Criteria
- All micro tools in `selected_tools` have been executed.
- Findings are collected and ready for processing.

Next, proceed to `step-u-04-bridge.md` (or finish Phase 1 execution).
