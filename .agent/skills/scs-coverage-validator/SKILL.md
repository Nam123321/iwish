---
name: "scs-coverage-validator"
description: "Use when evaluating database schema modifications to ensure corresponding business logic implementation and accurate code coverage analysis."
inputs: ["schema_diff_path", "coverage_report_path"]
outputs: ["validation_report"]
mcp_tools_required: []
subagent_triggers: []
---

# SCS Coverage Validator

## When to Use This Skill
- During pull request reviews or feature validation when database schema changes (e.g., migrations, Prisma schema updates) are introduced.
- When validating the Spec Compliance Score (SCS) related to backend logic.
- To ensure that every schema modification has corresponding business logic that is thoroughly tested.

## Core Rules
1. **Schema-Logic Parity:** Any change to database schemas MUST be accompanied by business logic modifications (e.g., models, controllers, services) that utilize the new or modified schema.
2. **Coverage Verification:** You MUST verify that the business logic associated with the schema change is covered by automated tests.
3. **No Orphaned Schemas:** Do not allow schema modifications that are completely unreferenced in the application codebase.

## Execution Guide
To execute this skill, analyze the diff of the schema files and cross-reference them with the updated business logic files and test files. Ensure that the test coverage accurately reflects execution of the new logic.

## Red Flags — STOP and Reconsider
- "The schema is just prepared for future features, we don't need logic yet." (Violation of incremental delivery and schema-logic parity).
- Tests only assert database constraints without invoking business workflows.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| V-01 | Schema modification has corresponding business logic | Category B | Code review semantic check | Agent rationale |
| V-02 | Business logic has test coverage | Category B | Coverage report review | Link to coverage report |
