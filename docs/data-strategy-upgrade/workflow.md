---
name: "create-data-flow"
description: "Design data flow architecture for a feature or epic"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Data Flow Architecture

## Pre-requisites
- Story file or epic description available
- PRD and Architecture docs available (recommended)
- Prisma schema accessible

## Workflow Steps

### Step 1: Context Loading
1. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
2. Load the story file specified by the user (or ask for it)
3. Load the PRD from `{output_folder}/planning-artifacts/prd.md` (if exists)
4. Load the Architecture doc from `{output_folder}/planning-artifacts/architecture.md` (if exists)
5. Load the Prisma schema from `{project-root}/distro/prisma/schema.prisma`
6. Identify scope: which entities and modules are involved

### Step 2: Entity Identification
1. List ALL entities (Prisma models) involved in the feature
2. For each entity, classify as:
   - **Producer** — creates or modifies data (e.g., Admin creates Product)
   - **Consumer** — reads or reacts to data (e.g., AI queries Product for KB)
   - **Both** — produces and consumes (e.g., Order service creates order AND triggers notifications)
3. Identify **external systems** involved (Cognee, NotebookLM, Redis, payment gateways)

### Step 3: Data Flow Mapping
For each data path (producer → consumer), document:

| Field | Description |
|---|---|
| **Source** | Producer entity + service |
| **Destination** | Consumer entity + service |
| **Trigger** | What initiates the data flow (CRUD event, cron, user action) |
| **Transport** | How data moves (direct service call, Redis pub/sub, Bull queue, HTTP webhook) |
| **Frequency** | Real-time, near-real-time (< 1min), batch (hourly/daily) |
| **Sync Strategy** | Push (event-driven), Pull (polling), CDC (change data capture) |
| **Failure Mode** | What happens when this flow fails (retry, dead letter, graceful degrade) |

### Step 4: KB Sync Assessment
If the feature involves data that should be available to AI:
1. Check if the entity is already indexed in Cognee or NotebookLM
2. If NOT indexed → design sync pipeline following Option C (Hybrid):
   - Cognee = unified query layer for AI consumers
   - NLM = content engine for rich content generation
3. Define sync trigger (on CRUD, batch, or manual)
4. Define staleness threshold (max acceptable delay between DB change and KB update)

### Step 5: Producer/Consumer Matrix
Create a matrix showing ALL data relationships:

```
| Entity | Produced By | Consumed By | Sync Strategy | KB Indexed? |
|--------|-------------|-------------|---------------|-------------|
| Product | Admin CRUD | AI Chat, PDP, Recommendations | Event-driven | ❌ → Cognee |
| Order | NVBH/Customer | Notifications, BI, Inventory | Event-driven | N/A |
```

### Step 6: Mermaid Flow Diagram
Create a comprehensive Mermaid diagram showing:
- All producers (left side)
- All consumers (right side)
- Transport layers (middle)
- KB systems (Cognee, NLM)
- External systems
- Color-coding: ✅ implemented, ❌ missing, ⚠️ partial

### Step 7: Gap Analysis
Identify:
1. **Orphan producers** — data created but never consumed
2. **Missing consumers** — services that SHOULD use this data but don't
3. **Stale data paths** — flows that exist but are too slow
4. **Missing KB sync** — entities that AI should know about but aren't indexed
5. **Single points of failure** — flows without retry/fallback

### Step 8: Recommendations
For each gap, provide:
1. Severity (🔴 Critical, 🟡 Medium, 🟢 Low)
2. Recommended solution
3. Estimated effort
4. Dependencies
5. Flag "⚡ Kira++ collaboration recommended" if schema changes needed

### Step 9: Output
Save to `{output_folder}/data-specs/{feature-key}-data-flow-architecture.md` with:
- Entity list
- Producer/Consumer matrix
- Mermaid flow diagram
- Gap analysis
- Recommendations

Present to user for review.
