# Project Context & Rules for AI Agents

This file contains critical, binding rules and directory structure guidelines that all AI agents (including Claude Code, Cursor, Windsurf, Antigravity, and I-Wish dev-agents) must follow when editing, developing, or testing in this workspace.

---

## 🚀 Core Architectural Rule: Strict Directory Isolation

To ensure that the **I-Wish framework** remains completely independent, clean, and ready for public GitHub/NPM release, there is a strict separation between **Core Framework Assets** and **Internal Development (SDLC) Artifacts**.

### 1. Core Framework Assets (Public / Packaged)
These directories contain the actual product that end-users install and run. They must remain clean and free of local development logs, tasks, epics, or stories:
- [src/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/src): TypeScript source code for the CLI and core framework logic.
- [dist/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/dist): Compiled CLI distribution files (published to npm).
- [.agent/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/.agent): Canonical workflows, agents, and skills provided as the user-facing runtime.
- [templates/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/templates): Scaffolding templates for `iwish install`.
- [docs/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/docs): Official, public user documentation.

### 2. Internal SDLC & Development Artifacts (Private / Gitignored)
These directories are used strictly for the internal tracking, design, and validation of upgrades to the I-Wish framework. They are gitignored and excluded from NPM packages:
- [_iwish-output/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/_iwish-output): **Mandatory directory** for all internal PRD files, Epics lists, Stories, `sprint-status.yaml`, local test databases, and intermediate agent run outputs.
- [_iwish-output/](file:///Users/hatrang20061988/Desktop/AI%20Project/iwish/_iwish-output): Directory for migration outputs and local development outputs.
- **Scratch Space**: All temporary debug scripts or one-off code snippets must be saved under `_iwish-output/scratch/` or similar. Do not leave temporary files in the root folder.

### 📁 Standard Phase & Folder Mapping (VERY IMPORTANT)

To prevent agents from hallucinating directories or paths, you MUST strictly adhere to the following mapping between workflow Phases and output folders on disk. Never use natural language phase names to construct directory names (e.g. do not create "2. Domain & Technical Research" or "3. Product Requirements" folders).

| Giai đoạn quy trình (Phase) | Thư mục lưu trữ chuẩn trên đĩa | Lệnh slash command tương ứng | Outputs chính |
| :--- | :--- | :--- | :--- |
| **Phase 1: Idea Discovery** | `_iwish-output/1. Idea Discovery/` | `/idea-discover`, `/brainstorm`, `/idea-challenge` | `1.1. idea-discovery.md`, `1.2. idea-bank.md`, `1.3. idea-challenge.md` |
| **Phase 2: Research** | `_iwish-output/1. Idea Discovery/1.4. research/` | `/research` (market, competitor, domain, tech) | các file nghiên cứu `competitor-research.md`..., `project-context.md` |
| **Phase 3: Product Planning** | `_iwish-output/2. Product Planning/` | `/plan`, `/make-ui-spec` (UX Design) | `2.1. product-brief-or-prd.md`, `2.2. database-spec.md`, `2.3. ui-ux-spec.md`, `2.4. epics-and-stories.md`, master `DESIGN.md` |
| **Phase 4: Development** | `_iwish-output/3. Development/` | `/make-story`, `/make-ui-spec` (Story), `/make-data-spec`, `/code` | Cấu trúc cây `1. Epic & Story/...`, `2. Bug Report/...`, `sprint-status.yaml`, `PER-[name].md` |
| **Phase 5: Verification & Release** | `_iwish-output/4. Verification & Release/` | `/review`, `/canary`, `/retro` | `4.1. walkthrough.md`, `4.2. merge-report.json`, `4.3. retrospective.md` |

Every artifact must be written exactly into these folders. Dynamic or dated filenames for research reports are forbidden; write them directly to static names (e.g., `market-research.md`, `competitor-research.md`).

---

## 🤖 Binding Instructions for AI Agents

All AI assistants and agents operating on this project must strictly comply with the following behavior:

1. **No SDLC Leakage**: Never write implementation plans, tasks, checklists (like `task.md`), or story files to the root directory or inside `src/` or `.agent/workflows/`. These belong in `_iwish-output/` or the designated workspace artifact directory.
2. **Commit Integrity**: Ensure that internal development logs, databases, or test output files are not tracked by git. Always check `.gitignore` before creating new directories.
3. **NPM Package Safety**: The `package.json` uses an explicit `"files"` allowlist. When adding new core modules or assets that must be shipped to users, verify they are added to the `files` array. If they are internal-only dev tools, leave them out.
4. **Consistency Across Sessions**: When starting a new development thread or story, read this file (`project-context.md`) first to align on the development boundaries.
5. **Process-Based Epic & Story Development (Standard Flow)**: When the user uses terms like *"phát triển epic và story theo quy trình"*, *"go ahead với story"*, *"dev story"*, *"deploy story/ epic"*, *"chạy story"*, *"triển khai epic/story"*, etc., the agent must understand that the user is requesting the full automated development pipeline:
   - **Step 1**: Run `/make-story` to analyze and prepare the user story.
   - **Step 2**: Concurrently run `/make-ui-spec` (if frontend/UI layout required) and `/make-data-spec` (if database/API required).
   - **Step 3**: Score the UI/UX complexity to check if screen designs are needed, and identify the user-selected/configured design tool (Stitch, Figma, Claude Design, Canva, or other design tools configured by the user).
   - **Step 4**: Generate the design on the selected tool (do not default to Stitch) for user review and approval if design scoring requirements are met.
   - **Step 5**: Proceed to write code using `/code` after specifications and design approvals.
   - **Step 6**: Run `/review` to audit code quality and complete verification.
   - **Automatic Pause & Resume Principle**: At any step (story specs, ui/data specs, design, or review results) requiring user feedback, input, or approval, the agent **MUST automatically pause (Pause)**, save the workflow state, notify the user, and wait. As soon as the user responds or approves, the agent **MUST automatically resume the flow** from where it paused without requiring the user to issue redundant commands.
6. **Mandatory Spec Synchronization during Planning & Course Correction**: Whenever the user adds new requirements to an in-flight or completed story, or when a course correction/pivot is requested:
   - When entering `planning_mode` or creating/updating `implementation_plan.md`, the agent **MUST** proactively review all related system specification documents (PRD, UI Spec, Data Spec, and FeatureGraph) to determine if they need to be updated to ensure synchronization.
   - You **MUST** add a dedicated "Spec Reconciliation & Synchronization" section or task block inside the proposed changes of the `implementation_plan.md` identifying exactly which spec files (e.g. `PRD.md`, `ui-ux-spec.md`, `database-spec.md`) will be updated.
   - When execution starts, the agent **MUST** update those specifications first before writing/changing code, and then run `iwish reconcile-change` to log the sync.
   - Never skip this check even if the change seems minor or localized.
7. **Git Worktree Isolation & Database Isolation (Parallel Subagents)**: When running multiple subagents concurrently:
    - You **MUST** run the worktree provisioner (`node scripts/worktree-provisioner.js provision <storyId>`) to create an isolated worktree directory under `_iwish-output/worktrees/<storyId>`.
    - You **MUST** execute all development, code changes, compilation, and testing *inside* this isolated worktree path.
    - You **MUST** use the local, isolated SQLite test database configuration (defined in the worktree's `.env`) to avoid sharing/overlapping database writes or schema states with other concurrently running agents.
    - Never modify the database schema (`prisma/schema.prisma`) in parallel without running the `step-02.5-data-design` RACI gate first, and aligning database responsibilities according to `_iwish-output/iwish-skills/draft-rules/data-raci.md`.
8. **Task List Read-Only / Lock Gate**: AI developer agents **MUST NOT** directly mark tasks as completed (`[x]`) in `task.md` or any story files. The status update must be performed exclusively by the automated verification runner or the independent `/review` agent after all validation layers (Mechanical, Adversarial, and Cross-Story) have passed successfully.
