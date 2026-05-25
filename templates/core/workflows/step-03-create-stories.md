---
name: 'step-03-create-stories'
description: 'Generate all epics with their stories following the template structure'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-03-create-stories.md'
nextStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 3: Generate Epics and Stories

## STEP GOAL:

To generate all epics with their stories based on the approved epics_list, following the template structure exactly.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: Process epics sequentially
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a product strategist and technical specifications writer
- ✅ If you already have been given communication or persona patterns, continue to use those while playing this new role
- ✅ We engage in collaborative dialogue, not command-response
- ✅ You bring story creation and acceptance criteria expertise
- ✅ User brings their implementation priorities and constraints

### Step-Specific Rules:

- 🎯 Generate stories for each epic following the template exactly
- 🚫 FORBIDDEN to deviate from template structure
- 💬 Each story must have clear acceptance criteria
- 🚪 ENSURE each story is completable by a single Vegeta agent
- 🔗 **CRITICAL: Stories MUST NOT depend on future stories within the same epic**

## EXECUTION PROTOCOLS:

- 🎯 Generate stories collaboratively with user input
- 💾 Append epics and stories to {outputFile} following template
- 📖 Process epics one at a time in sequence
- 🚫 FORBIDDEN to skip any epic or rush through stories

## STORY GENERATION PROCESS:

### 1. Load Approved Epic Structure

Load {outputFile} and review:

- Approved epics_list from Step 2
- FR coverage map
- All requirements (FRs, NFRs, additional)
- Template structure at the end of the document

### 2. Explain Story Creation Approach

**STORY CREATION GUIDELINES:**

For each epic, create stories that:

- Follow the exact template structure
- Are sized for single Vegeta agent completion
- Have clear user value
- Include specific acceptance criteria
- Reference requirements being fulfilled

**🚨 DATABASE/ENTITY CREATION PRINCIPLE:**
Create tables/entities ONLY when needed by the story:

- ❌ WRONG: Epic 1 Story 1 creates all 50 database tables
- ✅ RIGHT: Each story creates/alters ONLY the tables it needs

**🔗 STORY DEPENDENCY PRINCIPLE:**
Stories must be independently completable in sequence:

- ❌ WRONG: Story 1.2 requires Story 1.3 to be completed first
- ✅ RIGHT: Each story can be completed based only on previous stories
- ❌ WRONG: "Wait for Story 1.4 to be implemented before this works"
- ✅ RIGHT: "This story works independently and enables future stories"

**STORY FORMAT (from template):**

```
### Story {N}.{M}: {story_title}

As a {user_type},
I want {capability},
So that {value_benefit}.

**Acceptance Criteria:**

**Given** {precondition}
**When** {action}
**Then** {expected_outcome}
**And** {additional_criteria}
```

**✅ GOOD STORY EXAMPLES:**

_Epic 1: User Authentication_

- Story 1.1: User Registration with Email
- Story 1.2: User Login with Password
- Story 1.3: Password Reset via Email

_Epic 2: Content Creation_

- Story 2.1: Create New Blog Post
- Story 2.2: Edit Existing Blog Post
- Story 2.3: Publish Blog Post

**❌ BAD STORY EXAMPLES:**

- Story: "Set up database" (no user value)
- Story: "Create all models" (too large, no user value)
- Story: "Build authentication system" (too large)
- Story: "Login UI (depends on Story 1.3 API endpoint)" (future dependency!)
- Story: "Edit post (requires Story 1.4 to be implemented first)" (wrong order!)

### 3. Process Epics Sequentially

For each epic in the approved epics_list:

#### A. Epic Overview

Display:

- Epic number and title
- Epic goal statement
- FRs covered by this epic
- Any NFRs or additional requirements relevant

#### B. Story Breakdown

Work with user to break down the epic into stories:

- Identify distinct user capabilities
- Ensure logical flow within the epic
- Size stories appropriately

#### C. Generate Each Story

For each story in the epic:

1. **Story Title**: Clear, action-oriented
2. **User Story**: Complete the As a/I want/So that format
3. **Acceptance Criteria**: Write specific, testable criteria

**AC Writing Guidelines:**

- Use Given/When/Then format
- Each AC should be independently testable
- 🛡️ **EDGE CASES:** After writing happy-path ACs, the Edge Case Guardian SKILL (`{project-root}/.agent/skills/Hit/SKILL.md`) will be invoked to systematically identify edge cases using the 8-Pillar Taxonomy. Edge case ACs will be tagged with `[EDGE-CASE]` prefix.
- Reference specific requirements when applicable

#### D. Collaborative Review

After writing each story:

- Present the story to user
- Ask: "Does this story capture the requirement correctly?"
- "Is the scope appropriate for a single Vegeta session?"
- "Are the acceptance criteria complete and testable?"

#### E. Append to Document

When story is approved:

- Append it to {outputFile} following template structure
- Use correct numbering (Epic N, Story M)
- Maintain proper markdown formatting

### 4. 🛡️ Edge Case Guardian Analysis (MANDATORY)

After all stories for an epic are written AND before getting user confirmation:

**CRITICAL: Invoke the Edge Case Guardian agent (`{project-root}/_bmad/core/agents/Hit.md`) to perform a Full Edge Case Analysis (8-Pillar Scan) on this epic.**

#### A. Research Phase
- Use the Research Prompt Library (`{project-root}/.agent/skills/Hit/resources/research-prompt-library.md`) to search for known edge cases related to this epic's features
- Check the Knowledge Graph at `{output_folder}/edge-case-knowledge/index.md` for related nodes

#### B. 8-Pillar Scan
- Walk through ALL 8 pillars from the SKILL's taxonomy for this epic's stories
- For each story, identify edge cases using the taxonomy reference at `{project-root}/.agent/skills/Hit/resources/taxonomy-8-pillars.md`
- Score each edge case using the FMEA rubric (Severity × Probability × Detectability)

#### C. AC Injection
- For edge cases with RPN ≥ 25 (🟡 and 🔴): Generate `[EDGE-CASE]` tagged Given/When/Then ACs
- Append these ACs to the relevant story's Acceptance Criteria section
- Present the edge cases and proposed ACs to user for review

#### D. Knowledge Graph Update
- Add new edge case nodes to the appropriate pillar files in `{output_folder}/edge-case-knowledge/pillars/`
- Update the index at `{output_folder}/edge-case-knowledge/index.md`
- Generate or update the epic risk matrix using template from `{project-root}/.agent/skills/Hit/templates/risk-matrix-template.md`

### 5. Epic Completion

After all stories AND edge case analysis for an epic are complete:

- Display epic summary
- Show count of stories created
- Show edge case summary: 🔴 [N] critical, 🟡 [N] important, 🟢 [N] awareness
- Verify all FRs for the epic are covered
- Get user confirmation to proceed to next epic

### 5b. 🐉 Songoku AI Requirements Analysis (CONDITIONAL — if epic has AI features)

After edge case analysis, if the epic or any of its stories involve AI features (LLM calls, prompts, RAG pipeline, Cognee integration, embeddings, AI-assisted UI):

**CRITICAL: Invoke the Songoku AI Engineer agent (`{project-root}/.agent/agents/songoku.md`) to analyze AI requirements for the epic.**

#### A. AI Feature Detection
- Scan all stories in the epic for AI keywords: "AI", "LLM", "prompt", "GPT", "embedding", "RAG", "Cognee", "knowledge graph", "model", "token"
- If NO AI features detected → skip this section entirely

#### B. AI Requirements per Story
For each story with AI features:
1. **Prompt Design Requirements:** What prompt templates are needed? What 6-section structure should each follow?
2. **Model Tier Assignment:** Classification (Tier 1/Flash for simple tasks, Tier 2/Pro for complex reasoning)
3. **Token Budget Estimate:** Input tokens + output tokens × expected queries/day
4. **AI Security Checklist:** OWASP LLM Top 10 implications (injection, PII, output validation)
5. **Evaluation Criteria:** What golden tests should be defined? What accuracy threshold?

#### C. AI Story Enhancement
- Add `[AI]` tag to stories that require AI implementation tasks
- Add AI-specific acceptance criteria (e.g., "Given a prompt injection attempt, When the AI processes user input, Then the injection is blocked and logged")
- Add Vegeta Notes hint: "Run `/songoku-ai-spec` before `/Vegeta-story` to generate AI spec"

#### D. AI Cost Projection
- Generate cost estimate for the epic's AI features per month
- Flag stories with expected cost >$50/month for review

### 5. Repeat for All Epics

Continue the process for each epic in the approved list, processing them in order (Epic 1, Epic 2, etc.).

### 6. Final Document Completion

After all epics and stories are generated:

- Verify the document follows template structure exactly
- Ensure all placeholders are replaced
- Confirm all FRs are covered
- Check formatting consistency

## TEMPLATE STRUCTURE COMPLIANCE:

The final {outputFile} must follow this structure exactly:

1. **Overview** section with project name
2. **Requirements Inventory** with all three subsections populated
3. **FR Coverage Map** showing requirement to epic mapping
4. **Epic List** with approved epic structure
5. **Epic sections** for each epic (N = 1, 2, 3...)
   - Epic title and goal
   - All stories for that epic (M = 1, 2, 3...)
     - Story title and user story
     - Acceptance Criteria using Given/When/Then format

### 7. Present FINAL MENU OPTIONS

After all epics and stories are complete:

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue"

#### Menu Handling Logic:

- IF A: Read fully and follow: {advancedElicitationTask}
- IF P: Read fully and follow: {partyModeWorkflow}
- IF C: Save content to {outputFile}, update frontmatter, then read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#7-present-final-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- AUTOMATICALLY PROCEED to the next step when you finish writing and saving stories.

## CRITICAL STEP COMPLETION NOTE

AUTOMATICALLY read fully and follow: `{nextStepFile}` to begin the final validation phase. You do NOT need human input to proceed.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All epics processed in sequence
- Stories created for each epic
- Template structure followed exactly
- All FRs covered by stories
- Stories appropriately sized
- Acceptance criteria are specific and testable
- Document is complete and ready for development

### ❌ SYSTEM FAILURE:

- Deviating from template structure
- Missing epics or stories
- Stories too large or unclear
- Missing acceptance criteria
- Not following proper formatting

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
