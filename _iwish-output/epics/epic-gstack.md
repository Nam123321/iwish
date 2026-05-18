---
stepsCompleted: [step-01-understand, step-02-investigate, step-03-generate, step-04-review]
inputDocuments: [gstack_merge_analysis.md, implementation_plan.md]
phase: "origin"

---
# Gstack Absorption & Governance - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the integration of Gstack patterns into the I-Wish (Behavioral Meta-Agent Development) ecosystem. It decomposes the architectural decisions from `gstack_merge_analysis.md` and `implementation_plan.md` into implementable stories, ensuring the system establishes a robust "Context Backbone" and a "Classification Funnel" for all future skill absorptions.

## Requirements Inventory

### Functional Requirements

*   **FR1:** Define and implement the 4-Tier Classification Funnel (Dynamic Context, Fragment, Skill, Workflow).
*   **FR2:** Create a Central Registry (`I-Wish-ARCHITECTURE.md`) and static inclusion hooks to govern the Sharing Mechanism (Double-Lock Strategy).
*   **FR3:** Reclassify and refactor all existing I-Wish skills (`.agent/skills/`) according to the new Funnel.
*   **FR4:** Absorb Wave 1 (Anti-Sycophancy & Learning Context Loop) into King-Kai, Roshi, Hit, `party-mode`, `create-product-brief`, and `brainstorming`.
*   **FR5:** Absorb Wave 2 (Shared Methodologies) by creating `.agent/fragments/` for `test-bootstrap`, `ux-principles`, and `fix-first`.
*   **FR6:** Absorb Wave 3 (Specialized Tasks) by adding `design-consultation` and `canary` as distinct I-Wish Skills.

### NonFunctional Requirements

*   **NFR1:** Maintain deterministic execution without a build-step (No `gen-skill-docs.ts` needed).
*   **NFR2:** Zero context window bloat (Only load fragments when the Central Registry requires it).

### Additional Requirements

*   Must adhere to the Iron Rule of Continuous Learning (Step 00: Load Context, Final Step: Save Context).

### FR Coverage Map

*   Epic 1 covers FR1, FR2, FR3.
*   Epic 2 covers FR4, FR5, FR6.

## Epic List

1.  **Epic 1: The I-Wish Governance Framework (Classification & Double-Lock)**
2.  **Epic 2: Gstack Absorption Waves (Wave 1, 2, 3)**

---

## Epic 1: The I-Wish Governance Framework (Classification & Double-Lock)

Establish the structural foundation to manage Shared Mechanisms, replacing Gstack's script-based template injection with I-Wish's native Agentic Double-Lock approach.

### Story 1.1: Build the Classification Funnel & Registry

As an AI System Architect,
I want to establish a Central Architecture Registry and the `.agent/fragments/` folder structure,
So that orchestrator agents know exactly which shared methodologies to inject into which workflows.

**Acceptance Criteria:**

**Given** the I-Wish workspace
**When** the developer reviews the `.agent/` directory
**Then** a `I-Wish-ARCHITECTURE.md` (or YAML) exists mapping workflows to their required fragments.
**And** an empty `fragments/` directory is created.
**And** the Double-Lock static mapping standard is documented.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite (Data-Piccolo):** Read-only impact on LLM prompt generation.
*   **Shinji Lite (Data Strategist):** Establishes the new routing map for Grand-Priest.
*   **Quinn Lite (Testability):** Can be tested by running `/party-mode` and observing token usage and system prompts.

### Story 1.2: Existing I-Wish Skills Re-Classification

As an AI Developer,
I want to apply the new Classification Funnel to current I-Wish assets (`ux-guardian`, `repo-absorption`, etc.),
So that they are correctly placed as Context, Fragments, Skills, or Workflows.

**Acceptance Criteria:**

**Given** the existing `.agent/skills/` directory
**When** the re-classification script or manual process runs
**Then** pure methodologies are moved to `fragments/`
**And** pure processes are moved to `workflows/`
**And** true skills remain in `skills/`.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite:** File relocation and reference updating across the codebase.
*   **Shinji Lite:** Triggers updates in `skill-graph.yaml`.
*   **Quinn Lite:** Requires unit testing the old slash commands to ensure symlinks or new paths work.

### Story 1.3: Knowledge Graph Indexing Foundation

As an AI System Architect,
I want to adapt and develop the context storage into a structured Knowledge Graph with indexing (similar to featuregraph),
So that we ensure optimal retrieval, logical linking between contexts and skills, and avoid context window bloat.

**Acceptance Criteria:**

**Given** the need to store and retrieve agent learnings and dynamic skills
**When** the Learning Context Loop triggers (Save/Load) or a Skill is queried
**Then** the data must be stored and indexed in a Knowledge Graph format.
**And** it must support Semantic Search / retrieval for optimal token usage and logical relationship mapping.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite (Data-Piccolo):** Defines the schema and indexing structure for the Knowledge Graph nodes and edges.
*   **Shinji Lite:** Connects the search and retrieval logic to the Orchestrator's Step 00 and Skill discovery.
*   **Quinn Lite:** Validates data retrieval accuracy via isolated search queries and tests context loading.

---

## Epic 2: Gstack Absorption Waves (Wave 1, 2, 3)

Execute the multi-wave integration of Gstack's highest priority patterns (P0-P1) into the newly established I-Wish Governance Framework.

### Story 2.1: Wave 1 - Anti-Sycophancy & Learning Context Loop

As an Orchestrator Agent,
I want to inject "Office Hours" pushback rules and the "Context Save/Restore" loop into my prompt,
So that I provide adversarial feedback and continuously learn across sessions.

**Acceptance Criteria:**

**Given** a workflow execution (e.g., `/create-product-brief` or `/party-mode`)
**When** the agent generates a response
**Then** it must NOT use banned sycophantic phrases (e.g., "Great idea!").
**And** it must explicitly query the Knowledge Graph at Step 00.
**And** it must explicitly append new learnings at the Final Step.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite:** Dependency on `Knowledge/` graph folder IO.
*   **Shinji Lite:** Event flow out: Write to KG.
*   **Quinn Lite:** Hard to automate test; requires manual verification of agent tone.

### Story 2.2: Wave 2 - Shared Methodologies (Fragments)

As an AI Developer,
I want to extract Gstack's `test-bootstrap`, `ux-principles`, and `fix-first` into I-Wish Fragments,
So that workflows like `fix-bug` and `code-review` can seamlessly include them.

**Acceptance Criteria:**

**Given** the `.agent/fragments/` directory
**When** Wave 2 is completed
**Then** `test-bootstrap.md`, `ux-principles.md`, and `fix-first.md` exist.
**And** `fix-bug.md` and `code-review.md` contain hardcoded `> [!IMPORTANT]` blocks to read these fragments.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite:** N/A (Markdown file generation).
*   **Shinji Lite:** N/A.
*   **Quinn Lite:** Verify workflows successfully trigger `view_file` on these fragments.

### Story 2.3: Wave 3 - End-to-End Orchestration & Skills

As a user,
I want to use `design-consultation` and `canary` deployment tools,
So that I can leverage Gstack's specialized tasks within I-Wish.

**Acceptance Criteria:**

**Given** the I-Wish terminal
**When** the user invokes `/design-consultation` or `canary` is triggered in CI/CD
**Then** the corresponding `.agent/skills/` are loaded and executed.

**Tri-Agent LITE Scan Summary:**
*   **Kira Lite:** New skill logic addition.
*   **Shinji Lite:** Skill execution routing.
*   **Quinn Lite:** Functional testing of the new skills.

---

## QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 9 | Covers all 6 FRs outlined in the analysis phase. |
| **2. Testability** | 8 | Tone evaluation (Story 2.1) is inherently hard to automate, requires subjective review. |
| **3. Edge-Case Resilience** | 9 | Double-Lock system specifically mitigates LLM hallucination and laziness edge cases. |
| **4. Consistency** | 10 | Strictly adheres to I-Wish file structure and the 4-tier Classification Funnel. |
| **5. Feasibility** | 9 | Fully possible within current I-Wish orchestrator capabilities (using `view_file` and prompt injection). |
| **6. Security/Perf** | 9 | Zero context window bloat ensures performance isn't degraded. |
| **7. UX Empathy** | 9 | Eliminates "yes-man" agent behavior, drastically improving user value in brainstorming. |
| **TOTAL AVERAGE** | **9.0 / 10** | **PASSED.** (>= 8.5) |
