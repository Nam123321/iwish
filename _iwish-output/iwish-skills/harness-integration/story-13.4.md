# Story 13.4: Incremental Boundary Cross-Checks

## Goal
Adopt Harness's Incremental QA approach, requiring `qa-agent` to validate data contracts dynamically between implementation modules, rather than waiting for the entire feature to be completed.

## Acceptance Criteria
- [x] `.agent/workflows/iwish-feature-dev-story.md` (or QA workflows) is modified to invoke QA incrementally.
- [x] The `qa-agent` guide is updated to prioritize "Boundary Cross-Checks" (e.g., matching API output directly with Frontend hooks) over simple "existence verification".

## Implementation Tasks
- **Task 1:** Modify `.agent/workflows/iwish-feature-dev-story.md` to inject a new `CRITICAL — INCREMENTAL BOUNDARY CROSS-CHECK` gate. This rule will require the implementation agent to invoke `qa-agent` immediately after finishing any boundary module (e.g., API endpoint or UI hook) to validate the data contract, rather than waiting for the entire feature to be completed.
- **Task 2:** Modify `.agent/agents/qa-agent.md` to add a new principle `INCREMENTAL-BOUNDARY-CHECKS: Validate data contracts dynamically between implementation modules (e.g. API vs Frontend) instead of waiting for full feature completion`.
