---
name: 'step-03-generate-data-spec'
description: 'Generate Data Specification document from analysis findings'

outputFile: '{planning_artifacts}/data-specs/{story_id}-data-spec.md'
---

# Step 3: Generate Data Specification

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER generate data spec without completing the Step 2 analysis
- 📖 CRITICAL: Verify the generated Markdown file complies with the Data Integrity Guardian rules
- 📋 YOU ARE A DATA ARCHITECT, not a filler generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

## EXECUTION PROTOCOLS:

- 🎯 Write the generated Data Specification document to `{planning_artifacts}/data-specs/{story_id}-data-spec.md`
- 💾 Ensure the document is saved and formatted correctly before completing the turn
- 📖 Update frontmatter of the data spec with `stepsCompleted: [1, 2, 3]` and status `complete`

## YOUR TASK:

Compile the schema modifications, DTO details, frontend type changes, and seed data from Step 2 into a formal Data Specification markdown file.

## DATA SPECIFICATION STRUCTURE:

Generate the file at `{planning_artifacts}/data-specs/{story_id}-data-spec.md` (fallback to `{output_folder}/data-specs/{story_id}-data-spec.md` if planning_artifacts is undefined) following this format:

```yaml
---
storyId: '{story_id}'
workflowType: 'data-spec'
status: 'complete'
stepsCompleted: [1, 2, 3]
lastUpdated: '{current_date}'
---

# Data Specification: Story {story_id} — {story_title}

## 1. Schema Modifications (Prisma)

### New & Modified Models
[Detailed Prisma schema syntax representing the new models, indexes, constraints, and relationships]

### Indexes & Constraints
[Description of database indexes and unique constraints added, justifying their necessity]

## 2. API & DTO Contracts

### Affected Endpoints
[List of backend API routes modified or created]

### Request/Response Data Transfer Objects (DTOs)
```typescript
// Define request and response interfaces/classes here
```

## 3. Frontend Type Updates

### Required Frontend Interfaces
[Detail changes needed in frontend files e.g., apps/webstore/src/lib/api.ts or apps/admin/src/lib/api.ts]

## 4. Seed Data & Test Data Matrix

### Seed Data Definition
[The JSON or TypeScript seed objects required for local developer seeding]

## 5. Integrity & Compliance Verification

- [ ] Table naming is PascalCase, singular (Data Integrity Guardian Section 1)
- [ ] Required standard columns exist: `id, createdAt, updatedAt, deletedAt, tenantId` (Section 2)
- [ ] Enums are used for finite state properties (Section 5)
- [ ] No breaking database changes without explicit rollback/compatibility plan (Section 6)
```

## COMPLETION MESSAGE:

Present the final confirmation message to the user:
"✅ **Data Specification Completed!**
File generated at: `{planning_artifacts}/data-specs/{story_id}-data-spec.md`

You can now proceed to the development phase (`/code` or `/iwish-feature-dev-story`)."

## WORKFLOW COMPLETE
