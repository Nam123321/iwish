---
name: critical-debias-reviewer
description: Enforces adversarial review by mandating contradictory evidence and identifying confirmation bias.
---

# `critical-debias-reviewer`

## Context
When reviewing technical specs or decisions, confirmation bias can lead to accepting weak arguments. This skill acts as an adversarial challenger.

## Execution Rules
1. **Contradictory Evidence Mandate**: Identify at least one piece of evidence or scenario that contradicts the proposed solution's assumptions.
2. **Confirmation Bias Identification**: Scan the document for signs of confirmation bias and flag them.
3. **The "Why Not" Test**: For every major decision, explicitly argue against it.

## Anti-Fabrication Policy
- **Watchmen Injection Score (WIS)**: 8
- **Enforcement Maturity**: High Maturity (Category A gates must be used).
- **Layer 1 Firewall**: The skill enforces strict read-only compliance for inputs unless explicitly approved.

### Category A Gates (Deterministic)
- `validate-contradictory-evidence`: Ensures the review output contains an explicit "Contradictory Evidence" section.
- `bias-keyword-scanner`: Scans for heuristic phrases indicating bias.
