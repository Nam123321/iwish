---
name: 'Vegeta-story'
description: 'Execute a story by implementing tasks/subtasks, writing tests, validating, and updating the story file per acceptance criteria'
disable-model-invocation: true
---

> [!IMPORTANT]
> **STANDARDS INJECTION (MANDATORY):**
> During coding and testing phases, you MUST use `view_file` to load `/.agent/fragments/test-bootstrap.md` and `/.agent/fragments/ux-principles.md` to adhere to core quality guidelines.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
4.5. CRITICAL — SOCRATIC REVIEW GATE 2. Before generating any Implementation Plan output, you MUST execute the Socratic Review Mode (Gate 2: `technical`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the architectural impact, database migrations, and backward compatibility. You are FORBIDDEN from generating the Implementation Plan until the user has completed the Socratic loop and explicitly approved the Synthesis.
4.6. CRITICAL — SOCRATIC REVIEW GATE 3 (DRIFT). After drafting the Implementation Plan, you MUST execute the Socratic Review Mode (Gate 3: `drift`) to calculate the Drift Score.
   - **Stage 1 (FeatureGraph Gate):** Does the plan touch core DataEntities/Events? If NOT found in FeatureGraph, add +10 to score. If found, proceed to Stage 2.
   - **Stage 2 (Point-Matrix):** Calculate drift based on Socratic Synthesis report (Data/API/Logic changes).
   - **User Override:** Present the score to the User. You MUST explicitly STOP execution (e.g., using a `request_feedback` tool or direct question) to allow the User to override the final score before proceeding.
   - **Pause & Spawn (Option D):** If the final score > 7, you MUST update `task.md` with `[PAUSED - WAITING FOR DRIFT SYNC]`, then run `git stash -u` (including untracked files) to protect local changes, and PAUSE the execution. Output a clear instruction to the User: "Drift detected. Please open a NEW CHAT SESSION to update the PRD/Story/FeatureGraph. When done, return here and type 'continue'".
   - **Context Refresh (Resume):** When the User types 'continue', first read `task.md` to recover your execution state. Then you MUST run `git stash pop`, instruct the user to resolve any conflicts, and CRITICALLY use `git diff --name-only stash@{0}^!` or `git status` to identify EXACTLY which files were modified in the other session, then run `view_file` on them to refresh your Context Window. You are FORBIDDEN from generating new code until this is verified.
4.7. CRITICAL — DELETION TEST GATE. Before finalizing the story execution, if the task involved refactoring or adding a new "Shallow Module", you MUST execute the Deletion Test Pre-flight Checklist.
   - Detect test runner environment (e.g., Vitest, Playwright, Maestro).
   - Verify module isolation and existing test coverage.
   - Stop and obtain Explicit User Approval to run the test.
   - If approved, invoke `bash .agent/scripts/iwish-deletion-test.sh <target-module>` to sandbox the deletion. Ensure the app still compiles and core tests pass after module removal. If they do, the module was shallow and must be rejected.
4.8. ZOOM-OUT CHECKPOINT. During execution, if you detect you have been editing the SAME file for 3+ consecutive tool calls without referencing any other file or running validation, you MUST activate the Zoom-Out Heuristic from `@{project-root}/.agent/skills/pivot-guardian/SKILL.md` §4. Map the module neighborhood (callers, dependencies, epic/story context) before continuing. This prevents tunnel vision.
4.9. CRITICAL — UI ENRICHMENT READINESS GATE (Gate Option A). Before generating any implementation plan, verify the UI Spec. If the UI Spec contains `Enrichment_Required: true`, check if the `[POST_STITCH_ENRICHMENT_LOGIC]` section is populated. If it is empty or missing, you MUST HALT execution immediately and output: "Story này yêu cầu UI Pro Max nhưng UI Spec chưa được Enrich. Vui lòng chạy lệnh bổ sung hoặc gõ `APPROVE_OVERRIDE` để bỏ qua." Do not proceed without user override.
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL: STITCH-TO-CODE ENFORCEMENT. If implementing UI from a Stitch output, you MUST rigidly map React components using DOM-Driven Layout (following the visual DOM structure of the approved Stitch HTML), NOT Schema-Driven Layout. The generated HTML/CSS from Stitch is the Absolute Source of Truth. You MUST download and reference these Stitch artifacts natively.
7. CRITICAL: VISUAL ENFORCEMENT GATE. Before finalizing any UI task or handing off, invoke the UX Guardian or 'stitch-design-taste' skill to visually validate the implementation against the CSS/HTML visual contract. DO NOT assume functional logic replaces visual validation.
8. CRITICAL: I-Wish Master decrees that all future /dev-story executions must conclude with a deterministic compiler check. The agent must be instructed to run a terminal command to verify project compilation (e.g., `pnpm build`, `nest build`, or `tsc --noEmit`) before finalizing the review and updating the walkthrough.
38. CRITICAL: OPERATION REPORT UPDATE. Upon completing the story execution, the agent MUST run `node scripts/operation-report-gen.js` to update the Operation Report metrics and Health Dashboard, and then explicitly notify the user in chat that the Operation Report has been updated, providing the absolute file URI to `_iwish-output/operation-report/index.html`.
</steps>
