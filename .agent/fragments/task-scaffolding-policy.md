---
name: 'Task Scaffolding Policy'
description: 'Standardized task naming conventions, phased task structures, and platform-specific subagent parallelization guidelines.'
---

# Task Scaffolding Policy & Parallelization Governance

This document governs how task lists (`task.md`) are created during `/sprint-planning` or `/create-story` (which MUST be written strictly to the story-specific subdirectory `_iwish-output/stories/Epic-{epic_id}/{story_id}/task.md` or the session-specific artifact directory, NEVER at the workspace root directory), and how they are executed by development agents.

---

## Part A: Standardized Task Formatting & Naming Conventions

All task items in `task.md` must follow the format below:

```markdown
- [ ] T### [P?] [US#] Description
```
- **`T###`**: 3-digit task ID (e.g. `T001`, `T102`).
- **`[P]`**: Optional marker indicating that this task is parallelizable.
- **`[US#]`**: Mapped User Story ID (e.g., `[US6.2]`).

### Conflict Guard Rule
A task **MUST NOT** be marked with `[P]` if:
1. It modifies a shared registry file, central constants, or main module exports (e.g., `index.ts`, `constants.ts`, `package.json`).
2. It has sequential dependencies on prior unfinished tasks in the same phase.

---

## Part B: Phased Task List Structure

Task lists must be organized into distinct, chronological execution phases:

### Phase 1: Setup (Shared Infrastructure)
*Tasks that establish the dev environment, install dependencies, or prepare migrations.*
- **T001**: Pre-migration check / DB connection setup.
- **T002**: Install shared npm/pnpm modules.

### Phase 2: Foundational (Blocking Prerequisites)
*Prerequisite modules, shared schemas, or CLI engine modifications upon which other tasks depend.*
- **T010**: Schema creation or database migration files.
- **T011**: Core controller or routing framework setup.

### Phase 3+: User Story Implementation (Story-Specific)
*Groups of tasks for each story, containing MVP tasks first. Every story phase must start with a TDD Step-0.*
- **T100**: [TDD] Write failing test cases for User Story 1.
- **T101**: Implement backend controllers.
- **T102**: Build frontend component wrappers.

### Phase N: Polish & Cross-Cutting Concerns
*Cross-cutting validation, compiler checks, operation reports, walkthrough updates.*
- **T900**: Run compiler verification (`npm run build` or equivalent).
- **T901**: Execute `node scripts/operation-report-gen.js`.
- **T902**: Update walkthough and documentation.

---

## Part C: Platform Compatibility & Parallel Spawning Guidelines

When executing tasks, the development agent must detect its platform environment and adjust its execution strategy:

### 1. Platform Mode Detection
The agent determines its execution mode based on tool availability or environment variables:
- **`AG_MAO` (Google Antigravity 2.0)**: Detected when the `invoke_subagent` tool is available in the current context, or `process.env.ANTIGRAVITY_SDK_VERSION` is present.
- **`LEGACY_INJECTION` (Claude Code, Cursor, Windsurf, Codex, etc.)**: Detected when the `invoke_subagent` tool is NOT available.

### 2. Execution Protocols

#### 🚀 Protocol for `AG_MAO` (Antigravity 2.0 Parallel Execution)
If in `AG_MAO` mode:
1. **Identify Parallel Batches**: Find all tasks marked with `[P]` in the current phase that do not have blocking dependencies on each other.
2. **Spawn Subagents**: Call the `invoke_subagent` tool.
   - Set the `Workspace` option to **`share`** (this allows the subagent to work on a git worktree/clone sharing the same repo directory).
   - Construct a highly targeted subagent prompt (see prompting template below).
4. **Coordinate and Resume**: Wake up when subagent notifications arrive. Verify that the task checklist in the story-specific or session artifact `task.md` was updated, and pop/integrate any stashed files if needed.

#### Prompting Template for Subagent Spawning:
```markdown
You are a development subagent running in a SHARED WORKSPACE.
Your task is to execute the following task item: {{TASK_DESCRIPTION}}.

### Strict Boundaries & Conflict Prevention:
- You are ONLY allowed to read/write/modify the following files: {{ALLOWED_FILES}}.
- You are strictly FORBIDDEN from modifying or writing to: {{FORBIDDEN_FILES}}.
- If you need to make changes to a forbidden file, write a proposal in your response rather than modifying it.

### Deliverables:
- Implement the requested code and verify via test execution.
- Update the specific task in the story-specific or session artifact task.md to [x].
- Send a message back to the parent agent using `send_message` with your results.
```

#### 🛡️ Protocol for `LEGACY_INJECTION` (Single-Agent Fallback)
If in `LEGACY_INJECTION` mode:
1. **Force Sequential execution**: Ignore `[P]` parallel tags and execute all tasks one by one.
2. **Prevent Write Collisions**: Never run multiple background shell tasks that write to the same files.
3. **Notify Developer**: Print a status update in the chat informing the user:
   *"Environment: Legacy single-agent shell detected. Tasks will be executed sequentially to prevent file locks. For manual parallelization, please spawn a separate editor process."*
