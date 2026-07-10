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
  - Story file: `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md` (strictly `story.md`)
  - UI spec file: `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/ui-spec.md`
  - Data spec file: `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/data-spec.md`
  - Task list: `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/task.md`
- **Evolution Lab Layout mode** (For Meta-SDLC Capability Authoring):
  - Story file: `.agent/evolution-lab/stories/story-{story_id}.md` (use Meta prefix e.g. `story-M1.1.md`)
  - UI spec file: `.agent/evolution-lab/stories/ui-spec-story-{story_id}.md`
  - Data spec file: `.agent/evolution-lab/stories/data-spec-story-{story_id}.md`
  - Task list: `.agent/evolution-lab/stories/task-story-{story_id}.md`
- **Spec naming restriction**: Story-level UI and Data spec files must strictly use `ui-spec` and `data-spec` in their names. Arbitrary naming conventions (such as `ui-ux-spec.md`, `database-spec.md`, `tech-spec.md`) are strictly forbidden.
- **Review Report file**: Must strictly be named `_iwish-output/reviews/review-story-{story_id}.md` (with dots, no dashes or underscores). If in Evolution Lab mode, use `.agent/evolution-lab/reviews/review-story-{story_id}.md`.
- **Epic Risk Matrix file**: Must strictly be named `_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (capital `E`). If in Evolution Lab mode, use `.agent/evolution-lab/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md`.


## 🔄 Completion Status Rule

- The completion status for any story, epic, task, or dependency in files (including `sprint-status.yaml`, `story.md` frontmatter, epic files, and verification scripts) MUST strictly be `completed` (all lowercase).
- Using the term `done` as a status value or key is strictly prohibited.

## 🔒 Sprint-Status Immutability Rule

- Agents MUST NEVER directly modify the `sprint-status.yaml` file using `write_file` or `replace_file_content` tools.
- The `sprint-status.yaml` is a compiled tracking index. Any updates to story/epic statuses, scope, or structure MUST be driven exclusively by updating the underlying Physical Source files (e.g., `story-N.M.md`) and then running the appropriate workflow to rebuild the index.
- If a user requests a change to the sprint status, the agent MUST route the user to `/sprint-planning` (for adding/removing scope) or `/reconcile-change` (for structural/status synchronization).


## 🌐 MacOS Browser Tooling Rule

Whenever any agent (including orchestrator, qa-agent, ux-agent, dev-agent, etc.) needs to automate a browser, verify a UI, or capture screenshots, the agent MUST obey the OS environment limitations:

1. **Never use `browser_subagent` for local UI on macOS**: `browser_subagent` (Agentic Browser) only supports local Chrome mode on Linux. Since this workspace runs on macOS, invoking it for local URLs will fail and cause interruptions.
2. **Use `chrome-devtools-mcp`**: Agents MUST explicitly use the `chrome-devtools-mcp` tools (e.g., `navigate_page`, `take_screenshot`, `evaluate_script`) to interact with the browser on macOS environments. 
3. **Static Fallback**: If complex interactions are not needed, use `read_url_content` or `search_web`.

## 📊 Epic Story Table Rule
Whenever any agent generates or updates an `epic.md` file, the `## Stories` section MUST strictly follow this table format to ensure SSOT synchronization:
- The table must contain exactly 4 columns: `| Story ID | Title | Dependencies | Status |`.
- The `Story ID` MUST be the logical ID (e.g., `Story-26.1`) in bold.
- The `Dependencies` must be extracted from the linked story's dependencies.
- The `Status` must accurately reflect the story's development status (e.g., `backlog`, `ready-for-dev`).
- Example format: `| **Story-26.1** | Feature Name | Epic-01, Story-25.2 | backlog |`

## 🔌 Dynamic Port Resolution Rule

Whenever any agent needs to execute a `navigate_page` command or launch a Browser/QA Script on `localhost`, the following is **MANDATORY**:

- **No Port Hallucination:** You MUST NOT assume or default to standard ports like `3000`, `5173`, or `8080`.
- **Dynamic Lookup:** You MUST explicitly use `grep_search` or `view_file` to read the project's configuration file (e.g., `vite.config.js`, `package.json`, or `.env`) to extract the exact development port allocated for the current workspace.
- **Enforcement:** If a port cannot be found dynamically, halt the operation and ask the user to provide the correct port.

## 🗄️ Database Schema & API Lifecycle Rule

Whenever any agent modifies the database schema (e.g., `schema.prisma`) or runs migrations:

1. **Active Lifecycle Management:** The agent MUST identify if the API server is currently running in the background.
2. **Graceful Shutdown:** The agent MUST gracefully terminate the existing API server process (e.g., using `manage_task` kill or port killing scripts like `npm run kill-port`) before generating the new client.
3. **Generation:** The agent MUST run `prisma generate` (or the equivalent database client generation command) to update the client files.
4. **Restart:** The agent MUST start a fresh instance of the API server before proceeding to any QA, integration testing, or UI verification steps.
5. **No Blind Watchers:** Agents SHOULD NOT rely on background file watchers (like Nodemon watching `node_modules`) to handle schema restarts during automated editing tasks to avoid race conditions and crash loops. Use explicit shutdown and restart commands instead.

## 🔍 Spec Compliance Enforcement Rule

Whenever any agent (dev-agent, review-agent, qa-agent) performs implementation, code review, or testing for a story:

1. **Mandatory Spec Loading:** The agent MUST load and actively reference the applicable specification files (UI Spec, Data Spec, Story ACs) throughout the entire workflow — not just a one-time read at setup. If a spec file exists for the story but is not loaded, the agent MUST halt and load it before proceeding.
2. **Spec Re-Read Checkpoint (Dev):** During `/dev-story`, after every 3 completed tasks or after any context truncation event, the dev-agent MUST re-read the applicable spec files and cross-check implementation against spec definitions. More than 2 detected drift items requires HALT and remediation.
3. **AC Traceability Matrix (Dev):** Before marking any story as `dev_completed`, the dev-agent MUST produce an AC Traceability Matrix mapping every Acceptance Criterion to specific code artifacts (file:line) and test artifacts. No orphan ACs allowed.
4. **Spec Structural Gate (Review):** During `/review`, the review-agent MUST execute Layer 1.5 (Spec Compliance Gate) as defined in the 3-Layer Code Review Protocol. This includes mandatory spec loading, UI/Data structural diff, AC traceability verification, and SCS scoring. Reviews with SCS < 85% MUST be rejected.
5. **Spec Compliance Score (SCS):** All reviews MUST include the SCS score in their output. SCS < 75% at any pipeline stage is a blocking finding.
6. **Skill Reference:** All spec compliance checks follow the procedures defined in `.agent/skills/spec-compliance-guardian/SKILL.md`.
