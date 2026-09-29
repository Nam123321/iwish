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
1.5. **CRITICAL — SEMANTIC LAYOUT AST GATE:** Before implementing any UI layout, the Dev-Agent MUST check if a Semantic Layout AST Constraint JSON file (e.g., `ast-constraint-story-{story_id}.json`) exists or is referenced in the UI Spec. 
   - If it exists, you MUST rigidly obey its structural definitions (HStack, VStack, ZStack, GridArea, zones). 
   - You are FORBIDDEN from using CSS hacks (like absolute/fixed overlays or Portals) to fake layout positioning unless the AST explicitly provides a `CustomLayoutNode` or `CustomZone`.
   - **Bidirectional Negotiation:** If you determine the AST structure requires excessive DOM depth (Div-Soup) or is impossible to build responsively, you MUST NOT blindly generate messy code. Instead, you MUST propose a flattened/optimized AST mutation back to the User/UX-Agent for approval before continuing.
1.6. **CRITICAL — UI TOKEN VALIDATION GATE:** After generating or modifying any UI component (`.jsx` or `.tsx`), the Dev-Agent MUST explicitly run `python3 .agent/scripts/validate-ui-tokens.py --file <path> --design <RESOLVED_PATH_TO_DESIGN.MD>`.
   - *Note on Layout Mode:* The physical path of `DESIGN.md` varies based on the active layout (Flat vs Hierarchical). You MUST dynamically locate it first (e.g., using `find . -name "DESIGN.md"`) before passing it to the `--design` flag.
   - If the script exits with an error (e.g., forbidden `dark:` classes, hardcoded hex colors, or missing mandatory hooks like `useDeferredValue`), you MUST remediate the code immediately and re-run the script until it passes. You are FORBIDDEN from finishing the task while this script fails.
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
4.7b. CRITICAL — SPEC RE-READ CHECKPOINT. After completing every 3 tasks (or after any context truncation/checkpoint event), you MUST re-read the applicable spec files (UI Spec and/or Data Spec) using `view_file` and cross-check your current implementation against the spec definitions. Follow the Spec Re-Read procedure defined in `.agent/skills/spec-compliance-guardian/SKILL.md` §4. If you detect more than 2 drift items between your implementation and the spec, you MUST HALT and remediate (fix the drifting code) before continuing to the next task. You are FORBIDDEN from proceeding past this checkpoint with known spec drift.
4.7c. CRITICAL — DEVIATION CHECK. After every 3 tasks alongside the Spec Re-Read Checkpoint:
   - Load the `unknowns-scanner` skill (`.agent/skills/unknowns-scanner/SKILL.md`)
   - Run with: phase=dev, depth=quick
   - Tools: deviation-logger, drift-detector
   - If deviation impacts macro assumption → update macro confidence
4.7d. CRITICAL — UI COMPLIANCE POLICY CHECKPOINT. After implementing any UI Component, you MUST run the UI Tokens validator against the implementation file to ensure compliance with the project's DESIGN.md policy.
   - Execute: `python3 .agent/scripts/validate-ui-tokens.py --file <path_to_ui_file> --design <path_to_design.md>`
   - If the script returns an error (Exit Code 1), you MUST HALT and fix the forbidden tokens or missing mandatory logic before continuing.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
