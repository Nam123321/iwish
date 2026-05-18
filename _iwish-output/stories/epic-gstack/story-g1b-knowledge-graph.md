---
epic: epic-gstack
story_id: G.1.b
status: DONE
phase: "forge"

---
# Story G.1.b: Develop Knowledge Graph & Indexing Foundation

## 1. Overview
As requested by the system architect, the context storage and sharing mechanism must be adapted into a structured Knowledge Graph with an indexing layer (similar to the existing FeatureGraph). This ensures optimal retrieval, logical linking between dynamic contexts and skills, and prevents context window bloat during agent orchestrations via Semantic Search.

## 2. User Story
**As an** AI System Architect / Orchestrator Agent,
**I want** to adapt the context storage into a structured Knowledge Graph with an indexing feature,
**So that** I can ensure optimal data retrieval and maintain logical connections between skills and context without blowing up the context window.

## 3. Acceptance Criteria

*   **AC1: Knowledge Graph Schema Definition**
    *   **Given** the need to store dynamic context and skill metadata
    *   **When** establishing the context backbone
    *   **Then** a schema for the Knowledge Graph nodes and edges must be defined (e.g., `skill-graph.yaml` or equivalent JSON index).

*   **AC2: Indexing Capability**
    *   **Given** a newly absorbed skill or context fragment
    *   **When** it is saved to the system
    *   **Then** it must be indexed for Semantic Search.

*   **AC3: Retrieval Integration (Step 00)**
    *   **Given** the "Load Context" Step 00 of any workflow
    *   **When** the Grand-Priest orchestrator starts
    *   **Then** it uses Semantic Search against the index to load only relevant nodes, preventing context bloat.

## 4. Technical Specification

### 4.1. Index File Structure & Schema
Create a central registry file at `/.agent/knowledge-graph.yaml` to act as the lightweight index for all I-Wish knowledge. The schema MUST strictly follow this structure to enable efficient parsing and semantic search:

```yaml
nodes:
  - id: "fragment-test-bootstrap"
    type: "fragment" # context | fragment | skill | workflow
    path: "/.agent/fragments/test-bootstrap.md"
    description: "Standard conventions for writing unit tests and mocks."
    tags: ["testing", "qa", "jest", "mocking"]
    depends_on: [] # Array of other Node IDs

  - id: "skill-qa-simulator"
    type: "skill"
    path: "/.agent/skills/qa-simulator-guardian.md"
    description: "Executes the Fat-Guardian 7-row Hybrid Scorecard audit."
    tags: ["qa", "audit", "scorecard", "validation"]
    depends_on: ["fragment-test-bootstrap"]
```

### 4.2. The Load/Save Execution Protocol

**1. The LOAD Phase (Step 00):**
The Grand-Priest Orchestrator (or any Agent executing a task) MUST be instructed in its Preamble/System Prompt:
*   *Before* reading entire folders of context, the Agent MUST use `grep_search` or a similar tool to query `/.agent/knowledge-graph.yaml` using keywords related to the user's prompt.
*   The Agent reads the `description` and `tags` of the returned YAML nodes.
*   The Agent then uses `view_file` ONLY on the specific `path`s of the relevant nodes.

**2. The SAVE Phase (Final Step):**
When an Agent derives a new methodology, edge-case mitigation, or skill:
*   The Agent creates the `.md` file in the appropriate directory (based on the Classification Funnel).
*   The Agent MUST append a new node entry to `/.agent/knowledge-graph.yaml` with the correct schema, ensuring future sessions can discover it.

### 4.3. Double-Lock Validation
The Knowledge Graph does not replace the Double-Lock strategy (Story G.1); it augments it. While Workflows still hardcode their mandatory dependencies, the Knowledge Graph allows Agents to dynamically discover *additional* optional Skills or Contexts without human intervention.

## 5. Tri-Agent LITE Scan Summary
*   **Kira Lite (Data-Piccolo):** Establishes the `.yaml` schema serving as the relational database for markdown files. Prevents duplicate context loading.
*   **Shinji Lite (Data Strategist):** Defines the exact routing algorithm: `Keyword Match in YAML -> Extract Path -> View File -> Execute`.
*   **Quinn Lite (Testability):** Highly testable via a simple linter script that verifies every `path` in the YAML actually exists in the filesystem.

---

## 6. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 10 | Fully defines the YAML schema, nodes, edges (depends_on), and the exact Load/Save protocol. |
| **2. Testability** | 9 | The YAML schema is strictly typed and easily verifiable via automated CI scripts. |
| **3. Edge-Case Resilience** | 10 | Directly mitigates the "Context Window Overflow" edge-case by decoupling search (lightweight YAML) from reading (heavy Markdown). |
| **4. Consistency** | 10 | Aligns perfectly with the I-Wish FeatureGraph philosophy, applying it to Agent Context. |
| **5. Feasibility** | 9 | Requires no new infrastructure, just standard text search tools and YAML formatting. |
| **6. Security/Perf** | 10 | Maximizes performance by drastically reducing the tokens sent to the LLM during discovery. |
| **7. UX Empathy** | 9 | Provides a seamless, invisible optimization layer. Developers just drop files and add a YAML block. |
| **TOTAL AVERAGE** | **9.57 / 10** | **PASSED.** (>= 8.5) |
