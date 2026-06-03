---
name: 'flow'
description: 'Automated Epic/Story SDLC pipeline workflow: /make-story -> Spec/Design -> /code -> /review'
---

# /flow

The standard, automated end-to-end development pipeline of I-Wish.

## Workflow Guidelines

When executing this command, the agent automatically traverses all steps in sequence. At any step requiring user input or verification (User Gates), the agent MUST **Pause** execution. Once the user provides approval or feedback, the agent **Resumes** the workflow automatically.

### Steps:

1. **Step 1: Story Design (`/make-story`)**
   - Analyze requirements and generate the target user story file (`story.md`).
   
2. **Step 2: Specification Generation**
   - Run `/make-ui-spec` if the story contains frontend/UI changes.
   - Run `/make-data-spec` if the story updates database schemas or API contracts.

3. **Step 3: Design Scoring & Mockup Generation**
   - Perform design scoring checks to determine if user interface mockups are needed.
   - If UI changes are present and score thresholds are met, generate mockups on the configured design platform (Stitch, Figma, Claude Design, Canva, etc.) without forcing Stitch as the default.
   - **[User Gate - Approval]**: Pause and wait for the user to approve generated design specs and mockups.

4. **Step 4: Implementation (`/code`)**
   - Once spec and design mockups are approved, begin writing the code logic.
   - Strictly follow clean architecture guidelines and target constraints.

5. **Step 5: Code Review & Validation (`/review`)**
   - Upon code completion, run tests and perform code quality audits (SAST, security checks, and hybrid scorecard).
   - Report final validation outcomes to the user.
