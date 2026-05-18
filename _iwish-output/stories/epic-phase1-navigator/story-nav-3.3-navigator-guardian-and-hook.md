---
epic: "epic-phase1-navigator"
story_id: "nav-3.3"
title: "Navigator Guardian Skill & Explicit Workflow Injection"
status: "done"
phase: "forge"

depends_on:
  - "story-nav-2.1-sync-engine.md"
---
# Story NAV-3.3: Navigator Guardian Skill & Explicit Workflow Injection

## Context
As a Project Member, I want the Idea Navigator dashboard to automatically stay up-to-date with the latest markdown changes from Phase 1 without manual intervention, so that I always have a fresh visual representation of the project state.

This story focuses on creating the `Navigator-Guardian` wrapper/skill and explicitly injecting a "Post-Step Hook" into Phase 1 analysis workflows (e.g., brainstorming, domain research, product brief) to automatically trigger the `sync-navigator.py` script. The decision to use **Option A (Explicit Workflow Injection)** ensures deterministic flow control and high visibility of the sync process.

## Acceptance Criteria

**AC1: Navigator-Guardian Wrapper**
- **Given** the existing `sync-navigator.py` engine
- **When** executing the sync process
- **Then** a lightweight wrapper script or skill (e.g., `navigator-guardian.sh` or `.agent/skills/navigator-guardian`) must be invoked.
- **And** it must execute `sync-navigator.py`, log the output/errors clearly, and handle any Python execution errors gracefully without bringing down the calling process.
- **[EDGE-CASE] Given** `sync-navigator.py` fails due to strict integrity checks (e.g., missing references) **When** the guardian runs it **Then** it must output a clear warning for the user but allow the parent workflow to conclude successfully.

**AC2: Explicit Workflow Injection**
- **Given** Phase 1 workflows such as `iwish-brainstorming.md`, `iwish-bmm-market-research.md`, `iwish-bmm-domain-research.md`, and `iwish-bmm-create-product-brief.md`
- **When** the workflow reaches its final concluding step
- **Then** an explicit step must be added (e.g., `Step X: Sync Navigator`) that instructs the agent to run the `Navigator-Guardian`.
- **And** this step must be clearly documented in the workflow wrapper markdown so the agent knows to execute it.

## AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Guardian Wrapper | T1: Create Guardian Script | ST1.1 (Create sh/skill wrapper), ST1.2 (Add error handling/logging) | [x] |
| AC2 | Workflow Injection | T2: Inject into Workflows | ST2.1 (Identify target Phase 1 workflows), ST2.2 (Add explicit sync step to each) | [x] |

## Dev Notes
- **Tracer Bullet:** The vertical slice here is triggering the sync script automatically from the completion of a standard AI workflow, updating `navigator-data.js` end-to-end.
- **Scope Restriction:** Do not modify the inner workings of `sync-navigator.py` in this story. Only focus on the wrapper and the workflow YAML/MD files.
- **Previous Integrity:** Ensure that the missing references purged in prior sessions remain clean. The Guardian should alert if new bad references are introduced.

## QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | Explicit injection guarantees execution at the correct lifecycle phase. |
| Data Integrity & State | 9 | Leverages the existing strict sync script; wrapper prevents partial state corruption. |
| Security & Validation | 9 | Local execution only; no dynamic external payload risks. |
| Performance & Scalability | 8 | Running Python takes minimal time (~1-2s), acceptable as a final workflow step. |
| Error Handling & Recovery | 8 | Non-fatal error handling allows the main workflow to finish even if sync fails. |
| Architectural Depth & Leverage | 9 | Option A (Explicit) ensures high visibility and deterministic agent behavior over "magic" hooks. |
| UX Empathy | 9 | Dashboard remains perfectly fresh without burdening the user with manual sync commands. |
**TOTAL AVERAGE:** 8.7/10

### Architectural DNA Check
- [x] **Tracer Bullet?** Yes (End-to-end automation of the sync process).
- [x] **Deletion Testable?** Yes (Workflow steps can be removed without affecting core logic).
- [x] **Interface vs Implementation?** Yes (Guardian script acts as the interface to the Python engine).
