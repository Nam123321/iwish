---
story_id: "story-hsea-3.2-run-trial-scorecard.mdb"
epic_id: "EPIC-HSEA"
title: "Add Human Trial Review Packet and Decision UX"
status: "done"
assignee: "Vegeta"
priority: "P0"
depends_on: ["story-hsea-3.2-run-trial-scorecard.md"]
blocks: ["STORY-HSEA-3.3"]
phase: "forge"
---

# Story HSEA-3.2b: Add Human Trial Review Packet and Decision UX

## 1. Objective

Provide a seamless, visually engaging Human Review Packet UX for Evolution Lab Trials. This enables the human operator to clearly evaluate the Trial Scorecard (Native vs Darwinian candidates) and execute an Approval or Rejection decision directly via chat, which the Agent will reliably capture.

## 1.1 Context & Tracer Bullet

**Tracer Bullet (Vertical Slice):**
1. **Presentation Generation:** A script (`.agent/scripts/generate-trial-html.js`) that reads a `trial-manifest.yaml` and its associated `scorecard.md`, and compiles them into a visually engaging, standalone `trial-review-[id].html` (taking aesthetic inspiration from the Celestial Realm theme in EPIC-NAV).
2. **Interaction Layer:** The user views the HTML file and provides a natural language decision ("Approve" / "Reject") directly to the I-Wish Agent via the chat interface.
3. **State Mutation:** The Agent utilizes its native `replace_file_content` capability to surgically update the `decision` state inside the `trial-manifest.yaml` file from `PENDING` to `APPROVED` or `REJECTED`.

## 2. Acceptance Criteria

*   **AC1:** **Given** a generated `trial-manifest.yaml` and scorecard **When** the human runs `node .agent/scripts/generate-trial-html.js [TRIAL_ID]` **Then** a standalone HTML file is generated at `.agent/evolution-lab/trials/review-[TRIAL_ID].html` with styling that visually contrasts the candidates' scores and highlights any `fatal_degradations`.
*   **AC2:** **Given** the generated review HTML **When** opened in a browser **Then** it renders a premium UI (similar to NAV celestial styling) clearly displaying the `constraint_retention`, `novelty`, and `brevity` metrics.
*   **AC3:** **Given** the human reviews the packet **When** the human tells the Agent "Approve" (or "Reject") **Then** the Agent successfully locates the `trial-manifest.yaml` for that trial and uses `replace_file_content` to change `decision: PENDING` to `decision: APPROVED` (or `REJECTED`).
*   **AC4:** **Given** an invalid state **When** the Agent attempts to update a manifest that is already approved/rejected **Then** it should warn the user instead of overwriting.

## 3. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1, AC2 | Generate rich HTML Review Packet | T1: Implement `generate-trial-html.js` | Create HTML template with celestial CSS; parse YAML/MD to inject data | [ ] |
| AC3, AC4 | Agent state mutation instructions | T2: Test Agent File Edit | Simulate the chat interaction and verify Agent accurately replaces `PENDING` to `APPROVED` in the YAML | [ ] |

## 4. QA Simulator Guardian Audit

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | The dual-layer approach (HTML for viewing, Chat for deciding) perfectly addresses the UX requirement while avoiding heavy UI logic. |
| Data Integrity & State | 9 | Using Agent file replacement carries minor risk, but `replace_file_content` is highly surgical. AC4 mitigates double-approvals. |
| Security & Validation | 10 | Local HTML rendering and file manipulation present no external security risks. |
| Performance & Scalability | 10 | Static HTML generation is instantaneous; zero running servers required. |
| Error Handling & Recovery | 9 | If HTML generation fails, the raw MD scorecard is still available. |
| Architectural Depth & Leverage| 10 | Reuses the aesthetic patterns from Epic NAV and relies on the Agent's inherent toolset (Deletion Test passed: No extra CLI state machine needed). |
| UX Empathy | 10 | Reading code diffs and complex evaluations is vastly improved with a dedicated HTML visualization vs terminal text. |

**Total Average:** 9.71 / 10 - PASS
