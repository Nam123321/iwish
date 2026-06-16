---
name: 'Tien-Shinhan-simulator-guardian-wrapper'
description: "Use when validating a story's completeness by mentally simulating edge cases, state integrity, and generating the 7-row Hybrid Scorecard."
---

# Tien-Shinhan Simulator Guardian

The **Tien-Shinhan Simulator Guardian** is an adversarial quality assurance skill used during the code review process. It forces the reviewer to perform a "Fat-Guardian Simulator mental run"—a cognitive simulation of how a user or system interaction might fail under stress, edge cases, and typical user errors.

## The 7-row Hybrid Scorecard

When invoked, the agent MUST calculate the EXACT 7-row Hybrid Scorecard based on the classified domain. The scorecard consists of 6 Core Axes and 1 UX Empathy axis. The agent must provide a score (1-10) for each row and a brief justification.

### Scorecard Axes

1. **Functional Correctness (Core Axis 1)**
   - *Criteria:* Does the code implement the intended business logic without regressions?
2. **Data Integrity & State (Core Axis 2)**
   - *Criteria:* Are race conditions, state mutations, and database constraints handled properly?
3. **Security & Validation (Core Axis 3)**
   - *Criteria:* Is input validated? Are boundaries secured against injection or unauthorized access?
4. **Performance & Scalability (Core Axis 4)**
   - *Criteria:* Are there hidden N+1 queries, memory leaks, or inefficient loops?
5. **Error Handling & Recovery (Core Axis 5)**
   - *Criteria:* Does the system fail gracefully? Are errors logged with actionable context?
6. **Architectural Depth & Leverage (Core Axis 6)**
   - *Criteria:* Is the code organized into **Deep Modules**? Is the interface a clean abstraction that provides high leverage? Does the implementation use **Seams** and **Adapters** to decouple dependencies?
7. **UX Empathy (UX Empathy Axis)**
   - *Criteria:* Does the change provide a seamless and intuitive user experience, even during failure states? Does it adhere to the visual and layout principles?

## Architectural DNA Check (Pass/Fail)

Beneath the table, the Guardian MUST perform an explicit pass/fail check against the I-Wish Architectural DNA:

- [ ] **Tracer Bullet?** (Is this a complete Vertical Slice, or just a horizontal layer?)
- [ ] **Deletion Testable?** (Can this module be deleted and its behavior tested through the interface?)
- [ ] **Interface vs Implementation?** (Is the public interface significantly smaller than the logic inside?)

## Output Format

The scorecard MUST be produced directly into the review output using the following markdown table format:

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | [Score] | [Brief justification] |
| Data Integrity & State | [Score] | [Brief justification] |
| Security & Validation | [Score] | [Brief justification] |
| Performance & Scalability | [Score] | [Brief justification] |
| Error Handling & Recovery | [Score] | [Brief justification] |
| Architectural Depth & Leverage | [Score] | [Brief justification] |
| UX Empathy | [Score] | [Brief justification] |

**Rule:** If any score is below 7, or if the **Architectural DNA Check** fails on any item, the review MUST NOT be approved.
