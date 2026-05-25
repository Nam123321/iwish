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

---

## 🤖 Binding Instructions for AI Agents

All AI assistants and agents operating on this project must strictly comply with the following behavior:

1. **No SDLC Leakage**: Never write implementation plans, tasks, checklists (like `task.md`), or story files to the root directory or inside `src/` or `.agent/workflows/`. These belong in `_iwish-output/` or the designated workspace artifact directory.
2. **Commit Integrity**: Ensure that internal development logs, databases, or test output files are not tracked by git. Always check `.gitignore` before creating new directories.
3. **NPM Package Safety**: The `package.json` uses an explicit `"files"` allowlist. When adding new core modules or assets that must be shipped to users, verify they are added to the `files` array. If they are internal-only dev tools, leave them out.
4. **Consistency Across Sessions**: When starting a new development thread or story, read this file (`project-context.md`) first to align on the development boundaries.
