# 🧬 Repository DNA: gitagent (gitclaw)

## 1. Repository Overview
**gitagent** (also referred to as **gitclaw** in the codebase) is a universal git-native, multimodal, always-learning AI Agent. It operates by living inside a git repository, where its identity, rules, and memory are treated as files tracked by git. 
- **Type:** `hybrid-agent` (CLI tool + Agent SDK)
- **Primary Language:** TypeScript (Node.js)

## 2. Business Domain & Terminology
- **Git-Native Memory:** The concept of using Git version control (branches, commits, and file changes) as the permanent storage mechanism for an agent's memory.
- **Sub-Agents:** Modular personas/agents dynamically loaded from directories (e.g., `agents/assistant/`).
- **Skills:** Executable capabilities assigned to the agent, organized in independent directories containing a `SKILL.md` file and execution scripts.

## 3. System Architecture
Gitclaw acts as an orchestrator that binds an LLM (like OpenAI/Anthropic/Gemini) with local Git operations.
- **CLI/SDK:** Entry points via `src/index.ts` (CLI) and `src/exports.ts` (SDK).
- **Core Engine:** Managed in `src/agents.ts` (Sub-agent discovery) and `src/session.ts` (Session & Git lifecycle).
- **Voice/UI:** A Voice UI layer located in `src/voice/` implementing WebSockets (`ws`) for real-time interaction.
- **Observability:** Deep integration with OpenTelemetry for tracing and metrics (`src/telemetry.ts`).

## 4. Data Architecture
- **Session Branches:** Every interaction session dynamically creates or resumes a branch (e.g., `gitclaw/session-{sessionId}`).
- **Local Commits:** State updates, file modifications, and memory entries (written to `memory/MEMORY.md`) are automatically committed to the local repository.
- **Synchronization:** The agent pushes its session branch to the remote origin to persist its memory state across environments.

## 5. API & Integration
- **LLM Integrations:** Anthropic SDK, OpenAI Realtime API, Gemini Live API.
- **Composio:** External tool integrations managed via `src/composio/`.
- **WhatsApp Web:** Integration via the `baileys` library, allowing the agent to interface with messaging.
- **Google Workspace CLI:** For interactions with Google services.

## 6. Security & Identity
- N/A — Standard application security does not apply here. Security relies on the provided Git PAT (Personal Access Token) for push/pull permissions and the local shell environment boundaries.

## 7. Infrastructure & Deployment
- Shipped as an NPM package (`package.json` "bin": `gitclaw`).
- Uses standard TypeScript build process (`tsc`) with a post-build step to copy static HTML (`src/voice/ui.html`).

## 8. UI/UX Standards
- Features a simple HTML/JS frontend (`src/voice/ui.html`) for voice and chat interactions, establishing a direct connection to the local Node server via WebSockets.

## 9. Testing & QA
- Leverages the native Node.js test runner (`node --test`) combined with `--experimental-strip-types` to execute tests located in the `test/` directory.

## 10. Reusable Patterns & Modules

### ⚙️ Tech Patterns
1. **Git-Backed Memory Lifecycle:**
   - **Where:** `src/session.ts`
   - **What:** Automatic branching (`gitclaw/session-{id}`), automated staging, and auto-commits for agent actions.
   - **Why:** Eliminates the need for a database. Git natively provides versioning, rollback, and distributed storage for AI memory.
2. **File-Based Agent Registry:**
   - **Where:** `src/agents.ts`
   - **What:** Dynamically scans the `agents/` directory, parsing `.md` or `agent.yaml` files to load sub-agents into the orchestrator.
3. **OpenTelemetry Agent Wrapping:**
   - **Where:** `src/telemetry.ts`
   - **What:** Wraps agent tasks and tool calls in span tracking to build observable trees of the AI's reasoning and execution logic.

### 🧠 Behavioral Patterns (The "Soul")
1. **The Core Persona (Gitclaw):**
   - **Role:** Direct, concise, action-oriented Git-native agent.
   - **Prompt Snippet:** "You live inside a git repository... your history IS your memory. Say what needs to be said, nothing more. Honest." (Extracted from `SOUL.md`).
2. **Strict Operational Guardrails:**
   - **Role:** Agent behavior boundaries.
   - **Constraints:** "Always read a file before modifying it. Never commit secrets. Write commit messages that explain why, not just what." (Extracted from `agents/assistant/RULES.md`).
3. **Modular Skill Architecture:**
   - **Workflow:** Skills are not hardcoded. They are declared in `SKILL.md` files containing YAML frontmatter and markdown documentation, accompanied by a `scripts/` folder for execution. This standardizes tool expansion without altering core code.

## 11. Edge Cases & Gotchas
- **NPM Vulnerabilities:** The usage of `baileys` introduces a critical dependency on an older version of `protobufjs`, exposing the project to RCE risks if untrusted protobufs are parsed.
- **Git State Conflicts:** Concurrent processes mutating the repo must be carefully managed to avoid lock file contention or merge conflicts on the session branch.
