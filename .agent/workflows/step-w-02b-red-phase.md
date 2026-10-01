---
description: 'Step W-02b: RED Phase — Pressure Test (Adversarial Authoring)'
---

# Step W-02b: RED Phase — Pressure Test (Adversarial Authoring)

## Objective
Apply Adversarial Authoring (TDD-for-Prompts) via Mental Simulation to anticipate and block LLM rationalizations (Silent Bypass) before forging the capability.

## Instructions

### 1. Identify Pressure Scenarios
Based on the `capability-spec.md` from Step W-02, identify 2-3 "Pressure Scenarios" where an LLM is most likely to fail or bypass the intended rules. A Pressure Scenario is a situation that encourages laziness, sycophancy, or shortcutting.

**Examples:**
- The user says "looks good, just approve it" when a thorough audit is required.
- The context length is huge, tempting the LLM to skip steps.
- The rule requires cross-referencing multiple files, tempting the LLM to guess instead of reading.

### 2. Simulate the Baseline (Lazy LLM)
For each Pressure Scenario, mentally simulate how a standard, "lazy" LLM would react WITHOUT this new capability's protection.
- What excuse or rationalization would the LLM give to bypass the rule? **CRITICAL: The simulated excuse MUST be technically specific to the domain of the workflow and NOT a generic LLM refusal statement.**
- Example Domain-Specific Excuse: "Since the user already approved the React component structure, I don't need to cross-reference the UI Figma tokens."
- Example Domain-Specific Excuse: "I'll just summarize the database schema migration instead of generating the up/down SQL because it's standard."

### 3. Draft the Countermeasures (Red Flags)
For each rationalization identified, draft a specific "Red Flag" or "Banned Phrase" that explicitly targets and neutralizes that excuse.

Create the following sections to inject into the `SKILL.md` template in Step W-03:

```markdown
## Red Flags — STOP and Reconsider
- If you find yourself thinking "[Lazy LLM Excuse]", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The user already approved..." | The user's approval does not override the mandatory QA gate. |
```

### 4. Update the Spec
Append these Red Flags and Rationalizations to the `capability-spec.md` so they can be injected into the physical files during Step W-03 (Forge).

## Exit Criteria
- [ ] 2-3 Pressure Scenarios identified.
- [ ] Baseline rationalizations simulated and documented.
- [ ] Countermeasures (Red Flags and Banned Phrases) drafted.
- [ ] `capability-spec.md` updated with the Adversarial Authoring results.
- [ ] Ready to proceed to Step W-03.


## State Machine Checkpoint & Anti-Skip Lock

> [!IMPORTANT]
> **STATE MACHINE UPDATE (MANDATORY):**
> Before exiting this step, you MUST update `state.json` atomically.
> 1. Write updated state (using strict JSON serialization tools) to `state.tmp.json` containing the new phase. The `"phase"` key MUST be validated against the strict Enum of expected phases.
> 2. Execute `mv state.tmp.json state.json`.
> 3. You MUST check for OS-level filesystem errors (e.g., disk full, permission denied) during the `mv` command and gracefully HALT if it fails.

> [!WARNING]
> **ANTI-SKIP LOCK (MANDATORY):**
> You MUST run the following command to validate integrity before proceeding:
> `python3 .agent/scripts/pipeline-integrity-runner.py --target "<capability_name>" --phase "<current_phase>"`
> - **Circuit Breaker:** If this script fails (non-zero exit), you MUST immediately HALT, report the error to the user, and do not retry more than 3 times. Do not silently ignore it.
