---
description: 'Step W-02a: Research — Discover Industry Standards (Optional but Recommended)'
---

# Step W-02a: Research — Discover Industry Standards

## Objective
Prevent "reinventing the wheel" by researching how the software industry (e.g., top-tier frameworks, enterprise tools) solves the specific problem before designing the Skill or Workflow.

## Instructions

### 1. User Decision Gate
Before executing any web search or invoking subagents, you MUST ask the user:
> *"Bạn có muốn kích hoạt Deep Research để tìm hiểu tiêu chuẩn ngành (Industry Standards) cho Skill này không? (Có thể tốn thêm token/thời gian)."*

- If the user says **NO** (or Skip): Proceed immediately to Step W-02b.
- If the user says **YES**: Continue with the research below.

### 2. Formulate Research Questions
Based on the `capability-spec.md` drafted in Step W-02, formulate 2-3 targeted research queries.
Focus on:
- How do industry leaders (e.g., Vercel, Stripe, GitHub Actions) handle this workflow?
- What are the established "Design Patterns" or "Standard Operating Procedures (SOP)" for this task?
- Are there known pitfalls or anti-patterns in the industry?

### 3. Execute Research
Use the `search_web` tool or invoke the `/research-agent` to gather information on the formulated queries. 
Do not blindly copy text; synthesize the "Key Learnings".

### 4. Update the Spec
Append a new section `## Industry Standards & Key Learnings` to the `capability-spec.md`.
This section must summarize the best practices that the new Skill MUST enforce.

## Exit Criteria
- [ ] User decision recorded.
- [ ] Research executed (if approved).
- [ ] `capability-spec.md` updated with Industry Standards.
- [ ] Ready to proceed to Step W-02b.


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
