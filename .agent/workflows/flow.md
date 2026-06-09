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
At the very beginning of the `/flow` pipeline, you MUST create a `task.md` file to track the progress of these steps. Update this file as each step is completed. Report the current status to the user after completing each step.

### Steps:

1. **Step 1: Story Design (`/make-story`)**
   - Analyze requirements and generate the target user story file (`story.md`).
   - *Update `task.md` and STOP if there are User Gates or clarifying questions.*
   
2. **Step 2: Specification Generation**
   - Run `/make-ui-spec` if the story contains frontend/UI changes.
   - Run `/make-data-spec` if the story updates database schemas or API contracts.
   - *Update `task.md` and STOP if there are User Gates.*

3. **Step 3: Design Scoring & Mockup Generation**
   - Perform design scoring checks to determine if user interface mockups are needed.
   - If UI changes are present and score thresholds are met, generate mockups on the configured design platform (Stitch, Figma, Claude Design, Canva, etc.) without forcing Stitch as the default.
   - **[CRITICAL] [User Gate - Approval]**: You MUST STOP execution completely here. DO NOT proceed to Step 4 until the user explicitly approves the generated design specs and mockups.

4. **Step 4: Implementation (`/code`)**
   - Once spec and design mockups are approved, begin writing the code logic.
   - Strictly follow clean architecture guidelines and target constraints.
   - *Update `task.md`.*

5. **Step 4.5: FeatureGraph Indexing (Optional)**
   - If the story created or modified features that affect cross-feature dependencies (e.g., new FRs, portal changes, sidebar restructuring, feature-hierarchy.md updates), run `iwish featuregraph-index` to re-index the FeatureGraph.
   - Also run if `feature-hierarchy.md` was updated by `/edit-prd`, `/make-ui-spec`, or `/reconcile-change` during this pipeline run.
   - **Graceful Degradation:** If FalkorDB is not available, the indexer will skip with a log message and the pipeline continues without blocking.
   - *Update `task.md`.*

6. **Step 5: Code Review & Validation (`/review`)**
   - Upon code completion, run tests and perform code quality audits (SAST, security checks, and hybrid scorecard).
   - Report final validation outcomes to the user and mark the pipeline as complete in `task.md`.
