---
epic: epic-gstack
story_id: G.5
status: DONE
priority: P2
depends_on: []
phase: "forge"

---
# Story G.5: Wave 3 — End-to-End Orchestration & Skills

## 1. Overview

This is the third execution wave from the Gstack Absorption plan (Tier P2). While Wave 1 focused on Core Agent Behaviors and Wave 2 focused on Shared Methodologies (Fragments), Wave 3 focuses on **Operational Polish and Specialized Skills**. 
Specifically, we will integrate `design-consultation` for UX/UI reflection and `canary`/`land-and-deploy` concepts into our orchestration workflows to ensure safer, structured deployments and visual execution.

## 2. User Story

**As an** Orchestrator (Grand-Priest / CI-CD pipeline),
**I want** to integrate `design-consultation` and `canary` deployment tools into I-Wish,
**So that** I can leverage specialized execution capabilities for UX review and structured release management.

## 3. Acceptance Criteria

### AC1: Design Consultation Skill Created
*   **Given** the `/.agent/skills/` directory
*   **When** Wave 3 is completed
*   **Then** `/.agent/skills/design-consultation/SKILL.md` exists containing instructions for a design specialist to review UI/UX components.
*   **And** it is integrated into the `/create-ui-spec` workflow as an optional/required step.

### AC2: Canary & Deploy Tools Integrated
*   **Given** the CI/CD pipeline needs
*   **When** Wave 3 is completed
*   **Then** `/.agent/skills/canary/SKILL.md` and `/.agent/skills/land-and-deploy/SKILL.md` exist containing rollout safety checks and deployment lists.
*   **And** these are integrated into `/party-mode` and `/sprint-status`.

### AC3: Skill Knowledge Graph Updated
*   **Given** the newly created skills
*   **When** the story is complete
*   **Then** `/.agent/knowledge-graph.yaml` is updated to include `design-consultation`, `canary`, and `land-and-deploy`.

### AC4: Sprint Status Updated
*   **Given** the story is complete
*   **When** all ACs pass
*   **Then** `sprint-status.yaml` is updated: `STORY-G.5` -> `status: done`.

## 4. Technical Specification

### 4.1. `design-consultation` Skill
**Location:** `/.agent/skills/design-consultation/SKILL.md`
**Key Elements:**
- Acts as a specialist lens to review UI mockups, tokens, and CSS alignment.
- Emphasizes visual consistency and I-Wish's Master UX flows.

### 4.2. `canary` & `land-and-deploy` Skills
**Location:** `/.agent/skills/canary/SKILL.md`, `/.agent/skills/land-and-deploy/SKILL.md`
**Key Elements:**
- Canary: Validates that a release can be safely deployed to a subset of users or staging environments without regressions.
- Land-and-Deploy: Structured checklist for merging code safely, confirming CI checks, and releasing.

## 5. Tri-Agent LITE Scan Summary

*   **Kira Lite (Data-Piccolo):** Three new skill directories and SKILL.md files. Updates to Knowledge Graph.
*   **Shinji Lite (Data Strategist):** Workflows like `/create-ui-spec` and `/party-mode` incorporate new specialized tool triggers.
*   **Quinn Lite (Testability):** Can be verified by executing `/design-consultation` on a dummy UI file or simulating a canary deploy step in `/party-mode`.

---

## 7. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **Functional Correctness** | 9 | The implementation creates isolated SKILL.md files properly integrated via workflow injection. |
| **Data Integrity & State** | 9 | Modifying the Knowledge Graph correctly links the new capabilities for dynamic discovery without polluting global state. |
| **Security & Validation** | 9 | Canary rules ensure that code is validated safely before wider deploy, boosting infrastructure security. |
| **Performance & Scalability** | 9 | Skills are lazy-loaded via the Knowledge Graph Librarian pattern; no memory impact until invoked. |
| **Error Handling & Recovery** | 9 | Canary deployments explicitly test for failure and allow rollback. |
| **Code Quality & Maintainability** | 9 | Follows the I-Wish SKILL.md directory pattern. Clean separation of concerns. |
| **UX Empathy** | 9 | Design consultation directly elevates the UX standard, while canary deployments prevent end-user disruptions. |
| **TOTAL AVERAGE** | **9.0 / 10** | **PASSED.** (>= 8.5) |
