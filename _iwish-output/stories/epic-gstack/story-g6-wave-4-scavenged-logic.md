---
epic: epic-gstack
story_id: G.6
status: DONE
priority: P1
depends_on: []
phase: "forge"

---
# Story G.6: Wave 4 — Scavenged Logic Integration

## 1. Overview

This story implements the 5 useful logic fragments scavenged from the skipped Gstack skills (Guard, Health, Plan Tune, QA, QA-only, Scrape, Skillify) into the I-Wish ecosystem. The primary focus is integrating the **Plan Tune** heuristics into story generation workflows (`step-03-create-stories.md` and `iwish-bmm-create-story.md`) to measure task complexity and establish a formal Story Split/Merge Protocol. 

Additionally, this story implements Guard's terminal safety timeouts, Health's shell-native static metrics, Scrape's fallback mechanism, and Skillify's pre-triage rule scanning.

## 2. User Story

**As an** Orchestrator Agent (Grand-Priest) and participating technical agents (Vegeta, Piccolo, Whis),
**I want** to integrate the scavenged logic heuristics (Plan Tune scoring, Terminal Safety, Health metrics, Scrape fallbacks, and Skillify rule extraction),
**So that** I can accurately measure and split overly complex stories, safely execute terminal commands, evaluate codebase health effectively, gracefully handle web scraping failures, and quickly triage complex rules from documents.

## 3. Acceptance Criteria

### AC1: Plan Tune Heuristic Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 4 is completed
*   **Then** `/.agent/fragments/plan-tune-heuristic.md` exists containing:
    *   **Heuristic Scoring Table** evaluating 6 dimensions: AC Volume (>8 AC), Data Model Spread (>3 models), UI Surface (>4 components), Cross-Domain (>1 domain), Flow Complexity, Test Burden (>3 tests).
    *   **Threshold logic**: CS ≤ 3 (OK), CS 4-6 (WARN), CS ≥ 7 (HALT).
    *   **Story Split Protocol** defining 6 criteria: Vertical Slice First, Context Boundary Rule, Data Migration Ordering, Single State Machine Rule, Test Isolation, Max 2 Levels Deep.
    *   **Story Merge Criteria** defining 5 signals: Tiny Story, Tight Coupling, Same Model Lock, No User Value, Sequential Dependency.

### AC2: Story Workflows Updated with Plan Tune
*   **Given** the workflows `.agent/workflows/step-03-create-stories.md` and `.agent/workflows/iwish-bmm-create-story.md`
*   **When** Wave 4 is completed
*   **Then** `step-03-create-stories.md` includes Step 3.5 (Plan Tune Heuristic Check) which loads `plan-tune-heuristic.md` to calculate CS and split if CS ≥ 7.
*   **And** `iwish-bmm-create-story.md` includes Step 5.5 (AC-to-Task Traceability Gate) requiring a 1-1 mapping table between ACs and technical tasks, triggering HALT if any AC lacks a task.

### AC3: Guard (Terminal Safety) Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 4 is completed
*   **Then** `/.agent/fragments/terminal-safety.md` exists containing:
    *   Loop guard requiring `MAX_ITERATIONS` or timeouts for `while/for` loops.
    *   Command timeout rule for `run_command`.
    *   No-Watch rule prioritizing `--no-watch` or single-run execution.
    *   Output kill switch for >50,000 characters.

### AC4: Health (Static Code Metrics) Updated
*   **Given** the `.agent/workflows/codebase-health.md` workflow
*   **When** Wave 4 is completed
*   **Then** Step 2.5 (Shell-Native Metrics) is added, instructing the agent to run `find`, `wc -l`, and `sort` commands to identify file counts and top largest files.
*   **And** it includes instructions to optionally use `cloc` and LLM estimation for cyclomatic complexity.

### AC5: Scrape Fallback Protocol Added
*   **Given** the `.agent/skills/clone-website/SKILL.md` file
*   **When** Wave 4 is completed
*   **Then** a "Fallback Protocol" section is appended, directing the agent to use `read_url_content` and `curl -sI` if `chrome-devtools-mcp` is unavailable.

### AC6: Skillify (Pre-Triage Rule Scan) Updated
*   **Given** the `.agent/workflows/create-capability.md` workflow
*   **When** Wave 4 is completed
*   **Then** Step 1 (Triage) includes a "Quick Rule Scan" protocol directing Whis to use `grep` for MUST/SHALL/SHOULD density evaluation before full processing.

## 4. Technical Specification

### 4.1. Fragment: `plan-tune-heuristic.md`
**Location:** `/.agent/fragments/plan-tune-heuristic.md`
**Content:** Defines the Complexity Score (CS) calculation, Story Split/Merge Protocol, and AC-to-Task Traceability Matrix.

### 4.2. Fragment: `terminal-safety.md`
**Location:** `/.agent/fragments/terminal-safety.md`
**Content:** Defensive guidelines for terminal commands to prevent infinite loops and hangs.

### 4.3. Modifying `step-03-create-stories.md`
*   Locate the section after generating stories.
*   Inject the double-lock `view_file` instruction for `plan-tune-heuristic.md` and define the logic to evaluate CS.

### 4.4. Modifying `codebase-health.md`
*   Locate the discovery phase.
*   Inject standard UNIX bash commands (`find`, `wc -l`) to supplement FalkorDB.

### 4.5. Modifying `clone-website/SKILL.md`
*   Append Fallback Protocol logic to the end of the markdown document.

### 4.6. Modifying `create-capability.md`
*   Update step 1 to include the regex heuristic.

## 5. QA Simulator Guardian Audit (Fat-Guardian Mental Run)

**Hybrid Scorecard (7-Axis):**

| Axis | Score | Notes |
|---|---|---|
| 1. Functional Completeness | 9/10 | All scavenged logic features from the Gstack skipped skills are addressed. |
| 2. State & Concurrency | 8/10 | No direct database state changes, but terminal safety prevents execution hangs. |
| 3. Security & Boundaries | 9/10 | Terminal safety strictly reduces the attack surface for runaway agents. |
| 4. Data Integrity & Types | 8/10 | Traceability Matrix enforces strong linkage between requirements and tasks. |
| 5. Edge Cases (8-Pillar) | 9/10 | Handles MCP failures (Scrape) and overly complex stories (Plan Tune). |
| 6. Performance & Scale | 9/10 | Pre-triage (Skillify) uses fast grep instead of slow LLM processing. Shell-native metrics are fast. |
| **7. UX Empathy** | 9/10 | Protects developer UX by keeping stories readable and actionable (Max 8 ACs). |
| **TOTAL AVERAGE** | **8.71/10** | **PASS** |

**Conclusion:** The logic is sound, heavily defensive, and strictly enforces Gstack operational standards.
