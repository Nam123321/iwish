# Step U-02: Macro Scan

## Purpose
Scan for macro-level unknowns across all 4 quadrants (Unknown Unknowns, Known Unknowns, Unknown Knowns, Known Knowns).

## Execution Engine Instruction (IMPORTANT)
**Native Agent Execution:** The Python scripts here act as **Prompt Generators**. When a script generates a prompt (in JSON/YAML format), you (the Orchestrator Agent) or the Unknowns Analyst Agent MUST read the prompt, use your native LLM reasoning to evaluate the risk against the loaded context, and produce the final findings.

## Steps
1. **Unknown Unknowns (UU):** Run pre-mortem tool ("Why will this product/feature fail in 12 months?"). Classify findings as Tigers (likely) vs Elephants (catastrophic). Use `invoke_subagent` for Unknowns Analyst if needed.
2. **Known Unknowns (KU):** Run assumption-map tool. Generate 2×2 matrix (Importance × Evidence Strength). Flag HIGH importance + LOW evidence assumptions.
3. **Unknown Knowns (UK):** Run competitive-blindspot tool. Scan for tacit knowledge not yet formalized. Check: Are there patterns in existing codebase/docs that suggest unstated assumptions?
4. **Known Knowns (KK):** Run tech-stack-audit tool (or `spec-stack-auditor` for docs). Validate current architecture decisions still hold. Cross-reference with latest benchmarks/community signals.
5. Write all findings to `_iwish-output/unknowns/macro-risks.yaml` with:
   - Unique ID: `MACRO-{YYYYMMDD}-{NNN}`
   - Quadrant tag
   - Confidence score (0.0-1.0)
   - Evidence references
   - Dependent stories/epics (if identifiable)

## Exit Criteria
- [ ] At least 1 finding per quadrant documented
- [ ] All findings written to `macro-risks.yaml`
- [ ] High-risk findings (confidence < 0.5) flagged for user review
- [ ] `.agent/scripts/validate-macro-risks.py` passes

Next, proceed to `step-u-03-micro-scan.md` or `step-u-04-bridge.md` depending on routing.
