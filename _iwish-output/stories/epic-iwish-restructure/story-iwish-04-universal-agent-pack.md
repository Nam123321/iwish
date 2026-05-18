---
epic: EPIC-IWISH-01
story_id: IW-STORY-04
title: Implement Universal Agent Pack (Interactive CLI & Context Overlays)
status: done
assignee: orch-agent
---


# IW-STORY-04: Implement Universal Agent Pack (Interactive CLI & Context Overlays)

## 1. Context & Business Value
To achieve the goal of making I-Wish a universal, Open Platform standard, the framework needs to support developers using various IDEs (Cursor, VSCode with Cline, Copilot, etc.) seamlessly within the same repository. Currently, materialization is a manual Bash script that overwrites user configurations. 

This story deprecates the fragile materialization scripts in favor of a new Node.js-based interactive Universal Installer (`iwish-install.js`). The installer will ask users which IDEs they use and automatically generate "Pointer Files" (e.g., `.cursorrules`, `.clinerules`) that anchor the LLM to the I-Wish framework. 

Furthermore, to prevent the `_iwish/framework/` updates from wiping out user customizations (custom workflows, modified skills, tailored prompts), this story implements the "Shadowing Mechanism." User customizations will be placed in `_iwish/custom/` as YAML overrides, and the I-Wish runtime engine will prioritize `custom/` over `framework/`, ensuring full upgradeability.

**Tracer Bullet (Vertical Slice):** 
User runs `node scripts/iwish-install.js` -> Selects IDEs -> CLI generates Pointer Files at repo root -> CLI provisions `_iwish/custom/` skeleton -> I-Wish Runtime reads configuration from `_iwish/custom/*.yaml` prioritizing it over `_iwish/framework/*.yaml`.

## 2. Acceptance Criteria

- **AC1 (Root-Aware Execution):** The installer (`scripts/iwish-install.js`) MUST verify it is running at the project root (e.g., checks for `.git` or `package.json` or `_iwish` root) before generating any pointer files.
- **AC2 (Interactive Selection):** The installer MUST prompt the user interactively (using a CLI library like `inquirer` or native readline) to select their active IDEs (Cursor, VSCode/Cline, generic CLI).
- **AC3 (Pointer File Generation):** Based on the selection, the installer generates the correct context anchor files (e.g., `.cursorrules` for Cursor, `.clinerules` for Cline) that instruct the AI to load the generic `_iwish/core/tasks/workflow.xml` and respect I-Wish instructions.
- **AC4 (User-Land Provisioning):** The installer ensures the `_iwish/custom/` directory exists with a sample `.yaml` override file demonstrating the shadowing syntax.
- **AC5 (Shadowing Logic Implementation):** The core I-Wish runtime scripts/manifest generators MUST be updated to implement "Shadowing". If a configuration file exists in `_iwish/custom/`, it is used *instead* of the identical file in `_iwish/framework/`.

## 3. Implementation Tasks

- `[ ]` **Task 1 (AC1, AC2, AC3, AC4):** Create `scripts/iwish-install.js`. Implement the CLI prompt using Node.js `readline` (or `inquirer`/`prompts` if installed) to ask for IDE choices. Generate the necessary pointer files (`.cursorrules`, `.clinerules`) at the root containing the I-Wish bootstrap context. Ensure `_iwish/custom` directory is created.
- `[ ]` **Task 2 (AC5):** Update the existing runtime materialization logic (which may still be invoked or refactored into TS) or the core engine logic to check for files in `_iwish/custom/` first before defaulting to `_iwish/framework/`. 
- `[ ]` **Task 3 (General):** Deprecate or update `materialize-iwish-runtime.sh` to warn users to use `node scripts/iwish-install.js` instead.
- `[ ]` **Task 4 (General):** Verify the shadowing logic by creating a dummy `_iwish/custom/workflows/dummy.yaml` and testing the engine fallback.

## 4. AC-To-Task Traceability Matrix
- **AC1** -> Task 1
- **AC2** -> Task 1
- **AC3** -> Task 1
- **AC4** -> Task 1
- **AC5** -> Task 2

## 5. Dev Notes (Project Memory)
- **Format Constraint:** The user explicitly approved **Option B (YAML format)** for the overrides to maintain multiline readability and agent prompt accuracy.
- **Anti-Overwrite Protocol:** Never modify `_iwish/framework/` during user interactions. All user customization MUST go to `_iwish/custom/`.

---

## 🛡️ QA Simulator Guardian (7-Row Scorecard)
*Domain: Orchestration & Configuration Engine*

| Axis | Threat Vector | Mitigation Strategy | Score |
|---|---|---|---|
| **1. State Integrity** | Installer runs in a subfolder and pollutes nested directories. | Root-aware checks (AC1) enforce that the installer only executes when run at the correct project root. | 9/10 |
| **2. Edge Case Logic** | User selects multiple IDEs simultaneously. | AC2 supports generating multiple pointer files independently without context conflicts. | 9/10 |
| **3. Concurrency** | N/A | Local CLI script operation. | 10/10 |
| **4. Error Boundaries** | `_iwish/custom` directory missing during execution. | Installer proactively provisions the `_iwish/custom/` folder structure (AC4). | 9/10 |
| **5. Security/Trust** | Framework updates overwriting custom user behavior. | "Shadowing Logic" (AC5) strictly prioritizes `_iwish/custom` over `_iwish/framework`, preserving overrides. | 10/10 |
| **6. Scale/Perf** | Checking override paths adds latency to runtime. | Simple filesystem checks (`fs.existsSync` or equivalent bash `[ -f ]`) add negligible overhead. | 9/10 |
| **7. UX Empathy** | User doesn't know how to override a file. | Installer generates a sample `.yaml` in `_iwish/custom/` to document the pattern (AC4). | 9/10 |

**TOTAL AVERAGE:** 9.3/10 (PASS)
