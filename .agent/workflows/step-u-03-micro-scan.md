# Step U-03: Micro Scan

## Purpose
Scan story/dev/review-level unknowns using micro tools.

## Execution Engine Instruction (IMPORTANT)
**Native Agent Execution:** The Python scripts for tools act as **Prompt Generators**. When a script generates a prompt (in JSON/YAML format), you (the Orchestrator Agent) or the Unknowns Analyst Agent MUST read the prompt, use your native LLM reasoning to evaluate the risk against the loaded context, and produce the final findings.

## Steps
1. Load target story/spec/PR context.
2. Execute tools selected by filter:
   - **FMEA Scanner** (absorbed from Edge Case Guardian): 8-Pillar taxonomy + RPN scoring
   - **Debiasing Check**: Scan for anchoring bias, confirmation bias, sunk cost in decisions
   - **Drift Detector** (absorbed from Spec Compliance Guardian): Compare spec vs implementation
   - **Deviation Logger**: Capture implementation decisions that deviate from plan
3. For each finding:
   - Assign `MICRO-{YYYYMMDD}-{NNN}` ID
   - Tag with quadrant
   - Check: "Does this micro finding impact any macro assumption?"
   - If yes → link to `MACRO-*` ID, flag for bridge step
4. Write to `_iwish-output/unknowns/unknowns-ledger.yaml`

## Exit Criteria
- [ ] Selected tools executed
- [ ] All findings written to `unknowns-ledger.yaml`
- [ ] Macro-impact links identified (if any)
- [ ] `.agent/scripts/validate-unknowns-ledger.py` passes

Next, proceed to `step-u-04-bridge.md` or `step-u-05-synthesize.md` depending on routing.
