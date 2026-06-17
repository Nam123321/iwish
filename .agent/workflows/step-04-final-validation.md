---
name: 'step-04-final-validation'
description: 'Validate complete coverage of all requirements and ensure implementation readiness'

# Path Definitions
workflow_path: '{project-root}/.agent/workflows'

# File References
thisStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/2. Product Planning/2.4. epics-and-stories.md'

# Task References
advancedElicitationTask: '{project-root}/_iwish/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_iwish/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 4: Final Validation

## STEP GOAL:

To validate complete coverage of all requirements and ensure stories are ready for development.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: Process validation sequentially without skipping
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a product strategist and technical specifications writer
- ✅ If you already have been given communication or persona patterns, continue to use those while playing this new role
- ✅ We engage in collaborative dialogue, not command-response
- ✅ You bring validation expertise and quality assurance
- ✅ User brings their implementation priorities and final review

### Step-Specific Rules:

- 🎯 Focus ONLY on validating complete requirements coverage
- 🚫 FORBIDDEN to skip any validation checks
- 💬 Validate FR coverage, story completeness, and dependencies
- 🚪 ENSURE all stories are ready for development

## EXECUTION PROTOCOLS:

- 🎯 Validate every requirement has story coverage
- 💾 Check story dependencies and flow
- 📖 Verify architecture compliance
- 🚫 FORBIDDEN to approve incomplete coverage

## CONTEXT BOUNDARIES:

- Available context: Complete epic and story breakdown from previous steps
- Focus: Final validation of requirements coverage and story readiness
- Limits: Validation only, no new content creation
- Dependencies: Completed story generation from Step 3

## VALIDATION PROCESS:

### 1. FR Coverage Validation

Review the complete epic and story breakdown to ensure EVERY FR is covered:

**CRITICAL CHECK:**

- Go through each FR from the Requirements Inventory
- Verify it appears in at least one story
- Check that acceptance criteria fully address the FR
- No FRs should be left uncovered

### 2. Architecture Implementation Validation

**Check for Starter Template Setup:**

- Does Architecture document specify a starter template?
- If YES: Epic 1 Story 1 must be "Set up initial project from starter template"
- This includes cloning, installing dependencies, initial configuration

**Database/Entity Creation Validation:**

- Are database tables/entities created ONLY when needed by stories?
- ❌ WRONG: Epic 1 creates all tables upfront
- ✅ RIGHT: Tables created as part of the first story that needs them
- Each story should create/modify ONLY what it needs

### 3. Story Quality Validation

**Each story must:**

- Be completable by a single dev-agent agent
- Have clear acceptance criteria
- Reference specific FRs it implements
- Include necessary technical details
- **Not have forward dependencies** (can only depend on PREVIOUS stories)
- Be implementable without waiting for future stories

### 4. Epic Structure Validation

**Check that:**

- Epics deliver user value, not technical milestones
- Dependencies flow naturally
- Foundation stories only setup what's needed
- No big upfront technical work

### 5. Dependency Validation (CRITICAL)

**Epic Independence Check:**

- Does each epic deliver COMPLETE functionality for its domain?
- Can Epic 2 function without Epic 3 being implemented?
- Can Epic 3 function standalone using Epic 1 & 2 outputs?
- ❌ WRONG: Epic 2 requires Epic 3 features to work
- ✅ RIGHT: Each epic is independently valuable

**Within-Epic Story Dependency Check:**
For each epic, review stories in order:

- Can Story N.1 be completed without Stories N.2, N.3, etc.?
- Can Story N.2 be completed using only Story N.1 output?
- Can Story N.3 be completed using only Stories N.1 & N.2 outputs?
- ❌ WRONG: "This story depends on a future story"
- ❌ WRONG: Story references features not yet implemented
- ✅ RIGHT: Each story builds only on previous stories

### 5a. Data Spec Gate Validation (NEW — CRITICAL)

**For EVERY story in EVERY epic, verify Business Flow Analysis completeness:**

```
Scan each story for the "#### Business Flow Analysis" section.
For each story, check:
  ✅ Has "API Routes:" with at least 1 route (unless tagged [UI-ONLY])
  ✅ Has "DB Impact:" with at least 1 table (unless tagged [UI-ONLY])
  ✅ Has "Error Boundaries:" with at least 1 error case
  ✅ Has "RBAC Rules:" if the feature involves role-based access
```

**Validation result table:**

```
| Story  | API Routes | DB Impact | Errors | RBAC | Status |
|--------|-----------|-----------|--------|------|--------|
| 1.1    | 2 routes  | 1 table   | 3      | Yes  | ✅ PASS |
| 1.2    | 0         | 0         | 0      | No   | ❌ FAIL — missing all specs |
| 1.3    | [UI-ONLY] | [UI-ONLY] | 1      | No   | ✅ PASS (UI-ONLY justified) |
```

🛑 **If ANY story FAILS the Data Spec Gate without [UI-ONLY] justification:**
- HALT validation
- Present the failing stories to user
- Return to Step 3 to add missing Business Flow Analysis
- FORBIDDEN to proceed to Feature Hierarchy generation with incomplete stories

### 5ab. Domain Ownership Validation (NEW — CRITICAL)

**For EVERY epic, verify single-domain ownership:**

1. **Single Concern Test**: Describe each epic's domain in ≤ 3 words
   - If description requires "and" or "+" → flag as domain violation
2. **FR Scatter Check**: Do all FRs in this epic come from ≤ 2 PRD sections?
   - If FRs span 3+ sections → flag for re-clustering
3. **Story Placement Check**: For each story, does it logically belong to this epic's domain?
   - If a story would fit better in another epic → flag for relocation

Present domain validation table:
```
| Epic | Domain (≤3 words) | FR Sections | Stories | Status |
|------|-------------------|-------------|---------|--------|
| E-01 | User authentication | 1 section   | 5       | ✅ PASS |
| E-04 | Kanban + Chat + OAuth | 3+ sections | 8     | ❌ FAIL — 3 domains |
```

### 5b. Spec Clarification Validation Gate (CRITICAL)

**Check for unresolved clarification markers:**
- Scan all generated epic, story, and specification markdown documents for the string: `[NEEDS CLARIFICATION`
- If ANY occurrence is found:
  - 🛑 **HALT execution immediately.**
  - Identify the exact file and the query inside the bracket.
  - Present the questions to the user and prompt for resolution.
  - You are FORBIDDEN from finalizing the plan or transitioning to implementation until the markers are resolved.
- If none are found, proceed.

### 5c. Feature Hierarchy Generation (MANDATORY)

> [!IMPORTANT]
> This step generates `feature-hierarchy.md` — the single source of truth for portal-level feature mapping, sidebar navigation trees, and cross-feature relationships. It is consumed by **14 downstream workflows** including UI Spec generation, Dev Story execution, Impact Analysis, and FeatureGraph indexing.

**After all validation steps pass, generate the Feature Hierarchy document:**

1. **Read Input Sources:**
   - PRD → extract all FRs with their `Primary Portals` field and Phase/Tier classification
   - Architecture → extract Portal definitions (tech stack, platform, primary users, navigation pattern)
   - Epics → extract FR→Epic→Story mapping for traceability

2. **Generate Document Sections:**
   - **Portal Overview Table:** # | Portal | Tech Stack | Platform | Primary Users | Navigation
   - **Per-Portal Sidebar/Menu Trees:** Each portal gets a full sidebar tree in ASCII format:
     ```
     🖥️ Portal Name
     │
     ├── 📊 Menu Group
     │   ├── Feature Name                    FR## │ E#/S#.# │ Phase │ Tier
     │   ├── Sub-Feature                     FR## │ E#/S#.# │ Phase │ Tier
     │   └── ...
     ```
   - **Cross-Portal Feature Summary:** Feature count per portal, tier distribution, shared features matrix

3. **Edge Case Handling:**
   - If project has no portal concept (single-page app) → create single 'App' portal grouping FRs by feature area
   - If PRD has no 'Primary Portals' field → infer from Architecture portal definitions + FR functional area, flag ambiguous with `[NEEDS REVIEW]`
   - If epics don't reference FRs → map by Epic title as feature group, flag as `[LEGACY-COMPAT]`

4. **Save Location:** `{_iwish-output}/2. Product Planning/2.5. feature-hierarchy.md`

5. **Reference Template:** Load `templates/library/code-intelligence-pack/featuregraph/feature-hierarchy-template.md` for the canonical document structure.

> **NOTE:** For existing projects upgrading to this I-Wish version, run `iwish featuregraph-retrofit` to generate this document retroactively from existing artifacts.

### 6. Complete and Save

If all validations pass:

- Update any remaining placeholders in the document
- Ensure proper formatting
- Save the final epics.md

**Present Final Menu:**
**All validations complete!** [C] Continue to Quality Review

When C is selected, proceed to step-05 for quality review.

Read fully and follow: `./step-05-epic-quality-review.md`

> **NOTE:** If you need cross-epic data overview, run `/create-data-overview` as a standalone step before moving to Phase 4 implementation. See ADR-001 in `docs/decisions/` for the data workflow architecture.
