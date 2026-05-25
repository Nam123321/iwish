---
name: 'step-04b-data-and-test-spec'
description: 'Generate full data specs, dependency maps, and test strategy from Tier 1 tags — output to FeatureGraph (ADR-002)'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-04b-data-and-test-spec.md'
nextStepFile: './step-05-epic-quality-review.md'
outputFile: '{planning_artifacts}/epics.md'

# Agent References
kiraAgent: '{project-root}/.agent/agents/data-architect.md'
shinjiAgent: '{project-root}/.agent/agents/data-strategist.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 4b: Data & Test Spec Generation (Tier 2)

## STEP GOAL:

To generate comprehensive data specifications, cross-epic dependency maps, and test strategy matrix using the `[DATA:]`, `[FLOW:]`, and `[MANUAL-TEST]` tags collected during Tier 1 Lite Scan in Step 3.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: Process phases sequentially (A → B → C)
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a data architecture and test planning specialist
- ✅ If you already have been given communication or persona patterns, continue to use those while playing this new role
- ✅ We engage in collaborative dialogue, not command-response
- ✅ You bring data modeling and test strategy expertise
- ✅ User brings their implementation priorities and domain knowledge

### Step-Specific Rules:

- 🎯 Use Tier 1 tags as the PRIMARY input — never ignore tagged items
- 🚫 FORBIDDEN to skip any tagged story
- 💬 Every `[DATA:]` tag MUST produce a data spec entry
- 💬 Every `[FLOW:]` tag MUST produce a dependency map entry
- 💬 Every `⚠️` warning MUST be resolved or explicitly accepted by user
- 🚪 PRIMARY output: FeatureGraph via MCP tools (`add_data_entity`, `add_event`, `add_seed_data`)
- 🚪 SECONDARY output (optional): `{output_folder}/data-specs/` for human-readable markdown backup

> **ADR-002 FRESHNESS PROTOCOL — L2 Update:**
> This workflow is a Layer 2 update point for FeatureGraph. After completing each phase, verify the graph was updated by querying back:
> ```
> MATCH (de:DataEntity) WHERE de.updated_at > timestamp() - 300000 RETURN count(de)
> ```
> If FeatureGraph MCP tools are NOT available → fall back to markdown-only output and log WARNING.

## EXECUTION PROTOCOLS:

- 🎯 Extract ALL Tier 1 tags from {outputFile}
- 💾 Generate spec documents per epic
- 📖 Cross-reference tags across epics for conflicts
- 🚫 FORBIDDEN to approve unresolved DATA-CONFLICT or ORPHAN-DATA warnings

## TIER 2 GENERATION PROCESS:

### 1. Tag Inventory

Scan {outputFile} and collect ALL Tier 1 tags into a summary table:

```
| Epic | Story | [DATA:] | [FLOW-OUT:] | [FLOW-IN:] | [KB-SYNC:] | [SEED:] | Testability | Warnings |
|------|-------|---------|------------|-----------|-----------|---------|-------------|----------|
```

Present to user: "Đây là toàn bộ tags từ Tier 1. Sẽ dùng làm input cho 3 phases tiếp theo."

### 2. Phase A: 🗄️ Kira++ Full Data Specification

**Load Kira++ Data Architect knowledge from {kiraAgent} for reference principles (schema-first, naming conventions, standard columns).**

For each epic that has `[DATA:]` tags:

#### A1. Model Specification
For each unique model name in `[DATA:]` tags:
- **Model Name:** PascalCase, singular (e.g., `Product`, `OrderInvoice`)
- **Standard Columns:** `id`, `createdAt`, `updatedAt`, `deletedAt`, `tenantId` (verify presence)
- **Feature Columns:** List all fields with types, constraints, defaults
- **Indexes:** Identify required indexes (tenantId compound indexes, unique constraints)
- **Relations:** Foreign keys and cardinality (1:1, 1:N, M:N)

#### A2. Data Conflict Resolution
For each `⚠️ DATA-CONFLICT` warning:
- Identify the conflicting stories
- Propose resolution: merge fields? separate migrations? ordering constraint?
- **USER MUST CONFIRM** resolution before proceeding

#### A3. Seed Data Specification
For each `[SEED:]` tag:
- Define exact seed data entries
- Validate enum values against existing schema
- Ensure foreign key references resolve

#### A4. Save Data Spec to FeatureGraph (PRIMARY — ADR-002)
For each model specified, call FeatureGraph MCP tool:
```
add_data_entity(name="{ModelName}", prisma_model="{ModelName}", key_fields="{comma-separated fields}", story_id="{story}")
```
For each seed data entry, call:
```
add_seed_data(model="{ModelName}", values="{comma-separated values}", source_story="{story}")
```

#### A4b. Save Data Spec Markdown (OPTIONAL — human-readable backup)
Save to `{output_folder}/data-specs/{epic-key}-data-spec.md` with format:
```markdown
# Data Specification: Epic {N} — {title}

## Models

### {ModelName}
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | String @id @default(cuid()) | PK | Standard |
| tenantId | String | FK → Tenant | Multi-tenant |
| ... | ... | ... | ... |

### Relations
- {ModelName} → {OtherModel}: 1:N via {foreignKey}

## Seed Data
| Model | Field | Values | Source Story |
|-------|-------|--------|-------------|

## Conflict Resolutions
| Conflict | Stories | Resolution | Status |
|----------|---------|------------|--------|
```

### 3. Phase B: 🔀 Shinji Full Dependency Map

**Load Shinji Data Strategist knowledge from {shinjiAgent} for reference principles (producer-consumer, event naming, orphan detection).**

#### B1. Cross-Epic Event Flow Map
Collect all `[FLOW-OUT:]` and `[FLOW-IN:]` tags across ALL epics:
- Match producers with consumers
- Identify unmatched producers → `⚠️ ORPHAN-DATA` (if not already flagged)
- Identify unmatched consumers → `⚠️ MISSING-PRODUCER`

#### B2. Data Dependency Graph
Create a Mermaid diagram showing:
- Epic → Model → Event flow
- Cross-epic dependencies highlighted
- Orphan data nodes marked in red

#### B3. KB Sync Requirements
For each `[KB-SYNC:]` tag:
- Define sync strategy: real-time event-driven vs batch
- Define sync interval SLA
- Identify Cognee/NLM implications

#### B4. Orphan Data Resolution
For each `⚠️ ORPHAN-DATA` warning:
- Propose consumer: which future story/epic should consume this data?
- Or confirm: is this data legitimately terminal (e.g., audit logs)?
- **USER MUST CONFIRM** resolution

#### B5. Save Dependency Map to FeatureGraph (PRIMARY — ADR-002)
For each event, call FeatureGraph MCP tool:
```
add_event(name="{event.name}", type="domain_event", producer_story="{producer}", consumer_stories="{consumers}")
```
For each new FR-to-FR dependency discovered, call:
```
add_feature_relationship(fr_id1, "IMPACTS", fr_id2, reason, confidence)
```

#### B5b. Save Dependency Map Markdown (OPTIONAL — human-readable backup)
Save to `{output_folder}/data-specs/cross-epic-dependency-map.md` with format:
```markdown
# Cross-Epic Data Dependency Map

## Producer-Consumer Matrix
| Event | Producer (Story) | Consumer (Story) | Status |
|-------|-----------------|------------------|--------|

## Mermaid Dependency Graph
[Mermaid diagram]

## KB Sync Requirements
| Entity | Sync Strategy | Interval | Priority |
|--------|-------------|----------|----------|

## Resolved Warnings
| Warning | Resolution | Confirmed By |
|---------|-----------|-------------|
```

### 4. Phase C: 🧪 Quinn Test Strategy Matrix

#### C1. Test Type Classification
Collect all testability data from Tier 1 and classify stories:
- **API Test:** Stories with backend logic, CRUD, validation
- **E2E Test:** Stories with `[E2E-TEST]` tags or full user flows
- **Integration Test:** Stories with `[FLOW:]` tags (event-driven behavior)
- **Manual Test:** Stories with `[MANUAL-TEST]` tags

#### C2. Test Priority Matrix
For each story, assign test priority based on:
- Edge case RPN (from Hit analysis): Higher RPN → higher test priority
- Data complexity (from Kira++ analysis): More models → more tests
- Flow complexity (from Shinji analysis): More events → more integration tests

#### C3. Save Test Strategy
Save to `{output_folder}/test-specs/test-strategy-matrix.md` with format:
```markdown
# Test Strategy Matrix

## Coverage Summary
| Epic | Stories | API Tests | E2E Tests | Integration | Manual | Total ACs | Automatable |
|------|---------|-----------|-----------|-------------|--------|-----------|-------------|

## Story-Level Test Plan
| Story | Test Types | Priority | Key Scenarios | Edge Cases (from Hit) |
|-------|-----------|----------|--------------|----------------------|

## Manual Test Catalog
| Story | AC | Reason Manual | Suggested Approach |
|-------|----|--------------|-------------------|
```

### 5. Tier 2 Completion Summary

Present to user:
- Files generated (list with paths)
- Total models specified
- Total events mapped
- Orphan/conflict warnings resolved
- Test coverage metrics

### 6. Present FINAL MENU OPTIONS

Display: "**Tier 2 Spec Generation Complete!** [A] Advanced Elicitation [P] Party Mode [C] Continue to Quality Review"

#### Menu Handling Logic:

- IF A: Read fully and follow: {advancedElicitationTask}
- IF P: Read fully and follow: {partyModeWorkflow}
- IF C: Proceed to read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then redisplay menu

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN [C continue option] is selected and [all Tier 2 specs saved], will you then read fully and follow: `{nextStepFile}` to begin epic quality review phase.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Every `[DATA:]` tag has a corresponding DataEntity node in FeatureGraph
- Every `[FLOW:]` tag has a corresponding Event node in FeatureGraph
- Every `⚠️` warning is resolved or explicitly accepted
- Cross-epic dependencies captured via FeatureGraph relationships
- Test strategy matrix covers all epics and stories
- FeatureGraph L2 freshness check passed after each phase

### ❌ SYSTEM FAILURE:

- Skipping tagged stories without generating specs
- Leaving `⚠️ DATA-CONFLICT` or `⚠️ ORPHAN-DATA` unresolved
- Missing producer-consumer matching for events
- Incomplete test strategy matrix
- Not following spec document format

**Master Rule:** Every Tier 1 tag MUST produce a FeatureGraph node. No tag left behind.
