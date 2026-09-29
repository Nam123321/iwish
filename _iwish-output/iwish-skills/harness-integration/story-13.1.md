# Story 13.1: Architecture Matrix Integration

## Goal
Update the `create-architecture` workflow to include Harness's 6-Pattern Architecture matrix, giving AI agents concrete blueprints when designing multi-agent topologies.

## Acceptance Criteria
- [ ] `.agent/workflows/create-architecture.md` (or its exact I-Wish equivalent) is modified.
- [ ] The workflow includes or references the 6 patterns: Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical Delegation.
- [ ] Guidelines indicate when to use Sub-agents (for isolated tasks without communication overhead) vs Agent Teams (for 2+ agents needing `SendMessage` coordination).

## Implementation Tasks
- **Task 1:** Modify `.agent/workflows/create-architecture.md`. Add a new `<steps>` directive to explicitly inject the 6-Pattern Architecture matrix (Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical Delegation).
- **Task 2:** Include guidance in the workflow file on when to use `Sub-agents` (isolated parallel/sequential tasks) vs `Agent Teams` (requiring `SendMessage` overhead).
- **Task 3:** Ensure the updated workflow correctly cascades these architectural patterns into the underlying `step-03-starter.md` or directly into the generated `architecture.md` document.
