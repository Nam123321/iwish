---
name: tdd-red-green-refactor
description: "Core skill for strictly enforcing the TDD (Test-Driven Development) Red-Green-Refactor loop."
inputs:
  - "The task or requirement to implement"
  - "Context of existing files"
outputs:
  - "Working code with covering tests"
  - "Proof of test failure before implementation"
  - "Proof of test passing after implementation"
tags: ["tdd", "workflow", "quality"]
---

# TDD Red-Green-Refactor Workflow

This skill strictly enforces a 3-step prompt process for writing any new functionality or modifying existing behavior. As an AI Agent, you MUST follow this loop exactly as described and NEVER write implementation code before writing the test.

## 🔴 Step 1: RED (Write the Test & See it Fail)

1. **Understand the Goal**: Understand exactly what functionality needs to be added.
2. **Write the Test**: Create a new test case or modify an existing one that asserts the new behavior.
3. **DO NOT WRITE IMPLEMENTATION**: You must not change any implementation code yet.
4. **Run the Test**: Execute the test runner.
5. **Verify Failure**: You MUST see the test fail. If it passes, the test is either testing the wrong thing, or the functionality already exists.

*Self-Correction Checkpoint: Stop and evaluate. Is the test failing for the expected reason?*

## 🟢 Step 2: GREEN (Make the Test Pass)

1. **Write the Simplest Code**: Write the absolute minimum amount of implementation code required to make the failing test pass. Do not worry about elegance or performance yet.
2. **Run the Test**: Execute the test runner again.
3. **Verify Success**: You MUST see the test pass. If it fails, iterate on your implementation code until it passes.

*Self-Correction Checkpoint: Are all previous tests still passing?*

## 🔵 Step 3: REFACTOR (Improve the Code)

1. **Evaluate**: Now that the test passes and protects you against regressions, evaluate the implementation code.
2. **Refactor**: Improve the design, structure, and readability of the code. Remove duplication. Follow DRY (Don't Repeat Yourself) principles.
3. **Run the Tests**: After every refactoring change, run the test suite again.
4. **Verify**: Ensure the refactored code still passes all tests.

## Summary Checklist
- [ ] Did I write the test first?
- [ ] Did I see it fail?
- [ ] Did I write implementation code to make it pass?
- [ ] Did it pass?
- [ ] Did I refactor it?

## System Constraints
- You MUST show the output of the failing test (RED) in your artifact/log before proceeding to the GREEN phase.
- You MUST run the test after implementation to prove it passes.
