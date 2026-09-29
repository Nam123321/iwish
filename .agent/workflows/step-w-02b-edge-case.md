---
description: 'Step W-02b: Edge-Case Guardian — FMEA Risk Analysis & Adversarial Pressure Test'
---

# Step W-02b: Edge-Case Guardian — FMEA Risk Analysis

## Objective
Apply the Edge-Case Guardian (8-Pillar Taxonomy) to anticipate environmental, technical, and logical failures. Output from this step is required to build the Zero-Trust Script's `classify_failure` logic in Step W-03.

## Instructions

### 1. User Decision Gate
Before invoking the Guardian, you MUST ask the user:
> *"Bạn có muốn chạy FMEA Scan qua Edge-Case Guardian để tìm ra các rủi ro hệ thống trước khi sinh code Python không? (Khuyên dùng cho các Skill rủi ro cao)."*

- If the user says **NO** (or Skip): Proceed immediately to Step W-03.
- If the user says **YES**: Continue below.

### 2. Invoke Edge-Case Guardian
Invoke the `review-agent` with the `edge-case-guardian` skill (or run the analysis yourself if authorized).
Target the analysis on the draft `capability-spec.md`.

Focus on the 8 Pillars:
- **Pillar 1: Data Boundaries (Null, Overflows)**
- **Pillar 2: State Transitions (Race Conditions)**
- **Pillar 3: Environment/Network (Timeouts, Locked files, Missing DOM elements)**
- **Pillar 4: Silent Bypass (Lazy LLM rationalizations - previously RED Phase)**

### 3. Generate FMEA Risk Matrix & Red Flags
From the scan, identify 2-3 "Pressure Scenarios" where the agent or the system is most likely to fail.
- For LLM behavioral risks: Draft "Red Flags" (e.g., "If you think 'The user already approved...', STOP. This is a Silent Bypass.").
- For System risks: Draft the `Type 1 (Script Bug)` vs `Type 2 (App Bug)` classification logic.

### 4. Update the Spec
Append the following to `capability-spec.md`:
- `## Red Flags — STOP and Reconsider`
- `## FMEA Identified Risks (For Script Try/Catch Blocks)`

## Exit Criteria
- [ ] User decision recorded.
- [ ] 8-Pillar scan executed (if approved).
- [ ] Red Flags & Failure modes documented.
- [ ] `capability-spec.md` updated.
- [ ] Ready to proceed to Step W-03.
