---
name: rd-evaluate-express
description: Fast-track mode for evaluating low-complexity, low-risk repositories, skipping heavy sandbox testing and deep 5-Lens simulation.
---
# rd-evaluate-express Skill

This skill overrides specific steps in the `/rd-evaluate` workflow for fast evaluation of utility tools, simple UI components, or low-risk libraries.

## Execution Rules
1. **Skip Step 4 (Community Sentiment)**: Rely on Trust Signals from Step 2.
2. **Override Step 6 (5-Lens Simulation)**: 
   - DO NOT run all 5 Lenses. 
   - Instead, simulate ONLY Lens 1 (Department Use Case) with a single, clear use case to confirm basic utility.
3. **Override Step 7 (Sandbox Test)**:
   - Skip MEnvAgent setup and Automated Benchmark.
   - Perform static evaluation based on Step 3 (Source Code Deep Read).
   - Estimate latency/RAM theoretically based on similar stack components.
4. **Output**: Keep the same Gap Analysis (Step 8) and Recommendation (Step 9) but mark the report clearly as `[EXPRESS EVALUATION]`.
