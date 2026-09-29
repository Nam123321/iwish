---
description: 'Step CD-01: Setup — Executed by iwish-feature-dev-story.md'
---

# Step CD-01: Setup

## Objective
Execute the instructions defined in this step for the iwish-feature-dev-story.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `iwish-feature-dev-story.md`.

## Instructions

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/code/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/code/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
4.4a. CRITICAL — REQUIREMENT SYNCHRONIZATION GATE. Before generating the implementation plan or writing any code, you MUST check if there are any pending requirement changes. Run the command `iwish reconcile-status`. If `pending queue records` > 0 or `work items` > 0, you MUST HALT execution immediately and prompt the user: "⚠️ There are pending requirement changes in the reconciliation queue. Please run `/reconcile-change` to synchronize the PRD/UI Specs before implementation planning, or type `APPROVE_OVERRIDE` to ignore." Do not proceed without user override.
4.4b. CRITICAL — DATA-SPEC INTEGRITY GATE. Before generating the implementation plan or writing code, check if the story contains database or data-layer changes (marked with `[DATA]` tag or database-specific tasks). If yes, verify if the Data Specification document `{planning_artifacts}/1. Epic & Story/Epic-{epic_id}/{story_id}/data-spec.md` (derive {epic_id} from the first digit of {story_id}, e.g. 1-1-user-auth -> Epic-1) or equivalent exists. If it is missing, you MUST HALT and prompt the user: "⚠️ Story này yêu cầu thay đổi cơ sở dữ liệu/Schema nhưng chưa có Data Specification. Vui lòng chạy `/make-data-spec` trước để thiết kế schema và DTO nhằm đảm bảo đồng bộ giữa FE và BE, hoặc gõ `SKIP_DATA_SPEC` để tiếp tục code trực tiếp."
4.4b2. CRITICAL — FEATURE HIERARCHY NAVIGATION CONTEXT. Before generating the implementation plan, load the feature hierarchy file (canonical path: `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md`, fallback: any file matching `*hierarchy*.md` or `*feature-hierarchy*.md` as dynamically resolved by the retrofitted indexer/CLI under `_iwish-output/`) for feature placement and navigation context. If the file exists, read it and extract the portal section relevant to the current story. Use the extracted sidebar/menu hierarchy to determine: correct route paths, sidebar active states, breadcrumb structure, and navigation guards. If the file does not exist, log a warning: "⚠️ feature-hierarchy.md not found — navigation context will be inferred from UI Spec only. Consider running `/feature-hierarchy` to generate the Feature Hierarchy for accurate navigation."
4.4c. CRITICAL — SUBAGENT PARALLELIZATION GATE. During the execution of tasks in the story-specific or session artifact `task.md`, the agent must detect the running platform:
   - **Detection:** Check if `invoke_subagent` is present in the available tools array, or `process.env.ANTIGRAVITY_SDK_VERSION` is set.
   - **AG_MAO Mode (Antigravity 2.0):** Load `/.agent/fragments/task-scaffolding-policy.md`. Parse all tasks tagged with `[P]` (parallelizable). Define subagents and concurrently launch them via `invoke_subagent` using the `share` workspace option. The parent agent MUST construct subagent prompts specifying targeted task descriptions, allowed/forbidden files, compilation verification targets, and execution report parameters. The parent must then yield control (using `schedule` or returning no further tools) until the subagents complete.
   - **LEGACY_INJECTION Mode (Claude Code, Cursor, Windsurf, Codex):** The agent MUST fall back to sequential execution of parallel tasks. It must print a clear status message in chat informing the user that parallelization is falling back to sequential runs due to single-agent runtime constraints.
4.4d. CRITICAL — IMPLEMENTATION-AWARE & GRAPH-DRIVEN TESTING GATE. Before writing ANY Unit, Integration, or E2E tests:
   1. **Graph Consultation:** The agent MUST consult the `FeatureGraph`, `data-spec.md`, and `Epic-{id}-risk-matrix.md` (or KnowledgeGraph) to extract exact component dependencies, API endpoints, and edge cases.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
