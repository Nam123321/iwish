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
- **Spec naming restriction**: Story-level UI and Data spec files must strictly use `ui-spec` and `data-spec` in their names. Arbitrary naming conventions (such as `ui-ux-spec.md`, `database-spec.md`, `tech-spec.md`) are strictly forbidden.
- **Review Report file**: Must strictly be named `_iwish-output/reviews/review-story-{story_id}.md` (with dots, no dashes or underscores).
- **Epic Risk Matrix file**: Must strictly be named `_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (capital `E`).


## 🔄 Completion Status Rule

- The completion status for any story, epic, task, or dependency in files (including `sprint-status.yaml`, `story.md` frontmatter, epic files, and verification scripts) MUST strictly be `completed` (all lowercase).
- Using the term `done` as a status value or key is strictly prohibited.
