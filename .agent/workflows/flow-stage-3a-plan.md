---
name: 'flow-stage-3a-plan'
description: 'Stage 3A of the /flow pipeline: PLAN'
---

# /flow-stage-3a-plan

This workflow governs Stage 3A (Plan) of the SDLC.

## Global Macro-Auditor Integration
At Stage 3A, the `project-drift-detector` acts as a **Global Macro-Auditor**.
- **Pre-scan Architecture**: Before drafting `impl-plan.md`, the drift detector must scan the global architecture (using `--mode continuous`) to ensure no orphan/phantom models exist.
- **Test Case Enforcement**: Ensure `impl-plan.md` contains sufficient test cases for FMEA constraints identified by the macro-auditor.

## Stage 4 Review Gate
- In Stage 4, the drift detector serves as the **Secondary Watchmen Gate**. It compares the source code diff against the compiled contract context (`contract-context.json`) and blocks the merge if deviations are found.
