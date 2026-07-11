---
name: 'flow'
description: 'Automated Epic/Story SDLC pipeline workflow: /make-story -> Spec/Design -> /code -> /review'
---

# /flow

The standard, automated end-to-end development pipeline of I-Wish.

## Workflow Guidelines

**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response. You must execute exactly ONE step, report the status, and then STOP.

**State Tracking Mechanism:**
At the very beginning of the `/flow` pipeline, you MUST create a `task.md` file to track the progress of these steps. This file MUST be written to the story-specific subdirectory (`_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/{story_id}/task.md`) or the dynamic session artifact directory (`<appDataDir>/brain/<conversation-id>/task.md` under Antigravity), NEVER to the workspace root directory. This task list/checklist MUST explicitly include checking and ensuring that all newly generated or modified documents (like stories, specs, etc.) have valid OKF YAML frontmatter. Update this file as each step is completed. Report the current status to the user after completing each step.

**Pre-User Gate: Agent Collaboration (Party Mode):**
Before stopping at any User Gate for domain, data architecture, or design questions, you MUST attempt to resolve them internally:
1. Summarize the unresolved questions.
2. Invoke specialized subagents or trigger `/party-mode` for a Socratic debate (anti-consensus, exploring trade-offs).
   - **CRITICAL**: When using party-mode, you MUST comply with all fragment rules (e.g., loading `/.agent/fragments/anti-sycophancy.md` and applying Pushback Patterns).
3. **Transparency:** The debate and agent exchanges MUST be visible to the user in the chat interface.
4. Only present the final consensus, unresolved issues, or decisions requiring explicit business owner consent at the User Gate.

### Steps:

1. **Step 1: Story Design (`/make-story`)**
   - Analyze requirements and generate the target user story file (`story.md`).
   - **OKF Header:** Ensure the generated story file starts with a valid OKF YAML frontmatter block.
   - **Validation Gate:** Even if a `story.md` file already exists (e.g. created as a draft/skeleton during epic breakdown or sprint planning), the agent MUST run the validation script: `python3 .agent/scripts/validate-story.py "path/to/story.md"`. If validation fails (due to missing reviews, risk matrices, FR links, or scorecards), you MUST NOT skip this step. Treat the existing content as a preliminary draft and run the full `/make-story` pipeline (including Socratic review and Edge Case scan) to fully design and validate it.
   - *Update `task.md` and STOP if there are User Gates or clarifying questions.*
   
2. **Step 2: Specification Generation**
   - Run `/make-ui-spec` if the story contains frontend/UI changes.
   - Run `/make-data-spec` if the story updates database schemas or API contracts.
   - **OKF Header:** Ensure all generated specification files start with a valid OKF YAML frontmatter block.
   - *Update `task.md` and STOP if there are User Gates.*

3. **Step 3: Design Scoring, HTML Preview & Mockup Generation**
   - Perform design scoring checks to determine if user interface mockups are needed.
   - If UI changes are present, generate a static zero-logic HTML/CSS preview and instruct the user to open it in their browser for layout validation.
   - If score thresholds require high-fidelity design, generate mockups on the configured design platform (Stitch, Figma, Claude Design, Canva, etc.) without forcing Stitch as the default.
   - **[CRITICAL] [User Gate - Approval]**: You MUST STOP execution completely here. DO NOT proceed to Step 4 until the user explicitly approves the HTML preview layout and generated design specs/mockups.

4. **Step 4: Implementation (`/code`)**
   - **Dependency & Validation Check:** Before writing any code logic, the agent MUST run `python3 .agent/scripts/validate-story.py "path/to/story.md"`. If validation fails or if any story listed under `dependencies` in the frontmatter is not marked as `completed` in `sprint-status.yaml`, you MUST HALT execution and notify the user that the story's development foundation is missing.
   - Once validation passes and spec and design mockups are approved, begin writing the code logic.
   - Strictly follow clean architecture guidelines and target constraints.
   - *Update `task.md`.*

5. **Step 4.5: FeatureGraph Indexing (Optional)**
   - If the story created or modified features that affect cross-feature dependencies (e.g., new FRs, portal changes, sidebar restructuring, feature-hierarchy.md updates), run `iwish featuregraph-index` to re-index the FeatureGraph.
   - Also run if `feature-hierarchy.md` was updated by `/edit-prd`, `/make-ui-spec`, or `/reconcile-change` during this pipeline run.
   - **Graceful Degradation:** If FalkorDB is not available, the indexer will skip with a log message and the pipeline continues without blocking.
   - *Update `task.md`.*

6. **Step 5: Code Review & Validation (`/review`)**
   - Run static analysis, tests, and perform code quality audits (SAST, security checks, and hybrid scorecard).
   - If the user explicitly requested to run both Step 5 and Step 6 together, you MUST automatically transition to Step 6 immediately after Step 5 passes successfully, without stopping for a separate user prompt.
   - *Update `task.md`.*

7. **Step 6: UI Automation & Evidence Gathering (`/manual-test`)**
   - Instruct the QA Agent to execute the `manual-test` protocol to generate UI automation scripts (Playwright) and collect physical Zero-Trust evidence.
   - Ensure the liveness probe passes (e.g. asking user to start the dev server) before running dynamic tests.
   - Report final validation outcomes to the user and mark the pipeline as complete in `task.md`.
