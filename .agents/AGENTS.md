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
   - Cập nhật ma trận rủi ro epic tại `_iwish-output/edge-case-knowledge/epics/epic-N-risk-matrix.md`.
   - Cập nhật các ACs của story với tiền tố `[EDGE-CASE]` dựa trên kết quả review.
8. **Automated Validation**: Trước khi kết thúc turn hoặc nạp vào KG, bạn MUST chạy validator:
   `python3 .agent/scripts/validate-story.py "<file_path>"`
   Validator sẽ kiểm tra sự tồn tại vật lý của file review và risk matrix. Nếu phát hiện thiếu file vật lý (chỉ giả lập trên text), validator sẽ báo lỗi và bạn **MUST NOT** tiếp tục.
9. **Knowledge Graph Injection**: After successful validation, run:
   `iwish inject-node --file "<file_path>" --metadata '{"summary": "...", "tags": [...], "layer": "...", "complexity": "..."}'`

