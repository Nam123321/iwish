---
epic: EPIC-IWISH-01
story_id: IW-STORY-03
title: Workflow & Runtime Namespace Purge
status: done

# IW-STORY-03: Workflow & Runtime Namespace Purge

## 1. Context & Business Value
This is the final structural story of Epic EPIC-IWISH-01. The objective is to establish I-Wish as a fully independent framework by purging the remaining legacy "I-Wish" references. This involves migrating legacy runtime directories, renaming output tracking folders, and comprehensively updating path strings globally to ensure zero broken references.

**Tracer Bullet (Vertical Slice):**
1. Migrate the legacy `_iwish/bmm/` directory to the new `_iwish/framework/` directory and remove the obsolete `_iwish/` structure.
2. Rename the tracking output directory `_iwish-output/` to `_iwish-output/`.
3. Rename framework bash scripts in `.agent/scripts/` (e.g., `check-iwish-runtime.sh` -> `check-iwish-runtime.sh`).
4. Execute a global find-and-replace to update path references across `.yaml`, `.md`, `.xml`, and `.ts` files, backed by a strict `grep_search` double-check phase.
5. Verify system integrity via TypeScript compilation (`npm run build`).

## 2. Acceptance Criteria
- **AC1 (Runtime):** The `_iwish/bmm/` directory is successfully moved and renamed to `_iwish/framework/`. The legacy `_iwish/` directory is deleted.
- **AC2 (Outputs):** The `_iwish-output/` directory is renamed to `_iwish-output/`.
- **AC3 (Scripts):** Bash scripts containing `iwish` in their filenames within `.agent/scripts/` are renamed to use `iwish` instead, and their internal contents updated.
- **AC4 (Content Integrity):** A global search-and-replace successfully updates references from `iwish` to `iwish` across all documentation and configuration files, specifically targeting path strings and internal identifiers.
- **AC5 (Double-Check):** A mandatory `grep_search` verification step is executed to confirm zero broken or orphaned `_iwish` strings exist within the active workspace.
- **AC6 (Validation):** The project compiles successfully (`npm run build`) without any file-not-found or configuration drift errors.

## 3. Implementation Tasks
- `[x]` **Task 1 (AC1):** Move `_iwish/bmm/` to `_iwish/framework/` and recursively delete the remaining `_iwish/` directory.
- `[x]` **Task 2 (AC2):** Rename the root `_iwish-output/` directory to `_iwish-output/`.
- `[x]` **Task 3 (AC3):** Rename and modify bash scripts inside `.agent/scripts/` (e.g., `check-iwish-runtime.sh`, `materialize-iwish-runtime.sh`).
- `[x]` **Task 4 (AC4):** Execute global string replacements. Target internal workflow references, yaml configs, and `.md` artifacts (e.g., `_iwish/core/tasks/workflow.xml` -> `_iwish/core/tasks/workflow.xml`, `_iwish-output/` -> `_iwish-output/`).
- `[x]` **Task 5 (AC5):** Run `grep_search` to double-check for leftover `iwish` strings and fix any missed edge cases.
- `[x]` **Task 6 (AC6):** Build the TypeScript project (`npm run build`) to prove compilation integrity.

## 4. AC-To-Task Traceability Matrix
- **AC1** -> Task 1
- **AC2** -> Task 2
- **AC3** -> Task 3
- **AC4** -> Task 4
- **AC5** -> Task 5
- **AC6** -> Task 6

## 5. Dev Notes (Project Memory)
- **Architecture Constraints:** Based on `PROJECT.md`, I-Wish enforces standalone markdown workflows. Replacing the engine namespace must not disrupt the generic workflow engine execution logic.
- **Complexity Score:** CS = 4 (Moderate). While logic is simple, the blast radius is large. The double-check grep mechanism in Task 5 is explicitly designed to mitigate the risk of broken paths in existing project documentation.

---

## 🛡️ QA Simulator Guardian (7-Row Scorecard)
*Domain: Infrastructure & Orchestration*

| Axis | Threat Vector | Mitigation Strategy | Score |
|---|---|---|---|
| **1. State Integrity** | Broken links in tracking files after `_iwish-output` rename. | Task 5 mandates a double-check search for orphaned paths before completion. | 9/10 |
| **2. Edge Case Logic** | Hardcoded `_iwish` paths in TS source or bash scripts. | Global find-and-replace covers `.ts` and `.sh` source files. | 9/10 |
| **3. Concurrency** | N/A | Local file structure changes only. | 10/10 |
| **4. Error Boundaries** | Scripts fail due to renamed files. | Task 3 specifically updates the script names and their internal references. | 9/10 |
| **5. Security/Trust** | N/A | Infrastructure rename. | 10/10 |
| **6. Scale/Perf** | N/A | Local rename operation. | 10/10 |
| **7. UX Empathy** | Agent context gets confused by missing paths. | Thorough verification guarantees agents won't crash when loading workflows. | 9/10 |

**TOTAL AVERAGE:** 9.4/10 (PASS)
