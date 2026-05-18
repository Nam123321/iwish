---
epic: epic-gstack
story_id: G.1
status: DONE
phase: "forge"

---
# Story G.1: Build the Classification Funnel & Registry

## 1. Overview
The I-Wish ecosystem requires a deterministic way to manage shared methodologies and skills to avoid Orchestrator hallucination. This story implements the structural foundation ("Governance Framework") by creating the `fragments/` directory and establishing the Central Architecture Registry (`I-Wish-ARCHITECTURE.md`) to map workflows to their required fragments (The "Double-Lock" strategy).

## 2. User Story
**As an** AI System Architect / Orchestrator Agent,
**I want** to establish a Central Architecture Registry and the `.agent/fragments/` folder structure,
**So that** I know exactly which shared methodologies (fragments) to inject into which workflows without relying on LLM guesswork.

## 3. Acceptance Criteria

*   **AC1: Fragments Directory Creation**
    *   **Given** the I-Wish workspace
    *   **When** a developer sets up the environment
    *   **Then** an empty `/.agent/fragments/` directory must exist.

*   **AC2: Central Registry Establishment**
    *   **Given** the need to map workflows to shared context
    *   **When** reviewing the `.agent/` directory
    *   **Then** a `I-Wish-ARCHITECTURE.md` file exists.
    *   **And** it clearly documents the Classification Funnel (Context, Fragment, Skill, Workflow).
    *   **And** it contains a static map of which Workflow requires which Fragment.

*   **AC3: Double-Lock Implementation Standard**
    *   **Given** a workflow execution (e.g., `fix-bug.md`)
    *   **When** the Orchestrator reads the workflow
    *   **Then** the workflow document contains a hardcoded `> [!IMPORTANT]` Markdown block explicitly commanding the agent to load the required fragment via the `view_file` tool.

## 4. Technical Specification

### 4.1. Directory Structure
Create the following directory if it doesn't exist:
```bash
mkdir -p .agent/fragments
```

### 4.2. `I-Wish-ARCHITECTURE.md` Layout
The central registry must be created at `/.agent/I-Wish-ARCHITECTURE.md`. It must contain:

**1. The Classification Matrix & Funnel Criteria:**
The Classification Funnel uses 3 primary criteria to categorize any new piece of knowledge or methodology:
*   **Scope & Autonomy:** Is it a simple rule, a piece of passive knowledge, an active tool, or an end-to-end process?
*   **Execution Context:** Is it "always on" (Context), "injected when needed" (Fragment), "called on demand" (Skill), or "followed step-by-step" (Workflow)?
*   **Reusability:** Is it shared globally or scoped to specific tasks?

Based on these criteria, everything MUST be classified into exactly 4 types, along with strict required actions:

| Category | Funnel Criteria (Tiêu chí phân loại) | Required Action (Hành động bắt buộc) |
| :--- | :--- | :--- |
| **1. Dynamic Context** | **Criteria:** A core behavioral rule or iron law that must always be active (e.g., Anti-Sycophancy, No fake data).<br>**Scope:** Global, Always On. | 1. Inject into the Agent's System Prompt/Preamble, OR <br> 2. Add to Knowledge Graph (`CorePolicy` node) for the Orchestrator to auto-load. |
| **2. Fragment** | **Criteria:** A reusable standard, guideline, or methodology (e.g., UX standards, Test conventions). Not an executable tool, but passive knowledge.<br>**Scope:** Shared across multiple workflows. | 1. Create a `.md` file in `/.agent/fragments/`. <br> 2. Hardcode a `view_file` instruction in the related Workflows' Step 1 (Double-Lock). |
| **3. Skill** | **Criteria:** A fully packaged, specialized, executable task or tool (e.g., Security Audit, Website Cloner).<br>**Scope:** On-demand execution. | 1. Create `SKILL.md` in `/.agent/skills/{skill_name}/`. <br> 2. Register metadata in `skill-graph.yaml` for Semantic Search discovery. |
| **4. Workflow** | **Criteria:** A multi-step, end-to-end process that must be followed sequentially (e.g., Fix Bug, Create PRD).<br>**Scope:** Step-by-step state machine. | 1. Create `workflow.md` in `/.agent/workflows/`. <br> 2. Enforce Step 00 (Load Context) and Final Step (Save Context) for continuous learning. |

**2. The Iron Rule:** Step 00 (Load) and Final Step (Save) requirement for Continuous Learning.

**3. The Master Mapping Table:** 
A centralized, static map that tracks relationships, specifically how Workflows utilize Fragments and Skills. Example:
*   `fix-bug.md` -> requires fragment `test-bootstrap.md`
*   `ui-spec.md` -> requires fragment `ux-principles.md`

### 4.3. Double-Lock Injection Syntax (For Fragments)
To ensure that LLMs do not hallucinate or forget to load **Fragments**, developers must use this exact syntax at the top of their Workflow `.md` files:
```markdown
> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> Before proceeding to Step 1, you MUST use the `view_file` tool to load and read `/.agent/fragments/{fragment_name}.md`. Failure to do so violates the I-Wish architecture.
```

## 5. Tri-Agent LITE Scan Summary
*   **Kira Lite (Data-Piccolo):** No database schema changes. Data is purely markdown documentation and file structure mapping.
*   **Shinji Lite (Data Strategist):** Establishes the core routing map for Grand-Priest orchestrations. Events are strictly file-read operations.
*   **Quinn Lite (Testability):** Validated manually by inspecting token usage and system prompts when triggering a workflow that requires a fragment.

---

## 6. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 9 | Fully addresses the structural needs of the Classification Funnel and Double-Lock strategy. |
| **2. Testability** | 9 | File existence and syntax checks are highly testable via simple scripts or visual inspection. |
| **3. Edge-Case Resilience** | 10 | The Double-Lock strategy explicitly eliminates the LLM "hallucination/laziness" edge case. |
| **4. Consistency** | 10 | Strictly adheres to the I-Wish architecture and standardizes future skill absorptions. |
| **5. Feasibility** | 10 | Purely structural/documentation changes. 100% feasible immediately. |
| **6. Security/Perf** | 9 | Prevents loading unnecessary context, optimizing token usage and performance. |
| **7. UX Empathy** | 8 | Simplifies the mental model for AI Engineers creating new workflows. |
| **TOTAL AVERAGE** | **9.28 / 10** | **PASSED.** (>= 8.5) |
