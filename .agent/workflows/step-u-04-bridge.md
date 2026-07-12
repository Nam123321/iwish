# Step U-04: Bridge

## Purpose
Link micro findings to macro assumptions. Detect confidence erosion.

## Execution Engine Instruction (IMPORTANT)
**Native Agent Execution:** The bridge task requires semantic understanding. You (the Orchestrator Agent) or the Unknowns Analyst Agent MUST read the micro findings and macro risks, use your native LLM reasoning to evaluate the impact, calculate confidence adjustments, and update the ledger.

## Steps
1. Load `_iwish-output/unknowns/macro-risks.yaml` and `_iwish-output/unknowns/unknowns-ledger.yaml`.
2. For each micro finding tagged with macro impact:
   - Calculate confidence adjustment: `Δ = -severity × relevance_weight`
   - Update macro assumption confidence: `new_confidence = old_confidence + Δ`
   - Log adjustment in `macro-risks.yaml` under `confidence_history[]`
3. Check cascade thresholds:
   - `confidence < 0.5` → flag for user escalation (step-u-06)
   - `confidence < 0.3` → flag for auto-cascade (step-u-06)
4. Generate bridge report: which macro assumptions are being eroded by micro evidence.

## Exit Criteria
- [ ] All macro-micro links processed
- [ ] Confidence scores updated
- [ ] Cascade flags set (if applicable)
- [ ] Bridge report generated

Next, proceed to `step-u-05-synthesize.md`.
