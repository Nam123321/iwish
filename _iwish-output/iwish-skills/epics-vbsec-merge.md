# Epics & Stories: vbsec Merge into white-hacker

This document maps the requirements from the PRD into implementation-ready Epics and Stories.

---

## Epic 1: Rule Ingestion & Deduplication

### Story 1.1: Standardize Generic Rules
*   **Goal:** Filter, deduplicate, and copy the generic security rules from `vbsec` to `.agent/skills/white-hacker/rules/generic/`.
*   **Acceptance Criteria:**
    *   AC1: Copy all 21 generic rule files.
    *   AC2: Ensure each file has standardized YAML frontmatter matching I-Wish white-hacker formats.
    *   AC3: No duplicate files created if rule overlap exists.

### Story 1.2: Standardize Language Overlays
*   **Goal:** Copy specialized language rules (Go, PHP, TypeScript, Python, .NET) to `.agent/skills/white-hacker/rules/languages/`.
*   **Acceptance Criteria:**
    *   AC1: Copy specialized rule folders for each language.
    *   AC2: Standardize YAML frontmatter for each language overlay.

---

## Epic 2: Reasoning Integration

### Story 2.1: Implement L1-L4 Taint Analysis guideline
*   **Goal:** Create or update the data flow references under `white-hacker/references/`.
*   **Acceptance Criteria:**
    *   AC1: Write `data-flow-classification.md` under `.agent/skills/white-hacker/references/` mapping input levels L1 to L4.

---

## Epic 3: Registry & Graph Registration

### Story 3.1: Register rules and update knowledge graph
*   **Goal:** Update registry configurations and register new rules in the knowledge graph.
*   **Acceptance Criteria:**
    *   AC1: Registry linter `check-registry-consistency.js` runs and passes successfully.
    *   AC2: Register the rules under nodes in `knowledge-graph.yaml`.
