# Project-Scoped Rules for I-Wish SDLC Workflows

All developer and orchestrator agents executing tasks in this workspace MUST strictly adhere to the following rules to prevent regression of workflow standards.

---

## 🛡️ Story Creation Rule (`/make-story`)

Whenever creating, rewriting, or updating a Story file (`story.md`), you MUST execute the steps defined in [iwish-feature-create-story.md](file:///.agent/workflows/iwish-feature-create-story.md) sequentially:

1. **FR Mapping**: Link the story explicitly to its corresponding Functional Requirements (`FR Covered: [FR-ID: Name]`) using clickable absolute file links pointing to the PRD.
2. **OKF Header**: Enforce valid OKF YAML frontmatter including `type: I-Wish Story`, `resource` URI, `tags`, `links_to` array, and `dependencies` list (story IDs this story depends on, e.g. `story-16.1`, or `[]` if none).
3. **Plan Tune Heuristic**:
   - Calculate the Complexity Score (CS) using the 6-dimension scoring table.
   - If CS >= 7, you **MUST HALT** and present a split proposal. Do not generate the story code/file until the user approves the split.
4. **AC-to-Task Traceability Matrix**: Generate a markdown matrix mapping every Acceptance Criteria (AC) to at least one implementation Task. No orphan or missing links are allowed.
5. **Cross-Feature Dependencies**: Generate the `## Cross-Feature Dependencies` section. This MUST explicitly map both feature-level and story-level dependencies (list other story IDs this story depends on under a dedicated dependencies section).
6. **QA Simulator Guardian Audit**: Mentally execute the simulator and embed the 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy) at the bottom. The `TOTAL AVERAGE` must be >= 8.5/10.
7. **Edge Case Guardian Scan**: 
   - Sau khi dựng xong nháp câu chuyện (Happy-path ACs), bạn **BẮT BUỘC** phải gọi Review Agent (`invoke_subagent` cho role `Review Agent`) và nạp skill Edge Case Guardian để quét lỗi biên, chấm điểm FMEA.
   - Ghi nhận báo cáo đánh giá vào file `_iwish-output/reviews/review-story-N.M.md`.
   - Cập nhật ma trận rủi ro epic tại `_iwish-output/edge-case-knowledge/epics/Epic-N-risk-matrix.md`.
   - Cập nhật các ACs của story với tiền tố `[EDGE-CASE]` dựa trên kết quả review.
8. **Automated Validation**: Trước khi kết thúc turn hoặc nạp vào KG, bạn MUST chạy validator:
   `python3 .agent/scripts/validate-story.py "<file_path>"`
   Validator sẽ kiểm tra sự tồn tại vật lý của file review và risk matrix. Nếu phát hiện thiếu file vật lý (chỉ giả lập trên text), validator sẽ báo lỗi và bạn **MUST NOT** tiếp tục.
9. **Knowledge Graph Injection**: After successful validation, run:
   `iwish inject-node --file "<file_path>" --metadata '{"summary": "...", "tags": [...], "layer": "...", "complexity": "..."}'`

## 🎨 Mockup Consultation Rule

Whenever any agent (including orchestrator, ux-agent, or dev-agent) uses a Design Platform MCP (like Stitch, Figma, Claude Design, etc.) to generate or render a UI mockup, the following steps are **MANDATORY**:

1. **Prompt for Consultation**: The agent MUST explicitly prompt the MCP to output UX recommendations (Design Consultation Report) alongside the visual design.
2. **Checklist for Empty Recommendations**: The agent MUST explicitly check if the Native AI returned any recommendations. If NO recommendations were returned, the agent MUST explicitly state in the report: "Request for consultation was sent to Native AI, but no recommendations were returned. Fallback to internal UX evaluation."
3. **Socratic Debate**: The agent MUST orchestrate a Socratic Debate between internal agents (e.g., `ux-agent` for design consistency and `dev-agent` for technical/data feasibility) to evaluate the platform's recommendations (or evaluate the design directly if no recommendations were returned).
4. **Mandatory Output**: The final UI Specification MUST include a `Platform AI Consultation & Debate Report` section detailing the accepted and rejected recommendations (or the fallback evaluation).
5. **Validation**: If the debate report section is missing, the Mockup generation is considered invalid and must be rejected.
6. **Automated Mockup ID Registration**: The agent MUST run the registration script immediately after generating the mockup to record its ID into `ui-spec.md`:
   `python3 .agent/scripts/register-design-asset.py --file "<story_dir>/ui-spec.md" --screen "<Screen_Title>" --tool "Stitch" --id "<screen_id_or_url>"`


## 🧩 UX Pattern & Component Registry Enforcement Rule

Whenever any agent designs, specifies, or implements a user interface (such as in `/make-ui-spec`, Stage 2A `/flow-stage-2a-design-gen`, or UI mockups via Stitch MCP):

1. **Mandatory Registry Inspection**: The agent MUST inspect Section 5 of `DESIGN.md` (`## 5. UI Component Layouts`) and check existing implementations in `src/components/ui/`.
2. **Leverage Over Re-invention**: Agents are STRICTLY FORBIDDEN from inventing custom cards, tables, buttons, drawers, or notifications when registered patterns already exist (such as `Metric Line [5.10]`, `DataTableView [5.21]`, `AdvancedFilterBar [5.22]`, `RightDrawer [5.25]`, `Toast [5.12]`, etc.).
3. **Mandatory Alignment Matrix**: The final `ui-spec.md` MUST include a `## Registered UX Patterns & Components Alignment` matrix mapping each Story widget to a registered pattern.
4. **Mockup Prompt Injection**: Prompts sent to Stitch MCP MUST explicitly mandate the inclusion of the matched registered UX patterns by name and section ID.
5. **Zero Hard Links**: Project IDs and Asset IDs MUST be dynamically extracted from `DESIGN.md` frontmatter or `stitch-project.json`; hardcoding literal IDs in workflows or scripts is strictly prohibited.


## 🔄 Proactive Sync Verification Rule

Whenever there is any instruction, command, or file change that impacts the Epic or Story structure (such as file renames, content updates, merging stories, moving stories between epics, or deleting requirements):

1. **Context Drift Prevention**: The agent MUST proactively remind the user of the risk of context drift in planning and architecture documents.
2. **Proactive Sync Invitation**: The agent MUST explicitly prompt the user: *"Tôi phát hiện có sự thay đổi/yêu cầu thay đổi cấu trúc Epic/Story. Bạn có muốn chạy `/reconcile-change` để tự động hóa việc phân tích tác động và đồng bộ lại toàn bộ PRD, Architecture và sprint-status để phòng tránh lệch bối cảnh không?"*.
3. **Execution Routing**: If the user confirms, route immediately to execute the `/reconcile-change` workflow before proceeding with any other coding or design task.


## 📁 Standard Naming & Layout Mode Rules

All agents MUST enforce the correct file paths and names based on the active Layout Mode:

- **Flat Layout mode** (Default for `iwish`):
  - Story file: `_iwish-output/stories/story-{story_id}.md` (e.g. `story-17.1.md`)
  - UI spec file: `_iwish-output/stories/ui-spec-story-{story_id}.md`
  - Data spec file: `_iwish-output/stories/data-spec-story-{story_id}.md`
  - Task list: `_iwish-output/stories/task-story-{story_id}.md`
- **Hierarchical Layout mode** (Default for `Cowok-ai`):
  - Story file: `_iwish-output/3. Development/1. Epic & Story/{Value_Stream}/Epic-{epic_id}/Story-{story_id}/story.md` (strictly `story.md`)
  - UI spec file: `_iwish-output/3. Development/1. Epic & Story/{Value_Stream}/Epic-{epic_id}/Story-{story_id}/ui-spec.md`
  - Data spec file: `_iwish-output/3. Development/1. Epic & Story/{Value_Stream}/Epic-{epic_id}/Story-{story_id}/data-spec.md`
  - Task list: `_iwish-output/3. Development/1. Epic & Story/{Value_Stream}/Epic-{epic_id}/Story-{story_id}/task.md`
- **Spec naming restriction**: Story-level UI and Data spec files must strictly use `ui-spec` and `data-spec` in their names. Arbitrary naming conventions (such as `ui-ux-spec.md`, `database-spec.md`, `tech-spec.md`) are strictly forbidden.
- **Review Report file**: Must strictly be named `_iwish-output/reviews/review-story-{story_id}.md` (with dots, no dashes or underscores).
- **Epic Risk Matrix file**: Must strictly be named `_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (capital `E`).


## 🔄 Completion Status Rule

- The completion status for any story, epic, task, or dependency in files (including `sprint-status.yaml`, `story.md` frontmatter, epic files, and verification scripts) MUST strictly be `completed` (all lowercase).
- Using the term `done` as a status value or key is strictly prohibited.

## 📁 Code Directory Constraint Rule
1. Agents MUST only create source code files within recognized code directories.
2. Recognized dirs are ALL top-level dirs EXCEPT the blacklist defined in `auto-traceability-linker.py` EXCLUDED_DIRS.
3. Agents MUST NOT create top-level directories for stories, epics, or fixes (e.g., `Epic-66/`, `Story-44.4/` at project root is FORBIDDEN).
4. New top-level code directories require explicit user approval.
5. Temporary/scratch files MUST go to `_iwish-output/adhoc-workspace/scratch/`.

## 🔒 Git Ref Modification Safety Rule

Agents MUST NEVER run `git update-ref`, `git branch -f`, or any ref-modifying command on branches that are checked out in ANY worktree (including the main workspace).

1. **Real-time check:** Use `git worktree list --porcelain | grep "^branch refs/heads/<branch>$"` to verify IMMEDIATELY before each modification — NOT once at script start (race condition).
2. **Skip active branches:** If a branch is active in any worktree, SKIP it and log a warning. Never force-modify.
3. **No `git reset` on shared workspace:** Never run `git reset` on a workspace where other agents may be active.
4. **Concurrent agent awareness:** When writing scripts that modify Git state, always assume multiple agents may be operating on the same repository simultaneously.

## 🌳 Worktree Lifecycle Rule (Zero-Trust Category A)

1. **No Raw Worktree Creation:** Agents MUST NOT call `git worktree add` directly. Always use the `worktree-lifecycle-manager` skill or `.agent/bin/git-worktree-guard.sh add`.
2. **Directory Isolation:** All worktrees MUST strictly be created inside the `.worktrees/` directory (e.g. `.worktrees/story-45.1`). Creating root-level worktrees (such as `Cowok-ai-*`) is strictly FORBIDDEN.
3. **Concurrency Quota:** Maximum active concurrent user worktrees is 5.
4. **Session Heartbeat:** Active coding sessions MUST call `.agent/scripts/worktree-heartbeat.sh` every 5-10 minutes to protect worktrees against the automated Cron Reaper.
5. **Completion Cleanup:** Upon completing a story via `/approve-qa`, Step 4.5 MUST unregister and remove the associated worktree and branch.
6. **Integrity Verification:** Worktree registry SQLite database (`.worktrees/registry.db`) is the canonical registry. Run `python3 .agent/scripts/worktree-integrity-validator.py` to audit and auto-heal.
7. **Commit Hook Bypass:** The `pre-commit` hook is downgraded to an advisory layer for worktrees to prevent hanging agent operations. Agents should NOT arbitrarily use `--no-verify` unless a false-positive blocks a critical automated commit.


## 🚫 Anti-Hallucination & Path Sanitization Rule
- **DO NOT SLUGIFY DIRECTORY NAMES**: When generating files (like `ui-spec.md`, `task.md`) based on the `{Value_Stream}` variable, you MUST preserve exact spaces, dots, and special characters (e.g. `VS-03. Workflow & Automation`). 
- **FORBIDDEN**: Converting paths to slug format (e.g. `VS-03-Workflow-Automation`) is strictly forbidden and creates Ghost Folders that break the SSOT.
- **BASH EXECUTION**: When dealing with paths containing spaces in the terminal, always wrap the paths in double quotes (`"path/to/folder"`).

## 📁 Dynamic Path Resolution & Zero-Root Workspace Rule
1. **Zero-Root File Invariant:** Agents MUST NEVER create loose scripts (`patch*.sh`, `fix*.py`), logs (`*.log`), diff dumps (`*.diff`, `diff.txt`), or test output dumps directly in the project root directory.
2. **Scratchpad Routing:** All temporary scripts, intermediate debugging files, and local logs MUST strictly be written to `_iwish-output/adhoc-workspace/scratch/`.
3. **Dynamic Path Directives:** Workflows generating artifacts MUST NOT hardcode static top-level paths (such as `_iwish-output/review.md` or `_iwish-output/debate.md`). Agents MUST use dynamic context-aware path resolution:
   - **Story-Level Artifacts:** `_iwish-output/3. Development/1. Epic & Story/{Value_Stream}/Epic-{epic_id}/Story-{story_id}/{artifact_name}.md`
   - **Reviews & Risk Matrices:** `_iwish-output/reviews/review-story-{story_id}.md` and `_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md`
   - **Research & Discovery:** `_iwish-output/1. Idea Discovery/1.4. research/{topic}.md`
4. **Automated Hygiene Sweep:** Before completing any story or merging a PR, agents MUST execute `python3 .agent/scripts/workspace-janitor.py --auto-clean --enforce-structure`.


## 🕸️ Knowledge Repo & TOC Hallucination Rule (Zero-Trust Category A)
1. **No LLM TOC Generation:** Whenever absorbing or parsing a Knowledge Repository (e.g. via `/absorb-book`), agents are **STRICTLY PROHIBITED** from using NotebookLM or direct LLM calls to "generate" or "guess" the Table of Contents or directory structure. This prevents topological hallucination.
2. **Mandatory AST Execution:** Agents MUST execute the Category A physical parsing script (`python3 .agent/scripts/markdown-ast-graph-builder.py`) to extract the exact physical topological graph based on internal markdown links.
3. **Graph SSOT:** The generated `repo-topology.json` file is the Single Source of Truth (SSOT) for the repo's structure and MUST be injected into the Knowledge Graph (FalkorDB).

## 🔒 Dual-Condition Implementation Plan Gate Rule (Zero-Trust Category A)
1. **Mandatory /plan-proven-safe Execution (Condition 1):** When drafting any implementation plan (`impl-plan.md` or `implementation_plan.md`), the agent MUST execute `/plan-proven-safe` across all 4 pillars (`/deep-audit`, `/unknowns`, `/party-mode`, `/edge-case`) and update the plan until `validate-plan-proven-safe.py` passes with `VERDICT: PROVEN_SAFE`.
2. **Mandatory Human Review & Approval (Condition 2):** The agent MUST STOP and present the plan to the user for explicit review and approval in chat.
3. **Dual-Condition Signature Requirement:** Chữ ký điện tử `impl-plan-approval.json.sig` CHỈ ĐƯỢC PHÉP sinh qua `sign_human_gate` sau khi thỏa mãn ĐỒNG THỜI cả 2 điều kiện (Condition 1: Plan Proven Safe + Condition 2: Explicit Human Approval).
4. **Universal Enforcement & No Bypass:** Áp dụng cho TẤT CẢ quy trình (`/code`, `/dev-story`, `/flow`, `/flow-auto-approve`). Tuyệt đối cấm tự động sinh chữ ký giả lập hoặc bypass qua `sign_pipeline_gate` ngay cả khi chạy ở chế độ `--auto-approve`.

5. **Strict IPC Socket & Human Gate Integrity:**
   - Agents are **STRICTLY PROHIBITED** from opening raw UNIX domain sockets to `/tmp/watchmen.sock` via terminal scripts (Python, Node, Bash, nc, curl) to synthesize signatures.
   - Any cryptographic signature for Implementation Plans (`impl-plan-approval.json.sig`) MUST strictly be generated via the official MCP tool `call_mcp_tool("watchmen-mcp", "sign_human_gate", ...)`.
   - Any attempt to bypass the MCP tool layer or synthesize evidence files manually is classified as a **Category A Security Violation** resulting in immediate pipeline abort.
   - The `--auto-approve` flag strictly applies to automated artifact generation (Stages 1, 2, 3B, 4). At **Stage 3A (Plan Gate)**, the agent **MUST HARD STOP**, present the plan in chat, and wait for explicit human approval before invoking `sign_human_gate`.



## ⚖️ Antigravity 2.0 Dynamic Model Routing & Fallback (Zero-Trust)
Whenever the Orchestrator Agent operates on Antigravity 2.0 and needs to spawn subagents via the `invoke_subagent` tool for a specific role (e.g. `reviewer`, `worker`, `planner`):
1. **Dynamic Resolution & Concurrency Safety:** You MUST NOT hardcode `"Model": "pro"` or default to `"inherit"`. Before invoking, you MUST run the resolver to get the exact model from the Pi Code Agent profile. To prevent Race Conditions, you MUST use a unique temporary output file for each role:
   `python3 .agent/scripts/pi-code-agent/resolve_model_binding.py --platform antigravity --role <role> --output _iwish-output/adhoc-workspace/scratch/resolve-model-<role>-<timestamp_or_uuid>.json`
2. **Apply Payload:** Read the `"requested_model"` from the JSON output and inject it into the `invoke_subagent` payload (e.g., `"Model": "<requested_model>"`).
3. **Safe Fallback Mechanism:** If the `invoke_subagent` tool returns an error (429 Rate Limit, Crash) OR if the `resolve_model_binding.py` script fails:
   - You MUST NOT halt the entire workflow.
   - You MUST autonomously fallback and invoke the subagent using `"Model": "inherit"`.
   - You MUST output a `> [!WARNING] Cảnh báo Fallback` cho User biết rằng tác vụ đã bị hạ cấp xuống `inherit` để duy trì tiến độ.

---

## 🎨 3D Visualization Slash Command Rule (/3d-visualize)

Whenever an agent is instructed to create, prototype, or integrate 3D visual components, charts, or interactive models:
1. **Slash Command Trigger:** Agents SHOULD leverage the `/3d-visualize` workflow backed by the standalone `3dviz-pro-max` skill suite.
2. **Dependency Pre-flight (EC-P5-02):** Agents MUST inspect `package.json` for `three`, `@react-three/fiber`, `@react-three/drei`. If missing, auto-install them prior to component creation.
3. **SSR Safety:** All Three.js canvas components MUST be rendered with `"use client"` or Next.js dynamic import with `ssr: false`.
4. **WebGL Context Memory Cleanup:** Components MUST implement `.dispose()` on all geometries, materials, and renderers in cleanup hooks to prevent browser canvas crashes.

---

## 🛡️ Category A End-to-End QA Testing Rule (/manual-test & Stage 5a)

All agents executing `/manual-test` or `Stage 5a` (`flow-stage-5-manual-test.md`) MUST strictly adhere to the 11-step Zero-Trust Category A pipeline:
1. **Zero Collision Port Allocation:** MUST allocate an isolated worktree port via `worktree-port-manager.py assign` before starting dev servers. Never guess static ports.
2. **QA Spec Sealing (Gate ZT-01A):** If `manual-test-guide.md` is missing, auto-generate via `generate-qa-scenario.py` with 1:1 FMEA Traceability, seal with `watchmen-mcp:sign_pipeline_gate`, and lock permissions via `chmod 444`.
3. **Strict Origin Grounding:** Playwright tests MUST target `http://127.0.0.1:<ALLOCATED_PORT>`. Using `file://` URLs or static HTML mock files is STRICTLY PROHIBITED.
4. **Live Target Grounding Audit:** MUST execute `verify-live-evidence.py` to assert hydration markers, non-empty DOM, and screenshot hash deltas ($\Delta > 0$).
5. **Sanitized Evidence Packaging (Gate ZT-01B):** Package evidence via `package-qa-acceptance.py --sanitize-headers` and obtain an HMAC signature from Watchmen MCP prior to completion gating.
6. **Teardown:** Release ports via `worktree-port-manager.py release` in the finally block.

---

## 🗄️ FalkorDB & Redis Infrastructure Port Rule (Cowok-ai)

Agents and workflows operating in the **Cowok-ai** project MUST strictly adhere to the project's port mapping:
1. **Cowok-ai FalkorDB Container**: `distro-falkordb` on host port `127.0.0.1:6379` (mapped to internal container port `6379/tcp`).
2. **Prohibited Reference**: Port `6379` and container `distro-falkordb` belong to the **Distro** project. Agents MUST NEVER query `distro-falkordb` or connect to port `6379` for FalkorDB in Cowok-ai.
3. **Cowok-ai Redis Services**:
   - `cowok-redis-queue`: `127.0.0.1:6381` (internal 6379)
   - `cowok-redis-vector`: `127.0.0.1:6382` (internal 6379)
   - `cowok-redis-cache`: `127.0.0.1:6383` (internal 6379)
4. **Querying CodeGraph / UCG**:
   - Via Redis CLI: `docker exec distro-falkordb redis-cli GRAPH.QUERY UCG "..."`
   - Via TCP Socket: Connect to `127.0.0.1:6379`


