---
story_id: "STORY-HSEA-4.1"
epic_id: "EPIC-HSEA"
title: "Add Command Registry Consistency Check"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
depends_on: []
phase: "forge"
---

# Story HSEA-4.1: Add Command Registry Consistency Check

## 1. Objective
Define and implement a I-Wish consistency check for command, workflow, and agent menu routing. This prevents command drift by ensuring all referenced slash commands point to valid, existing files within the repository.

## 1.1 Context
The Hermes gap analysis identified central command registry consistency as a MERGE candidate. I-Wish already has many workflow gateways, agent menus, and wrapper references. The risk is drift: a command appears in one surface but points to stale or missing workflow files elsewhere. Instead of building a secondary runtime router, we are building a linter-style consistency checker.

## 2. User Story
As a I-Wish capability maintainer,  
I want a registry consistency check across agent menus and workflow gateways,  
So that command routing does not drift as new capabilities (like HSEA) are added.

## 3. Acceptance Criteria

### AC1: Registry Surfaces Are Identified
**Given** I-Wish has agent menus and workflow gateway files  
**When** the consistency check is defined  
**Then** it scans the following surfaces: `.agent/agents`, `.agent/workflows`, and `_iwish` manifests.

### AC2: Broken References Are Detected
**Given** a menu item or workflow references a slash command or path  
**When** the check runs  
**Then** missing files, stale aliases, duplicate command names, and mismatched descriptions are flagged in a human-readable console output.

### AC3: Dynamic Capability Inclusion
**Given** HSEA or other epics add new commands later  
**When** registry consistency runs  
**Then** those commands are automatically discovered without requiring hardcoded lists.

### AC4: Linter-Style Implementation
**Given** Hermes has a broader command registry  
**When** I-Wish absorbs the pattern  
**Then** I-Wish creates a standalone check script (Node.js preferred for YAML/MD parsing) wrapped in a workflow (`/check-registry`), rather than a new executable router.

## 4. Implementation Tasks

- [x] **Task 1: Create Node.js Registry Scanner Script (`.agent/scripts/check-registry-consistency.js`)**
  - Parse YAML frontmatter and markdown in `.agent/agents/` and `.agent/workflows/`.
  - Extract all slash command mappings and file references.
  - _Traceability: Maps to AC1, AC2_
- [x] **Task 2: Implement Validation Logic**
  - Check file existence for every extracted path.
  - Detect duplicate slash commands across different files.
  - Format output as a readable console report (Warnings/Errors).
  - _Traceability: Maps to AC2, AC3_
- [x] **Task 3: Create Workflow Wrapper (`.agent/workflows/iwish-bmm-check-registry.md`)**
  - Define the `/check-registry` slash command.
  - Wire it to execute the Node.js scanner script.
  - _Traceability: Maps to AC4_

## 5. Dev Notes
- **Tracer Bullet:** The tracer bullet is the complete execution loop where a user invokes `/check-registry`, the script parses the directories, verifies file existence, and outputs a linter-style report of broken references.
- **Why Node.js?** Bash/grep is too brittle for multi-line YAML frontmatter and markdown parsing. Node.js with built-in `fs` and lightweight parsing logic ensures robust extraction of command metadata.
- **Complexity Score:** ~3 (Low/Medium). Standard scripting task without external network dependencies or complex state.

## 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | Meets the requirement of preventing command drift via a deterministic linter check. |
| Data Integrity & State | 9 | Read-only scan; does not mutate state, ensuring safety. |
| Security & Validation | 9 | Wrapped safely in I-Wish's existing script execution patterns; no new runtime engine created. |
| Performance & Scalability | 9 | Node.js filesystem traversal of `.agent` directory will be nearly instantaneous. |
| Error Handling & Recovery | 9 | Broken references are handled gracefully and surfaced as actionable linting errors. |
| Code Quality & Maintainability| 9 | Replaces manual inspection with an automated, scalable tool. |
| UX Empathy | 9 | Developers get instant feedback on broken slash commands instead of hitting runtime "file not found" errors. |

**Total Average:** 9.00 / 10 - PASS
