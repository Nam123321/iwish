---
name: 'step-03-create-stories'
description: 'Generate all epics with their stories following the template structure'

# Path Definitions
workflow_path: '{project-root}/.agent/workflows'

# File References
thisStepFile: './step-03-create-stories.md'
nextStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/2. Product Planning/2.4. epics-and-stories.md'

# Task References
advancedElicitationTask: '{project-root}/_iwish/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_iwish/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 3: Generate Epics and Stories

## STEP GOAL:

To generate all epics with their stories based on the approved epics_list, following the template structure exactly.

## MANDATORY EXECUTION RULES (READ FIRST):

> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> Before proceeding to step 4, you MUST use the `view_file` tool to load and read the following fragments:
> - `/.agent/fragments/research-prompt-library.md`
> - `/.agent/fragments/taxonomy-8-pillars.md`
> - `/.agent/fragments/risk-matrix-template.md`
> Failure to do so violates the I-Wish architecture.

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
- 🚪 ENSURE each story is completable by a single dev-agent agent
- 🔗 **CRITICAL: Stories MUST NOT depend on future stories within the same epic**

## EXECUTION PROTOCOLS:

- 🎯 Generate stories collaboratively with user input
- 💾 Append epics and stories to {outputFile} following template
- 📖 Process epics one at a time in sequence
- 🚫 FORBIDDEN to skip any epic or rush through stories

## STORY GENERATION PROCESS:

### 1. Load Approved Epic Structure & SIM

Load and review the prerequisites:
- **Approved epics_list:** From {outputFile} (Step 2).
- **System Integrity Map (SIM):** Load `{planning_artifacts}/2. Product Planning/2.3.5. system-integrity-map.md`. 
  - 🛑 **HARD GATE:** If the SIM file is missing or empty, you MUST halt and warn the user: *"⚠️ SIM file chưa tồn tại. Vui lòng chạy /create-sim trước để khởi tạo System Integrity Map."*
- **SIM Change Detection & Audit:** If the SIM file was modified after stories were generated, perform a change impact audit. Scan all stories for:
  - *Orphaned components* (endpoints/entities without matching presentation).
  - *FE-only fragments* (UI spec files without corresponding API contract).
  - *Reusable engines* (duplicated core logic across epics).
  - *Coverage gaps* (layers missing critical story coverage).
  - ⚠️ **Emit a warning report** to the user detailing the drift before proceeding.
- **FR coverage map**
- **All requirements** (FRs, NFRs, additional)
- **Template structure** at the end of the document

### 2. Explain Story Creation Approach

**STORY CREATION GUIDELINES:**

For each epic, create stories that:

- Follow the exact template structure
- Are sized for single dev-agent agent completion
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

**Epic:** Epic {N}: {epic_title}
**Story Title:** {story_title}
**FR Covered:** [{FR-ID}: {FR-Name}] (e.g., [FR-1.1: Platform Mode Detection](file:///path/to/prd.md#FR-1.1))
**Goal:** {story_goal}

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

#### B. Story Breakdown (3-Option Standard)

Before proposing stories, you MUST propose at least **3 distinct story decomposition options** for the epic:
- **Option 1: Vertical Slice First (Tracer Bullet)** — Propose slicing stories where each story goes UI -> API -> DB. Good for early feedback but harder to manage parallel work on shared engines.
- **Option 2: Core Engine / Platform First** — Propose building the core business domain models and services first, then wrapping them with UI stories. Best for complex logic to prevent duplicate reusable engines, but delays user feedback.
- **Option 3: Contract / Interface Driven** — Propose defining the API contracts/schemas first, then parallelizing FE and BE stories. Excellent for swarm development, but requires strict validation gates.

For each option, analyze:
- **Pros (Ưu điểm)**
- **Cons (Nhược điểm)**
- **Recommendation:** Highlight which option you recommend and why based on the approved SIM (`2.3.5. system-integrity-map.md`).

**[User Gate - Decomposition Approval]** Halt and wait for the user to select one of the 3 decomposition options before generating the specific user stories.

#### C. Generate Each Story

For each story in the epic:

1. **Story Title**: Clear, action-oriented
2. **User Story**: Complete the As a/I want/So that format
3. **Acceptance Criteria**: Write specific, testable criteria

**AC Writing Guidelines:**

- Use Given/When/Then format
- Each AC should be independently testable
- 🛡️ **EDGE CASES:** After writing happy-path ACs, the Review Agent (`{project-root}/.agent/agents/review-agent.md`) loading the Edge Case Guardian SKILL (`{project-root}/.agent/skills/edge-case-guardian/SKILL.md`) will be invoked to systematically identify edge cases using the 8-Pillar Taxonomy. Edge case ACs will be tagged with `[EDGE-CASE]` prefix.
- Reference specific requirements when applicable

#### D. Collaborative Review

After writing each story:

- Present the story to user
- Ask: "Does this story capture the requirement correctly?"
- "Is the scope appropriate for a single dev-agent session?"
- "Are the acceptance criteria complete and testable?"

#### E. Append to Document

When story is approved:

- Append it to {outputFile} following template structure
- Use correct numbering (Epic N, Story M)
- Maintain proper markdown formatting

### 3.5. 📐 Plan Tune Heuristic Check (MANDATORY)

After generating ALL stories for an epic AND before running the Edge Case Guardian:

> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> You MUST use `view_file` to load `/.agent/fragments/plan-tune-heuristic.md` before proceeding.

#### A. Calculate Complexity Score (CS) for Each Story

For each story in the current epic, evaluate the 6 dimensions from the Plan Tune Heuristic fragment:

1. **AC Volume** — Count all ACs (including edge-case tagged). If > 8 → +2.
2. **Data Model Spread** — Count DB models touched (CREATE/ALTER). If > 3 → +3.
3. **UI Surface** — Count new UI components to build. If > 4 → +2.
4. **Cross-Domain** — Does story cross > 1 bounded context? If yes → +3.
5. **Flow Complexity** — Has async events, webhooks, state machines? If yes → +2.
6. **Test Burden** — Count `[E2E-TEST]` or `[MANUAL-TEST]` tagged ACs. If > 3 → +1.

#### B. Apply Verdict

- **CS ≤ 3**: ✅ Proceed normally.
- **CS 4–6**: ⚠️ Display `[PLAN-TUNE WARNING]` with breakdown. Ask User if they want to split.
- **CS ≥ 7**: 🛑 Display `[PLAN-TUNE HALT]`. Present split proposal using the 6 Split Criteria from the fragment. **HALT** until User approves.

#### C. Apply Merge Check

Scan ALL stories in this epic for Merge signals (Tiny Story, Tight Coupling, Same Model Lock, No User Value, Sequential Dependency). Propose merges if detected.

#### D. Present Tuning Summary

```
📐 Plan Tune Report — Epic N:
| Story | CS | Verdict | Action |
|-------|-----|---------|--------|
| N.1   | 3   | ✅ OK   | —      |
| N.2   | 8   | 🛑 HALT | Split into N.2a + N.2b |
| N.3   | 1   | ✅ OK   | Merge into N.2a (Tiny Story) |
```

Ask User: "Plan Tune hoàn tất. Xác nhận phương án tách/gộp trước khi tiếp tục Edge Case Guardian?"

### 4. 🛡️ Edge Case Guardian Analysis (MANDATORY)

After all stories for an epic are written AND before getting user confirmation:

**CRITICAL: Invoke the Review Agent (`{project-root}/.agent/agents/review-agent.md`) loading the Edge Case Guardian SKILL (`{project-root}/.agent/skills/edge-case-guardian/SKILL.md`) to perform a Full Edge Case Analysis (8-Pillar Scan) on this epic.**

#### A. Research Phase
- Use the Research Prompt Library (`{project-root}/.agent/fragments/research-prompt-library.md`) to search for known edge cases related to this epic's features
- Check the Knowledge Graph at `{output_folder}/edge-case-knowledge/index.md` for related nodes

#### B. 8-Pillar Scan
- Walk through ALL 8 pillars from the SKILL's taxonomy for this epic's stories
- For each story, identify edge cases using the taxonomy reference at `{project-root}/.agent/fragments/taxonomy-8-pillars.md`
- Score each edge case using the FMEA rubric (Severity × Probability × Detectability)

#### C. AC Injection
- For edge cases with RPN ≥ 25 (🟡 and 🔴): Generate `[EDGE-CASE]` tagged Given/When/Then ACs
- Append these ACs to the relevant story's Acceptance Criteria section
- Present the edge cases and proposed ACs to user for review

#### D. Knowledge Graph Update
- Add new edge case nodes to the appropriate pillar files in `{output_folder}/edge-case-knowledge/pillars/`
- Update the index at `{output_folder}/edge-case-knowledge/index.md`
- Generate or update the epic risk matrix at `{output_folder}/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (derive {epic_id} from the epic number, e.g. Epic 1 -> Epic-1) using the template from `{project-root}/.agent/fragments/risk-matrix-template.md`

### 5. Epic Completion

After all stories, edge case analysis, AI analysis, AND Tri-Agent Lite Scan for an epic are complete:

- Display epic summary
- Show count of stories created
- Show edge case summary: 🔴 [N] critical, 🟡 [N] important, 🟢 [N] awareness
- Show data impact summary: 📊 [N] models touched, [N] data conflicts, [N] seed requirements
- Show flow impact summary: 🔀 [N] events produced, [N] events consumed, [N] orphan risks
- Show testability summary: 🧪 X/Y ACs automatable, [N] manual-only
- Verify all FRs for the epic are covered
- Get user confirmation to proceed to next epic

### 5b. 🐉 ai-engineer-agent AI Requirements Analysis (CONDITIONAL — if epic has AI features)

After edge case analysis, if the epic or any of its stories involve AI features (LLM calls, prompts, RAG pipeline, Cognee integration, embeddings, AI-assisted UI):

**CRITICAL: Invoke the ai-engineer-agent AI Engineer agent (`{project-root}/.agent/agents/ai-agent.md`) to analyze AI requirements for the epic.**

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
- Add dev-agent Notes hint: "Run `/ai-engineer-agent-ai-spec` before `/dev-agent-story` to generate AI spec"

#### D. AI Cost Projection
- Generate cost estimate for the epic's AI features per month
- Flag stories with expected cost >$50/month for review

### 5c. 📊🧪 Tri-Agent Lite Scan (MANDATORY)

After all stories for an epic have been written AND after review-agent + ai-engineer-agent analysis:

**PURPOSE: Lightweight inline checks that TAG stories for Tier 2 deep analysis. These checks do NOT load agent persona files — they use embedded checklists to minimize context overhead.**

#### A. 🗄️ Kira++ LITE — Data Impact Flag

For each story in this epic, answer these 3 questions:

1. **Model Impact:** Does this story require creating or modifying any database tables/models?
   - If YES: Add tag `[DATA: ModelName1, ModelName2]` to the story title
   - List the specific fields/columns being added or changed
2. **Data Conflict Check:** Does any model touched by this story ALSO appear in a `[DATA:]` tag of a previous story in this or earlier epics?
   - If YES: Add flag `⚠️ DATA-CONFLICT: ModelName also modified in Story X.Y` under the story's AC section
   - Describe the potential conflict (e.g., "Both stories add columns to Product table")
3. **Seed Data Required?** Does this story introduce new enum values, lookup data, or reference data that needs seeding?
   - If YES: Add note `[SEED: description]` (e.g., `[SEED: new OrderStatus enum values: REFUNDED, PARTIALLY_REFUNDED]`)

#### B. 🔀 Shinji LITE — Flow Impact Flag

**Skip this check if the story is purely UI with no backend data changes.**

For each story with backend changes:

1. **Event Detection:** Does this story produce or consume any events, webhooks, notifications, or async operations?
   - If produces: Add tag `[FLOW-OUT: domain.entity.action]` (e.g., `[FLOW-OUT: order.invoice.created]`)
   - If consumes: Add tag `[FLOW-IN: domain.entity.action]` (e.g., `[FLOW-IN: payment.confirmed]`)
2. **Orphan Data Risk:** Does this story create data that is NOT consumed by any other story in any epic?
   - If YES: Add flag `⚠️ ORPHAN-DATA: [entity] produced but no consumer identified`
3. **KB/AI Sync:** Does this story modify entities that should be indexed in Knowledge Base or AI systems?
   - If YES: Add tag `[KB-SYNC: EntityName]`

#### C. 🧪 Quinn LITE — Testability Check

For each story in this epic:

1. **AC Format Validation:** Are ALL acceptance criteria in proper Given/When/Then format?
   - If any AC is missing Given/When/Then → rewrite it into proper format
2. **Automation Assessment:** For each AC, determine if it can be automated:
   - Automatable (API/unit test) → no tag needed
   - Automatable (E2E/browser test) → tag `[E2E-TEST]`
   - Manual only (visual, UX, accessibility) → tag `[MANUAL-TEST]`
3. **Testability Score:** Calculate `Testability: X/Y ACs automatable` and add to story metadata

#### D. Lite Scan Summary

Present summary table to user:
```
| Story | [DATA:] Models | [FLOW:] Events | Testability | Warnings |
|-------|---------------|----------------|-------------|----------|
| N.1   | Product, SKU  | order.created  | 5/6 auto    | —        |
| N.2   | Invoice       | —              | 3/3 auto    | ⚠️ DATA-CONFLICT |
```

Ask user: "Lite scan hoàn tất. Các tag này sẽ được sử dụng làm input cho Tier 2 Full Spec sau khi tất cả epics hoàn thành. Có muốn điều chỉnh gì không?"

### 5. Repeat for All Epics

Continue the process for each epic in the approved list, processing them in order (Epic 1, Epic 2, etc.).

### 6. Final Document Completion

After all epics and stories are generated:

- Verify the document follows template structure exactly
- Ensure all placeholders are replaced
- Confirm all FRs are covered
- Check formatting consistency
- **Run Phase 2 SIM Reverse-Sync & Audit (MANDATORY):**
  - Execute: `iwish create-sim --sync`
  - 🛑 **HARD GATE:** If the command output contains any `[COVERAGE-GAP]` warnings (such as `⚠️ Empty Epic`, `⚠️ FE-Only Fragment`, or `⚠️ Orphaned Backend`), you **MUST HALT** and present a mitigation plan (e.g., creating the missing backend or UI stories) to the user. Do not proceed until these architectural integrity gaps are resolved.

### 6.5. TIER 1 HYBRID GRAPH UPDATE (MANDATORY)

CRITICAL: BẮT BUỘC phải đưa file `epics-and-stories.md` này vào Knowledge Graph ngay khi hoàn thành bằng lệnh CLI:
`iwish inject-node --file "{planning_artifacts}/2. Product Planning/2.4. epics-and-stories.md" --metadata '{"summary": "Toàn bộ Epics và Stories của dự án", "tags": ["epic", "story", "planning"], "layer": "documentation", "complexity": "medium"}'`
Điều này đảm bảo FalkorDB và các AI Agent khác có thể truy xuất ngay lập tức các yêu cầu và user story.

### 6.6. FEATURE HIERARCHY & FEATUREGRAPH INDEXING (MANDATORY)

> [!IMPORTANT]
> After the Hybrid Graph update, the **Feature Hierarchy** must be generated to ensure portal-level feature mapping and cross-feature relationships are captured before proceeding.

1. **Trigger Feature Hierarchy Generation:**
   - Execute Step 5c from `step-04-final-validation.md` — generate `feature-hierarchy.md` from PRD, Architecture, and Epics sources.
   - Save to `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md`.

2. **Run FeatureGraph Indexer:**
   - After `feature-hierarchy.md` is generated, run `iwish featuregraph-index` to parse the hierarchy and index all features, portals, and cross-feature relationships into FalkorDB.
   - If FalkorDB is not available, the indexer will skip gracefully with a log message — this is non-blocking.

3. **Verification:** Confirm `feature-hierarchy.md` exists and is non-empty before proceeding.

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
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - always respond and then end with display again of the menu options

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN [C continue option] is selected and [all epics and stories saved to document following the template structure exactly], will you then read fully and follow: `{nextStepFile}` to begin final validation phase.

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
