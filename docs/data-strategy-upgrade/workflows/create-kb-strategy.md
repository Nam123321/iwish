---
name: "create-kb-strategy"
description: "Design Knowledge Base ingestion and synchronization pipeline for a feature"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create KB Sync Strategy

## Pre-requisites
- KB Sync Validator SKILL available at `{project-root}/.agent/skills/kb-sync-validator/SKILL.md`
- Story or feature scope defined
- Prisma schema accessible

## Workflow Steps

### Step 1: Current State Assessment
1. Load the KB Sync Validator SKILL from `{project-root}/.agent/skills/kb-sync-validator/SKILL.md`
2. Run checks K1 (Entity Coverage) and K2 (Consumer Integration) to establish baseline
3. Document current sync status for entities in scope

### Step 2: Identify KB-Worthy Entities
For the specified feature, identify entities that AI consumers SHOULD know about:

**Criteria for KB indexing:**
- Entity contains product knowledge (descriptions, specs, storage conditions)
- Entity contains business rules (CTKM conditions, pricing rules)
- Entity contains training data (behavioral corrections, golden templates)
- Entity is referenced by AI consumers (chat, recommendations, content gen)
- Entity changes affect AI response quality

### Step 3: Design Sync Pipeline (Option C Hybrid)

For each KB-worthy entity, design:

| Field | Description |
|---|---|
| **Source Entity** | Prisma model name |
| **Target KB** | Cognee (unified query) or NLM (content engine) or Both |
| **Sync Trigger** | CRUD event, batch cron, manual upload |
| **Fields to Index** | Which fields from the model go into KB |
| **Transform** | Any data transformation before indexing |
| **Staleness Threshold** | Max acceptable delay (minutes/hours) |
| **Tenant Scoping** | How tenant isolation is enforced |
| **Failure Recovery** | Retry strategy, dead letter queue |

### Step 4: Pipeline Architecture Diagram

Create Mermaid diagram showing:
```
[Source Entities] → [Sync Service] → [Cognee / NLM]
                                   ↓
                            [AI Consumers]
```

Include: triggers, batch schedules, error paths.

### Step 5: Consumer Integration Plan
For each AI consumer module that SHOULD use KB data:

| Consumer | Query Type | KB System | Expected Input | Expected Output |
|----------|-----------|-----------|---------------|-----------------|
| chat-to-order | Semantic search | Cognee | Customer message keywords | Product knowledge context |
| social-content | Content retrieval | Cognee + NLM | Product IDs, content type | Approved content assets |

### Step 6: PromptAssembly Integration
Design how KB data feeds into the PromptAssembly pipeline:
1. Which KB data becomes system prompt context?
2. Which KB data becomes dynamic RAG context?
3. How to handle context window limits (token budgeting)?
4. Cache strategy for assembled prompts with KB context

### Step 7: Validation
Run the KB Sync Validator SKILL (K1-K5) against the proposed design:
- All identified entities have coverage
- All consumer modules have integration plan
- Staleness thresholds are defined
- Bidirectional sync is designed where applicable
- Tenant isolation is verified

### Step 8: Schema Requirements
Flag any schema changes needed as "⚡ Kira++ collaboration recommended":
- New index columns (e.g., `lastKbSyncedAt` on Product)
- New models (e.g., `KbSyncLog`)
- New events/enums

### Step 9: Output
Save to `{output_folder}/data-specs/{feature-key}-kb-sync-strategy.md` with:
- Current state assessment
- Entity coverage plan
- Pipeline architecture (Mermaid diagram)
- Consumer integration plan
- PromptAssembly integration
- Schema change requirements
- Phased implementation plan

Present to user for review.
