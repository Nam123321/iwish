---
epic: epic-gstack
story_id: G.4
status: DONE
priority: P1
depends_on: []
phase: "forge"

---
# Story G.4: Wave 2 — Shared Methodologies (Fragments)

## 1. Overview

This is the second execution wave from the Gstack Absorption plan (Tier P1). While Wave 1 focused on Core Agent Behaviors (Anti-Sycophancy, Learning Loop), Wave 2 focuses on **Shared Methodologies** — concrete, reusable standards for debugging, reviewing, and testing.

Following the Fragment mechanism established in G.3, these methodologies will be extracted into independent Markdown files (`.agent/fragments/`) and injected into the appropriate workflows (e.g., `/fix-bug`, `/code-review`, `/Vegeta-story`) using hardcoded references.

The targeted methodologies to be absorbed are:
1. **Iron Law of Debugging** (from Gstack `investigate`): No fixes without root cause, 3-strike hypothesis escalation.
2. **Fix-First Review** (from Gstack `review`): Auto-fix mechanical issues, flag architectural issues. Includes Confidence Calibration (1-10).
3. **Test Bootstrap** (from Gstack legacy): Standardized testing principles.
4. **UX Principles** (from Gstack legacy): Standardized UI/UX guidelines.

## 2. User Story

**As a** I-Wish Workflow (specifically `/fix-bug`, `/code-review`, and `/Vegeta-story`),
**I want** to load standardized Shared Methodologies as Fragments at the start of my execution,
**So that** I enforce consistent debugging rigor, review standards, and quality principles across all AI agents.

## 3. Acceptance Criteria

### AC1: Iron Law Debugging Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 2 is completed
*   **Then** `/.agent/fragments/iron-law-debug.md` exists containing:
    *   The Iron Law: "No fixes without a confirmed root cause."
    *   The 3-Strike Hypothesis Escalation rule.
    *   Requirement for structured debug reports.

### AC2: Fix-First Review Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 2 is completed
*   **Then** `/.agent/fragments/fix-first-review.md` exists containing:
    *   The Fix-First Heuristic: Auto-fix mechanical/trivial issues instead of just reporting them.
    *   Ask/Flag rule for architectural or high-risk issues.
    *   Confidence Calibration (1-10) scoring requirement for each finding.
    *   Claim Verification rule ("never say 'likely handled'").

### AC3: Test & UX Principles Fragments Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 2 is completed
*   **Then** `/.agent/fragments/test-bootstrap.md` exists containing baseline testing standards.
*   **And** `/.agent/fragments/ux-principles.md` exists containing baseline UX and design principles.

### AC4: Fragments Injected into Workflows
*   **Given** the new fragments
*   **When** the following workflows are executed:
    *   `/fix-bug`
    *   `/code-review`
    *   `/Vegeta-story` (Quick-Dev / Story Dev)
*   **Then** `/fix-bug` contains a hardcoded instruction to read `iron-law-debug.md` before Phase 5 (Fix).
*   **And** `/code-review` contains a hardcoded instruction to read `fix-first-review.md`.
*   **And** `/Vegeta-story` contains hardcoded instructions to read `test-bootstrap.md` and `ux-principles.md` during relevant coding/testing phases.

### AC5: Knowledge Graph Updated
*   **Given** the four new fragments
*   **When** the story is complete
*   **Then** `/.agent/knowledge-graph.yaml` contains four new nodes representing these fragments.

### AC6: Sprint Status Updated
*   **Given** the story is complete
*   **When** all ACs pass
*   **Then** `sprint-status.yaml` is updated: `STORY-G.4` → `status: done`.

## 4. Technical Specification

### 4.1. `iron-law-debug.md`
**Location:** `/.agent/fragments/iron-law-debug.md`
**Key Elements:**
- **The Iron Law:** Never apply a "band-aid" fix. You must understand exactly why the code failed before changing it.
- **3-Strike Rule:** If you attempt to fix a bug 3 times and fail, you MUST escalate (to Master Agent or user) and stop guessing.
- **Scope Lock:** Do not modify files outside the immediately affected component unless explicitly authorized.

### 4.2. `fix-first-review.md`
**Location:** `/.agent/fragments/fix-first-review.md`
**Key Elements:**
- **Mechanical vs. Architectural:** Fix typos, lint errors, and simple logic bugs automatically. Flag complex architectural flaws for user decision.
- **Confidence Calibration:** Every review finding must include a Confidence Score [1-10]. If Confidence < 7, state your assumptions.
- **No Hallucinated Hand-waving:** Do not assume a dependency "likely handles" an edge case. Verify it using `grep_search` or `find_symbol`.

### 4.3. `test-bootstrap.md` & `ux-principles.md`
**Locations:** `/.agent/fragments/test-bootstrap.md`, `/.agent/fragments/ux-principles.md`
**Key Elements:**
- Standard I-Wish boilerplates for Test (AAA pattern, mocking guidelines) and UX (accessibility, spacing, consistent token usage).

## 5. Tri-Agent LITE Scan Summary

*   **Kira Lite (Data-Piccolo):** Four new markdown files. No schema changes.
*   **Shinji Lite (Data Strategist):** Workflow logic paths updated. Code Review workflow behavior shifts from purely adversarial reporting to proactive fixing (Fix-First). Debug workflow behavior enforces stricter bounds (Iron Law).
*   **Quinn Lite (Testability):** Can be tested by running `/code-review` on a file with minor errors to see if the agent attempts a Fix-First auto-fix vs just complaining.

---

## 7. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 9 | Fully captures the P1 fragment methodology requirements from the Gstack analysis, expanding the stub to include Iron Law and Confidence Calibration. |
| **2. Testability** | 9 | Fragments are explicitly defined. Injection points in workflows are clearly specified. Easy to verify via grep. |
| **3. Edge-Case Resilience** | 9 | Using Fragments instead of Dynamic Context prevents context window bloat. Agents only load them when the workflow explicitly demands it. |
| **4. Consistency** | 10 | Follows the exact pattern validated in G.3 (Fragments + hardcoded workflow injection). |
| **5. Feasibility** | 10 | Requires only markdown file creation and minor workflow file updates. |
| **6. Security/Perf** | 9 | No performance hit unless the workflow is invoked. Safe execution bounds. |
| **7. UX Empathy** | 9 | The Fix-First heuristic significantly improves the user experience by reducing back-and-forth chatter for trivial fixes. |
| **TOTAL AVERAGE** | **9.28 / 10** | **PASSED.** (>= 8.5) |
