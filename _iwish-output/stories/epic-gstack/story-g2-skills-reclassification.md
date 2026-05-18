---
epic: epic-gstack
story_id: G.2
status: DONE
phase: "forge"

---
# Story G.2: Existing I-Wish Skills Re-Classification

## 1. Overview
Following the establishment of the Classification Funnel and the Central Architecture Registry in Story G.1, the I-Wish ecosystem currently contains legacy assets that are misclassified. Many files sitting in `.agent/skills/` are actually passive methodologies or templates rather than executable skills. This story executes the actual migration of these assets into their correct structural homes (`fragments/`, `workflows/`, or `skills/`) and updates the `knowledge-graph.yaml` accordingly.

## 2. User Story
**As an** AI Developer / System Architect,
**I want** to re-classify and migrate existing assets in the `.agent/skills/` directory using the new Classification Funnel,
**So that** passive methodologies are properly stored as Fragments, pure processes as Workflows, and only executable tools remain as Skills, ensuring the orchestration environment is perfectly organized and deterministic.

## 3. Acceptance Criteria

*   **AC1: Identify and Migrate Fragments**
    *   **Given** the current `.agent/skills/` directory
    *   **When** analyzing passive markdown files (e.g., `feature-validation.md`, `quality-criteria.md`, `research-prompt-library.md`, `risk-matrix-template.md`, `taxonomy-8-pillars.md`)
    *   **Then** these files must be moved to `/.agent/fragments/`.
    *   **And** their names must conform to `kebab-case.md`.

*   **AC2: Maintain Valid Skills**
    *   **Given** existing specialized tool directories (e.g., `clone-website`, `github-deep-research`, `repo-absorption`, etc.)
    *   **When** audited against the Funnel
    *   **Then** they must remain in `/.agent/skills/`.
    *   **And** they must contain a `SKILL.md` entry point.

*   **AC3: Update the Knowledge Graph**
    *   **Given** the moved assets
    *   **When** the migration is complete
    *   **Then** `/.agent/knowledge-graph.yaml` must be updated to reflect the new paths and types (`fragment`, `skill`, etc.) using the `add-to-kg.sh` or `validate-kg.py` script to ensure schema integrity.
    *   **And** any invalid or ghost nodes must be purged.

*   **AC4: Workflow Double-Lock Updates**
    *   **Given** the newly created fragments
    *   **When** existing workflows require them
    *   **Then** the relevant workflows must be updated to use the Double-Lock context injection syntax pointing to the new `fragments/` paths.

## 4. Technical Specification

### 4.1. Asset Migration Plan
**To Fragments (`/.agent/fragments/`):**
- `feature-validation.md`
- `quality-criteria.md`
- `research-prompt-library.md`
- `risk-matrix-template.md`
- `taxonomy-8-pillars.md`
- `SKILL.md` (Check the root SKILL.md. If it's a template, rename to `skill-template.md` and move to fragments or templates).

**To Retain as Skills (`/.agent/skills/{skill_name}/SKILL.md`):**
- `clone-website`
- `github-deep-research`
- `pivot-guardian`
- `repo-absorption`
- `security-guardian`
- `stitch-design-taste`
- `ux-guardian`

### 4.2. Knowledge Graph Updates
Execute `validate-kg.py` or manually run `validate-kg.sh` after moving files to identify broken links.
Use `add-to-kg.sh` to insert the new fragment nodes into the graph. Example:
- `id: taxonomy-8-pillars`
- `type: fragment`
- `path: /.agent/fragments/taxonomy-8-pillars.md`
- `description: ...`

### 4.3. Double-Lock Implementation
Scan the `/.agent/workflows/` directory for any references to the old skill paths (e.g., `/.agent/skills/feature-validation.md`) and update them to use the `> [!IMPORTANT]` Double-Lock block pointing to `/.agent/fragments/feature-validation.md`.

## 5. Tri-Agent LITE Scan Summary
*   **Kira Lite (Data-Piccolo):** Large volume of file system movements (`mv` commands). Must ensure no data loss during migration.
*   **Shinji Lite (Data Strategist):** Re-routing of paths means dependent workflows must be updated simultaneously to prevent execution breaks.
*   **Quinn Lite (Testability):** `validate-kg.sh` will serve as the primary automated test to ensure the migration leaves zero broken links.

---

## 6. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 9 | Covers migration, index updates, and workflow reference updates. |
| **2. Testability** | 10 | Directly testable via the `validate-kg.sh` script. |
| **3. Edge-Case Resilience** | 9 | Handles broken references explicitly via the Double-Lock update criteria. |
| **4. Consistency** | 10 | Perfectly aligns with the structural rules defined in G.1. |
| **5. Feasibility** | 10 | Standard shell operations; very feasible. |
| **6. Security/Perf** | 8 | Optimizes the skill graph search by reducing noise from non-skills. |
| **7. UX Empathy** | 9 | Makes the system much easier to navigate for developers. |
| **TOTAL AVERAGE** | **9.28 / 10** | **PASSED.** (>= 8.5) |
