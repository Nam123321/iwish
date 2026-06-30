---
description: 'Step MT-03: Execution — Executed by manual-test.md'
---

# Step MT-03: Execution

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

## Step 2.5: Compliance Pre-Check (MANDATORY)
Before execution, the Agent MUST search for existing `.cjs` or `.spec.ts` test files related to the story.
1. Inspect the files to ensure they comply with Zero-Trust guidelines:
   - They MUST interact with the actual DOM using semantic locators (e.g. `getByRole`, `getByText`).
   - They MUST NOT use fragile locators (`.locator`, `.click('.class')`).
   - They MUST NOT inject fake/mocked API requests or dump mocked strings as evidence.
2. **Override Rule:** If any script violates these rules (is caught "làm màu"), the Agent MUST overwrite it entirely with a proper Zero-Trust compliant Playwright script before proceeding.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
