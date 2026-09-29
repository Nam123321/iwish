---
name: 'step-02.5-data-design'
description: 'Data Design & Schema Alignment Gate (Kira++ & Shinji)'
outputFile: '{planning_artifacts}/1. Epic & Story/Epic-{epic_id}/{story_id}/data-blueprint.md'
---

# Step 2.5: Data Design & Schema Alignment

This step aligns the database schema (owned by Kira++) and the data flow/caching strategy (owned by Shinji) before any implementation begins. It prevents schema drift and architectural conflicts.

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 **NEVER** pass this step without validating against `_iwish-output/iwish-skills/draft-rules/data-raci.md`.
- 📖 **CRITICAL:** Both Kira++ and Shinji must sign-off on the generated `data-blueprint.md`.
- 📋 You are acting as the dual interface of **Kira++ (Data Architect)** and **Shinji (Data Strategist)**.

## EXECUTION PROTOCOLS:

1. Analyze the User Story spec for database impacts (Prisma schema changes, new tables, changed columns, indexing, caching requirements, event publishing).
2. Generate the `data-blueprint.md` at `{planning_artifacts}/1. Epic & Story/Epic-{epic_id}/{story_id}/data-blueprint.md` (fallback to `{output_folder}/1. Epic & Story/Epic-{epic_id}/{story_id}/data-blueprint.md` if planning_artifacts is undefined).
3. If no database changes are required for the story, output a minimal blueprint stating "No Database Changes Required".

## DATA BLUEPRINT STRUCTURE:

Generate the file following this template:

```markdown
---
storyId: '{story_id}'
workflowType: 'data-blueprint'
status: 'aligned'
lastUpdated: '{current_date}'
---

# Data Blueprint & Alignment: Story {story_id} — {story_title}

## 1. Role Sign-Off (RACI Alignment)
- [ ] **Kira++ (Data Architect):** Approved schema modifications, indexes, and migration strategy.
- [ ] **Shinji (Data Strategist):** Approved query patterns, caching strategy, and event/data flows.

## 2. Database Schema (Kira++)
- **Prisma Schema Mod (Proposed):**
```prisma
// Proposed modifications to schema.prisma
```
- **Indexes & Unique Constraints:**
  [List proposed indexes and justification]
- **Migration Strategy:**
  [Describe migration plan (e.g., standard migration, no-downtime double write, SQLite-only local migration)]

## 3. Data Flow & Strategist Rules (Shinji)
- **Query & Retrieval Patterns:**
  [List critical queries and optimization strategies]
- **Caching Mechanism (Redis/In-Memory):**
  [Eviction strategies, key namespaces, TTLs]
- **Event Pipelines:**
  [List events emitted/consumed, schemas, and queues]

## 4. Concurrency & Locking
- [Describe locking strategy for shared/hot resources (e.g., pessimistic locks, lockfiles, Optimistic Concurrency Control)]

## 5. Verification Checklist
- [ ] No duplicate or conflicting models with parallel stories.
- [ ] Indexing strategy matches expected queries.
- [ ] Caching invalidation rules are clearly defined.
- [ ] Local SQLite URL isolation configured.
```

## COMPLETION MESSAGE:

Present the final confirmation message:
"✅ **Data Blueprint & Alignment Completed!**
File generated at: `{planning_artifacts}/1. Epic & Story/Epic-{epic_id}/{story_id}/data-blueprint.md`

You can now proceed to `step-03-generate-data-spec` or `/code` development."
