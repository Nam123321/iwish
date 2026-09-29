---
name: "Edge Case Guardian (Review Agent Skill)"
description: >
  Systematically identifies and validates edge cases across technical implementations 
  using the 8-Pillar Edge Case Taxonomy. Grounded in the review-agent persona.
role: absorbed-into-uip
redirect: unknowns-scanner
---

# Edge Case Guardian Skill

## Purpose
Enforces the systematic identification, tracking, and mitigation of edge cases across 8 core dimensions to prevent regressions and handle extreme scenarios gracefully.

## When to Use
- During story creation (`/make-story`) to add edge case Acceptance Criteria (AC).
- During epic quality reviews to verify edge case coverage.
- During functional requirements validation.
- Before code changes to anticipate failure modes.

---

## The 8-Pillar Edge Case Taxonomy

When reviewing specifications or code, evaluate the implementation against the following 8 pillars (detailed in [taxonomy-8-pillars.md](file://{project-root}/.agent/fragments/taxonomy-8-pillars.md)):

| Pillar | Focus | Guiding Question |
|---|---|---|
| **P1** | 🔢 Input Boundary | "What happens at the extremes (min/max/0/null/negative/overflow)?" |
| **P2** | 🔄 State Transition | "What happens in unexpected states (deleted entity, rollback, re-entry)?" |
| **P3** | ⚡ Concurrency | "What happens when two actors modify the same resource simultaneously?" |
| **P4** | 💾 Data Integrity | "Are there risk of desync, orphan records, or timezone/precision errors?" |
| **P5** | 🔌 Integration Failure | "How does the system react if an external API/service fails or times out?" |
| **P6** | 🔒 Permission & Security | "Is there any risk of tenant leakage, role escalation, or IDOR?" |
| **P7** | 🌐 Infrastructure | "How does the system behave when degraded (offline, slow connection, low memory)?" |
| **P8** | ⚖️ Business Rule Conflict| "Do different business rules or promotions contradict each other?" |

---

## Edge Case Analysis Process

### Step 1: Perform the 8-Pillar Scan
Inspect the story or epic and write down potential edge cases for each of the 8 pillars. Tag each identified edge case with the pillar ID (e.g., `[P1]`, `[P5]`).

### Step 2: Draft Acceptance Criteria
For every critical edge case identified, draft corresponding Acceptance Criteria in the story file. Tag them with the `[EDGE-CASE]` prefix.
*Example:*
- `[EDGE-CASE] [P1] When the product quantity in the cart is updated to 0, the item should be removed and the user prompted for confirmation.`

### Step 3: Validate and Verify
During code review or validation phases, verify that tests cover all edge cases documented in the story.
