# Story 3.1: Fast-Track Self-Healing Draft

## 1. Context and Tracer Bullet
**Tracer Bullet:** The vertical slice here encompasses the execution of a Python `subprocess` script that catches stderr output, structures a retry prompt for an LLM agent, and repeats up to 3 times before failing gracefully. This touches the CLI runner (execution layer), error capture (data layer), and prompt generation (communication layer).

## 2. Socratic Review Synthesis
**Business & Integrity Check:**
- **UX Flow/ACs:** Ensures autonomous execution doesn't loop infinitely (hard limit 3 retries) and captures valid stderr.
- **Tracer Bullet Integrity:** Confirmed. The slice is fully vertical from execution output to prompt injection.
- **Edge Cases:** What if the LLM hallucinated fix causes a new error? The retry limit protects against this. What if the error is empty but exit code is non-zero? We must capture stdout + stderr.
*Synthesis Approved.*

## 3. Story Specification
**Title:** Fast-Track Self-Healing Loop implementation
**Description:** Create a system skill `fast-track-self-healing` that automates compilation checks and retries for agent-generated code.
**Tags:** `[CLI]`, `[WORKFLOW]`

### Tasks
- [ ] Task 1: Initialize `.agent/skills/fast-track-self-healing/SKILL.md` with standard I-Wish skill markdown structure.
- [ ] Task 2: Implement the Python Reference script inside the SKILL.md.
- [ ] Task 3: Ensure the script uses `subprocess.run` to capture both stdout and stderr.
- [ ] Task 4: Add logic to limit the loop to exactly 3 retries.
- [ ] Task 5: Add logic to auto-inject the traceback context into the LLM retry prompt.

### Acceptance Criteria
- [x] **AC1:** Capture compilation stderr traces.
- [x] **AC2:** Auto-inject traceback context into LLM prompt.
- [x] **AC3:** Hard limit loops to exactly 3 retries.

## 4. Traceability Matrix & Complexity Check
- **Complexity Score (CS):** 4 (Moderate, mostly script logic)
- **AC-to-Task Mapping:**
  - AC1 -> Task 2, Task 3
  - AC2 -> Task 5
  - AC3 -> Task 4

## 5. Dev Notes
- We will store the skill in `.agent/skills/fast-track-self-healing/SKILL.md` per explicit user request.
- Ensure the Python script is executable and heavily commented.

## 6. QA Simulator Guardian Audit (Hybrid Scorecard)
| Assessment Axis | Score (1-10) | Notes |
| :--- | :---: | :--- |
| **1. Completeness** | 9/10 | Covers all requested ACs; fallback included. |
| **2. State Integrity** | 9/10 | Counter state ensures loop termination. |
| **3. Edge Case Handling**| 8/10 | Mitigates infinite loops; addresses empty stderr. |
| **4. Performance** | 9/10 | Lightweight subprocess call. |
| **5. Security** | 8/10 | Runs agent code; isolated by the agent runtime. |
| **6. Observability** | 9/10 | stderr capture natively surfaces logs. |
| **7. UX Empathy** | 9/10 | Invisible to the user until success/final fail. |
| **TOTAL AVERAGE** | **8.57/10** | **✅ PASS** |

