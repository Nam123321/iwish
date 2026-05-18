---
story_id: "STORY-HSEA-2.3"
epic_id: "EPIC-HSEA"
title: "Define Darwinian External Reference Boundaries"
status: "done"
assignee: "Vegeta"
priority: "P0"
depends_on: ["STORY-HSEA-2.1", "STORY-HSEA-2.2"]
blocks: ["STORY-HSEA-2.4", "STORY-HSEA-3.1"]
phase: "origin"
---

# Story HSEA-2.3: Define Darwinian External Reference Boundaries

## 1. Objective

Define the compliance, execution, and UX boundaries for utilizing the Darwinian Evolver as an external reference engine within the I-Wish Evolution Lab. Ensure strict compliance with AGPL constraints by avoiding any source code copying or direct linking, relying strictly on a CLI/Subprocess boundary. 

Additionally, define the interactive fallback and installation UX for users who haven't installed the engine but trigger dual-run scopes.

## 1.1 Context & Tracer Bullet

**Tracer Bullet (Vertical Slice):**  
A complete slice for this policy must define:
1. The **Execution Boundary**: How I-Wish communicates with the external engine (CLI/Subprocess adapter).
2. The **Installation UX**: The interactive prompt sequence handling missing installations.
3. The **Degraded Execution Rules**: How trials process missing vs. failed Darwinian runs.

This story creates a machine-readable compliance contract and UX specification. It does NOT write the adapter code (that belongs to the implementation stories in HSEA-3.x).

**Source artifacts:**
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `.agent/fragments/evolution-lab-scoring-policy.md`

## 2. Acceptance Criteria

- **AC1: [Boundary Policy]** The document MUST explicitly define the boundary as a "CLI / Subprocess Adapter" model, strictly forbidding any inline AGPL code imports or REST daemons.
- **AC2: [Interactive Installation UX]** The policy MUST define an interactive prompt flow for missing Darwinian dependencies:
  - If missing, prompt the user with: "Do you want to install Darwinian Evolver? (Provides npm command + reference link)" OR "Do you want the agent to auto-install it?"
- **AC3: [Clean Bypass Rule]** The policy MUST state that if the user explicitly opts out of using/installing Darwinian, the trial proceeds with the I-Wish-native candidate only, and the final scorecard must NOT display a "Darwinian failed/missing" warning (clean bypass).
- **AC4: [Runtime Error Warning Rule]** The policy MUST state that if the user *did* opt-in/install Darwinian, but the subprocess execution fails or returns no result, the trial proceeds with native-only but MUST display a prominent warning in the final scorecard indicating execution failure.
- **AC5: [Contract Location]** The boundary rules and UX flow must be saved as `.agent/fragments/darwinian-boundary-contract.md`.

## 3. Technical Approach & Dev Notes

### 3.1 Execution Boundary
I-Wish will invoke Darwinian Evolver via a strict shell command. The communication contract will consist of:
- **Input:** A JSON payload or a directory path containing the `current_state` and task definitions.
- **Output:** The agent reads `stdout`/`stderr` and parses the resulting output candidate files. 

This guarantees legal isolation.

### 3.2 Installation Prompt Logic
If the command `darwinian` (or the equivalent binary) is not found in the path during a dual-run:
1. Halt execution.
2. Output a prompt offering manual installation instructions (npm package name + documentation link).
3. Offer an automated action for the agent to install it via terminal.
4. Offer a "Skip and run Native only" option.

## 4. Tasks & Traceability

- `[ ]` **Task 1:** Create `.agent/fragments/darwinian-boundary-contract.md`. *(Maps to AC1, AC5)*
- `[ ]` **Task 2:** Document the CLI/Subprocess architecture requirement, explicitly forbidding AGPL inline imports. *(Maps to AC1)*
- `[ ]` **Task 3:** Define the interactive missing-dependency prompt text, options, and branching logic. *(Maps to AC2)*
- `[ ]` **Task 4:** Specify the "Clean Bypass" scorecard condition (no warnings if user opted out). *(Maps to AC3)*
- `[ ]` **Task 5:** Specify the "Runtime Error" scorecard condition (explicit warning if execution fails after opt-in). *(Maps to AC4)*

---

## 5. QA Simulator Scorecard (Fat-Guardian Audit)

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 10 | The boundary strategy directly addresses FR5 and NFR1 (no AGPL copying) by forcing a hard CLI boundary. |
| Data Integrity & State | 9 | The scorecard logic cleanly separates "opt-out" (clean bypass) from "runtime error" (warning), ensuring data truthfulness. |
| Security & Validation | 10 | CLI separation guarantees legal and code sandboxing from the external reference engine. |
| Performance & Scalability | 8 | Subprocess execution is slightly slower than local API, but perfectly acceptable for asynchronous Evolution Lab candidate runs. |
| Error Handling & Recovery | 10 | The exact failure states (missing vs failed execution) have dedicated, graceful recovery paths specified by the user. |
| Code Quality & Maintainability | 9 | Consolidating these rules into a single fragment contract ensures downstream runners (HSEA-3.2) have one source of truth. |
| UX Empathy | 10 | Providing npm links, auto-install options, and suppressing irrelevant warnings provides a highly polished developer experience. |

**Total Average:** 9.42 / 10 - PASS

## 6. Resolution

The contract has been defined and created at `.agent/fragments/darwinian-boundary-contract.md`. 
All Socratic Review conditions (Execution Boundary, Installation UX, Clean Bypass, and Runtime Error Warning) have been incorporated to guide future downstream runners in `HSEA-3.x`. 
Deterministic compiler checks (`tsc --noEmit`) pass. Story completed successfully.
