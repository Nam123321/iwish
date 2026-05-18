---
epic: EPIC-OPS-01
storyId: STORY-OPS-1.3
status: "Completed"
priority: "P0"
assignee: "Whis"
phase: "forge"

---
# Story 1.3: Build setup-ci-pipeline workflow [DATA: CI_Template] [FLOW-OUT: ops.ci.generated]

## 1. TL;DR
Create the `setup-ci-pipeline.md` workflow file assigned to Agent Krillin. This workflow instructs Krillin to automatically construct an Intelligent Test Selection CI pipeline (`.github/workflows/ci.yml` or GitLab CI equivalent) based on the project's tech stack.

## 2. Context & Problem
In the Day 0 Provisioning phase, setting up CI pipelines manually is repetitive and prone to missing crucial steps (like security scanning or test caching). We want the `setup-ci-pipeline` workflow to empower developers to instantly bootstrap a robust pipeline just by typing a command, letting Krillin do the heavy lifting.

## 3. Technical Requirements & Architectural Constraints
1. **Workflow File Target:** Must be created at `templates/library/ops-pack/workflows/day-0/setup-ci-pipeline.md`.
2. **Metadata Frontmatter:** Must contain standard I-Wish workflow YAML metadata (name, description, assignee).
3. **Core Instruction Logic:** 
   - Detect project stack (Node.js, Go, Python).
   - Generate standard stages: `Lint`, `Test`, `Security Scan`, `Build`.
   - **Intelligent Test Selection:** The generated YAML must contain logic to only run tests on changed files to save CI minutes.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Invoking the Workflow**
- **Given** Krillin is active
- **When** the user runs `setup-ci-pipeline`
- **Then** Krillin requests the user to confirm their preferred CI provider (GitHub Actions or GitLab CI) and the tech stack.

**Scenario 2: Intelligent Pipeline Generation**
- **Given** the user selects GitHub Actions and Node.js
- **When** Krillin executes the workflow instructions
- **Then** Krillin generates `.github/workflows/ci.yml`
- **And** the file includes a step to conditionally run tests using a tool like `nx affected:test` or a git-diff based script.

**Scenario 3: Edge Case Mitigation - Unsupported Stack**
- `[EDGE-CASE]` **Given** a user inputs an esoteric or unsupported tech stack (e.g., Brainfuck)
- **When** Krillin attempts to generate the pipeline
- **Then** Krillin gracefully halts execution, informing the user that the stack is unsupported, and proposes a generic Docker-based pipeline fallback.

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary
- **Edge Cases Detected (Hit):** Esolang/Unsupported Stacks (Mitigated via Generic Docker Fallback).
- **Data Impact (Kira Lite):** Generates static configuration (CI_Template) entirely in codebase. No DB touched.
- **Flow Impact (Shinji Lite):** Produces `ops.ci.generated`. Consumed by source control triggers on pull requests.
- **Testability Check (Quinn Lite):** 3/3 ACs Automatable via unit testing the Krillin instruction set.

## 6. Development Execution Steps (For Whis/Vegeta)
1. Ensure the directory `templates/library/ops-pack/workflows/day-0/` exists.
2. Initialize and write `setup-ci-pipeline.md`.
3. Self-Check: Verify that the workflow file is I-Wish-compliant (XML tags properly wrapping instructions).
4. Mark story as `COMPLETED`.

---
> **Status:** COMPLETED
