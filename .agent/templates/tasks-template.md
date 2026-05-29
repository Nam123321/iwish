# Tasks Checklist: {{Feature/Story Title}}

This checklist is structured into sequential phases. Follow the **Task Scaffolding Policy** for parallel execution logic (`AG_MAO` vs. `LEGACY_INJECTION`).

---

## Phase 1: Setup & Shared Infrastructure
*Prepares database connections, config mappings, or project dependencies. Must be completed sequentially before Phase 2.*
- [ ] T001 [US{{StoryID}}] Prepare database connections/migrations config
  - File: `src/config/db.ts`
  - Action: Update database configuration keys
- [ ] T002 [US{{StoryID}}] Install npm dependency package `{{PackageName}}`
  - File: `package.json`
  - Action: Execute installation command

---

## Phase 2: Foundational (Blocking Prerequisites)
*Establishes shared data structures, migrations, or core CLI functions that must be available before implementation.*
- [ ] T010 [US{{StoryID}}] Create database migrations for schemas
  - File: `src/db/migrations/{{MigrationName}}.ts`
  - Action: Generate database table structure
- [ ] T011 [US{{StoryID}}] Define common types and module exports
  - File: `src/types/shared.ts`
  - Action: Declare Interfaces and DTOs

---

## Phase 3: Story Implementation
*Story-specific code changes. Tasks marked with `[P]` can be run in parallel by separate subagents in AG_MAO.*

### Story {{StoryID}}: {{StoryTitle}}
- [ ] T100 [US{{StoryID}}] [TDD Step-0] Write failing tests to verify Acceptance Criteria
  - File: `tests/{{StoryName}}.test.ts`
  - Action: Define initial unit test suite
- [ ] T101 [P] [US{{StoryID}}] Implement backend service actions and logic
  - File: `src/services/{{ServiceName}}.ts`
  - Action: Build backend controller and repository handlers
- [ ] T102 [P] [US{{StoryID}}] Implement frontend UI component layout
  - File: `src/components/{{ComponentName}}.tsx`
  - Action: Build visual markup and interface states

---

## Phase N: Polish & Cross-Cutting Concerns
*Final validation, code linting, compilation checks, and reporting metrics.*
- [ ] T900 [US{{StoryID}}] Validate and run compilation check
  - Command: `npm run build` / `tsc --noEmit`
- [ ] T901 [US{{StoryID}}] Generate Operation metrics report
  - Command: `node scripts/operation-report-gen.js`
- [ ] T902 [US{{StoryID}}] Update final walkthough document
  - File: `Walkthrough.md`
