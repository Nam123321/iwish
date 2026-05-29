---
name: 'Spec Clarification Policy'
description: 'Enforces inline clarification markers for ambiguous user requirements and defines validation checks to block incomplete specs.'
---

# Spec Clarification Policy & [NEEDS CLARIFICATION] Governance

To prevent AI agents from making assumptions, hallucinating technical details, or implementing incorrect features, this policy enforces a strict inline clarification loop.

---

## Part A: The [NEEDS CLARIFICATION: ...] Marker

When drafting any specifications (including PRDs, User Stories, UI Specs, or Architectural decisions), if the user's instructions are vague, ambiguous, or incomplete, the agent **MUST NOT** guess. Instead, it must write the following standard placeholder inline:

```markdown
[NEEDS CLARIFICATION: exact question for the user]
```

### Examples of Ambiguity:
- Vague UI instructions: *"User can view some stats."*
  - **Correct spec:** `User can view stats [NEEDS CLARIFICATION: Which metrics should be displayed? e.g., daily active users, click-through-rate, or total revenue?]`
- Ambiguous data models: *"Store client details."*
  - **Correct spec:** `Store client details [NEEDS CLARIFICATION: What fields are required for client details? Do we need billing address, tax ID, or just email and phone number?]`

---

## Part B: The Spec Clarification Validation Gate

Before finalizing any design phase, finalizing a story, or transitioning from Planning/Design track to Development track, the validation engine must scan the documents.

1. **Gate Rule:** The workflow **MUST NOT** proceed to `ready-for-dev-agent` status or begin implementation if any `[NEEDS CLARIFICATION` string matches are found in the active PRD, Story, or UI Spec.
2. **Action on Failure:** The validation gate fails with a hard block. The agent must:
   - Identify the exact files and lines where the placeholders remain.
   - List the questions to the user in a consolidated block.
   - Wait for explicit user inputs to resolve them.

---

## Part C: Resolution Protocol

When the user provides responses to the listed questions:
1. The agent must update the relevant files, removing the `[NEEDS CLARIFICATION: ...]` placeholder entirely.
2. Replace it with the concrete requirement matching the user's response.
3. Re-run the validation scan to ensure no other placeholders remain.
