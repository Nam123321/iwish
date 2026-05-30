# Product Requirements Document (PRD): Awesome Skills & Claude Code Integration

## 1. Goal Description
The objective is to upgrade the I-Wish system by integrating a native, pure Node.js skill quality linter (`skill-linter`), global caching mechanics from `antigravity-awesome-skills`, and the workspace plugin synchronization patterns learned from Claude Code. This will enable I-Wish to safely reference a massive library of 1,470+ skills without polluting the local project workspace, enforce frontmatter standardizations, and automatically sync project-scoped skills across team members via Orchestrator automation.

---

## 2. Functional Requirements (FR)

### FR1: Skill Quality Linter Gate (Pure Node.js)
- Integrate an automated skill validation tool (`skill-linter`) implemented in pure JavaScript/TypeScript directly into I-Wish's `/create-skill` workflow to run in-process.
- Validate that all generated `SKILL.md` files possess standard frontmatter fields: `name`, `description`, `inputs`, `outputs`, `mcp_tools_required`, and `subagent_triggers`.
- Scan all skill directories and block execution if any symlinks resolve to files outside the repository root (mitigating path traversal).

### FR2: Global Caching & Dynamic Retrieval (RAG)
- Provision a global cache folder at `~/.iwish/skills-reference/` to clone and store the `antigravity-awesome-skills` repository.
- Provide a tool command or routing logic `/read-reference-skill <skill-id>` that dynamically loads and reads the requested skill from the global cache on-demand.
- Enable RAG-based semantic lookup: when an agent encounters a specific task, it should query the global cache index to fetch relevant playbooks without duplicating files in the local workspace.
- The `Orch-agent` must be context-aware, automatically identifying when to trigger reference lookups based on current task descriptions.

### FR3: Project-Scope Plugin Sync (Automatic)
- Implement a project-scope configuration file `.agent/settings.json` that tracks which external reference skills or bundles are active in the current workspace.
- When I-Wish is launched on a repository, the `Orch-agent` must automatically parse `.agent/settings.json` and sync/register declared dependencies dynamically without requiring manual user commands.

---

## 3. Non-Functional Requirements (NFR)

### NFR1: Zero Project Workspace Pollution
- The 1,470 reference skills must remain stored in the user's home directory cache (`~/.iwish/`) and must not be cloned or copied into the active project workspace.

### NFR2: Strict Sandbox Boundary
- Ignore all external installer scripts (such as `install.js` or `activate-skills.sh`) to prevent unauthorized writes outside of the designated sandbox directories.

