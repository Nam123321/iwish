---
description: 'Step CD-02: Implementation — Executed by iwish-feature-dev-story.md'
---

# Step CD-02: Implementation

## Objective
Execute the instructions defined in this step for the iwish-feature-dev-story.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `iwish-feature-dev-story.md`.

## Instructions

1. **CRITICAL — SHARED TYPES GATE:** Before writing any UI Component or Backend Controller code, you MUST define and map the API Contracts, DTOs, and shared types in the designated shared workspace of the project's source code (e.g., `packages/shared/src/api-routes.ts` or `types.ts`). Both FE and BE code MUST import these shared definitions. You are FORBIDDEN from locally duplicating API interfaces inside frontend components or backend controllers.
2. **Implementation Inspection:** The agent MUST read the relevant implementation files (UI components, `schema.prisma`, `api-routes.ts`, and `seed-accounts.js` or mock files) mapped from the graphs.
   3. **No Hallucination:** Tests MUST NOT be written blindly based on PRD/Stories alone. You must assert against exact DOM structures, true database types (e.g. UUIDs), existing mock data, and cover the documented edge cases.
4.5. CRITICAL — SOCRATIC REVIEW GATE 2. Before generating any Implementation Plan output, you MUST execute the Socratic Review Mode (Gate 2: `technical`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the architectural impact, database migrations, and backward compatibility. You are FORBIDDEN from generating the Implementation Plan until the user has completed the Socratic loop and explicitly approved the Synthesis.
4.6. CRITICAL — SOCRATIC REVIEW GATE 3 (DRIFT). After drafting the Implementation Plan, you MUST execute the Socratic Review Mode (Gate 3: `drift`) to calculate the Drift Score.
   - **Stage 1 (FeatureGraph Gate):** Does the plan touch core DataEntities/Events? If NOT found in FeatureGraph, add +10 to score. If found, proceed to Stage 2.
   - **Stage 2 (Point-Matrix):** Calculate drift based on Socratic Synthesis report (Data/API/Logic changes).
   - **User Override:** Present the score to the User. You MUST explicitly STOP execution (e.g., using a `request_feedback` tool or direct question) to allow the User to override the final score before proceeding.
   - **Pause & Spawn (Option D):** If the final score > 7, you MUST update the story-specific or session artifact `task.md` with `[PAUSED - WAITING FOR DRIFT SYNC]`, then run `git stash -u` (including untracked files) to protect local changes, and PAUSE the execution. Output a clear instruction to the User: "Drift detected. Please open a NEW CHAT SESSION to update the PRD/Story/FeatureGraph. When done, return here and type 'continue'".
   - **Context Refresh (Resume):** When the User types 'continue', first read the story-specific or session artifact `task.md` to recover your execution state. Then you MUST run `git stash pop`, instruct the user to resolve any conflicts, and CRITICALLY use `git diff --name-only stash@{0}^!` or `git status` to identify EXACTLY which files were modified in the other session, then run `view_file` on them to refresh your Context Window. You are FORBIDDEN from generating new code until this is verified.
4.7. CRITICAL — DELETION TEST GATE. Before finalizing the story execution, if the task involved refactoring or adding a new "Shallow Module", you MUST execute the Deletion Test Pre-flight Checklist.
   - Detect test runner environment (e.g., Vitest, Playwright, Maestro).
   - Verify module isolation and existing test coverage.
   - Stop and obtain Explicit User Approval to run the test.
   - If approved, invoke `bash .agent/scripts/iwish-deletion-test.sh <target-module>` to sandbox the deletion. Ensure the app still compiles and core tests pass after module removal. If they do, the module was shallow and must be rejected.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
