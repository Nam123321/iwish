---
name: notebook-request-engineer
description: Formulates and sends Push requests to NotebookLM - template selection, composition, MCP send
inputs: ['research_need', 'template_type', 'target_notebook']
outputs: ['created_or_enriched_notebook', 'research_results']
mcp_tools_required: ['notebooklm-mcp/notebook_create', 'notebooklm-mcp/source_add', 'notebooklm-mcp/source_list_drive', 'notebooklm-mcp/research_start', 'notebooklm-mcp/research_status', 'notebooklm-mcp/research_import', 'notebooklm-mcp/notebook_query']
banned_tools: ['search_web', 'read_url_content']
subagent_triggers: ['notebook-quality-gate']
---

# Notebook Request Engineer

## 🎯 Purpose
The Notebook Request Engineer is an OPERATIONS skill that translates agent intents into highly optimized, template-driven interactions with NotebookLM. It selects the appropriate prompt template, orchestrates the asynchronous research flow, handles source injections, and manages the execution of MCP commands after passing the quality gate.

## 📋 Prerequisites
- Must have passed validation by `notebook-quality-gate`.
- Valid NotebookLM authentication.
- Target notebook resolved via `notebook-registry-manager`.

## 📄 5 Template Categories
The engineer utilizes pre-defined prompt templates to maximize NotebookLM's retrieval and synthesis capabilities.

### 1. Domain Exploration
- **Trigger**: `/brainstorm`, `/domain-research`
- **Template**: "Synthesize the core concepts, historical context, key players, and emerging trends in [DOMAIN]. Exclude marketing jargon and focus on structural mechanics. Format as a hierarchical taxonomy."

### 2. Competitive Intelligence
- **Trigger**: `/competitor-research`
- **Template**: "Analyze [COMPETITORS] across the following dimensions: target demographic, pricing model, unique technical features, and identified weaknesses. Do not include superficial UI reviews. Output a comparative matrix."

### 3. Technical Evaluation
- **Trigger**: `/evaluate-epic`, `/create-architecture`, `/rd-evaluate`
- **Template**: "Dựa trên [SOURCES], hãy đánh giá Kiến trúc đề xuất. BẮT BUỘC: (1) Tính toán lại Ràng buộc (Constraints - QPS/Storage). (2) So sánh thành phần (Core Components) thông qua bảng Trade-off (Ví dụ: Tại sao chọn Postgres thay vì Cassandra cho Use Case này). (3) Chỉ ra điểm nghẽn cổ chai (Bottlenecks) khi Scale lên gấp 10 lần."

### 4. SDK/API Reference
- **Trigger**: `/dev-story` (when reading SDK docs)
- **Template**: "Extract the implementation patterns, required parameters, and error handling codes for [FUNCTION/API]. Exclude deprecated methods. Provide a clean, minimal code integration example."

### 5. Situational Research
- **Trigger**: `/review reject`, `/fix-bug`, runtime troubleshooting
- **Template**: "Nếu lỗi này xuất phát từ thiết kế hệ thống (Systemic Bottleneck như Cache Stampede, DB Connection Exhaustion), bạn KHÔNG CHỈ vá code mà phải xuất ra Bảng Trade-off các phương án khắc phục ở mức Kiến trúc (Ví dụ: Thêm Redis, Rate Limiter) dựa theo Primer."

### 6. Gap Analysis & Interrogation (to-questionnaire)
- **Trigger**: `/evaluate-epic`, `/plan` (when requirements are ambiguous or lack context)
- **Template**: "[EDGE-CASE FIX: EC-P8-001] NẾU tính năng yêu cầu xử lý System/Backend/Data: Bộ 5 câu hỏi phải ưu tiên làm rõ: Use Cases cốt lõi, Tỉ lệ Read/Write, Giới hạn Độ trễ (Latency), và Dự toán Storage trong 3-5 năm. NẾU tính năng thuần UI/Frontend: Bỏ qua System Design, đặt câu hỏi về State Management, Component Tree, và UX Patterns."

## ⚙️ Auto-Template Selection
The engineer automatically selects the template based on the triggering workflow slash command or the detected intent of the `research_need`.

## 🔄 MCP Tool Usage Flow (Deep Research)
For asynchronous deep research tasks, the engineer executes this strict sequence:
1. **`research_start`**: Initiate the background research job on the target notebook with the templated prompt. Returns a `job_id`.
2. **`research_status`**: Poll the `job_id` using exponential backoff (e.g., 5s, 10s, 20s) until status is `COMPLETED`.
3. **`research_import`**: Once complete, retrieve the final synthesized artifact and ingest it into the agent's context. Save the raw MCP output JSON to a temporary file (e.g., `_iwish-output/adhoc-workspace/scratch/mcp_output.json`).
4. **[ZERO-TRUST GATE] Provenance Check**: You MUST run `python3 .agent/scripts/verify_notebooklm_provenance.py <notebook_id> _iwish-output/adhoc-workspace/scratch/mcp_output.json`. If this script fails (Exit Code 1), HALT immediately. Do not process the results.

## 📁 Source Management
Before querying, the engineer ensures necessary context is present:
- Use **`source_add`** to inject local text, specific file contents, or direct URLs into the notebook.
- Use **`source_list_drive`** and Google Drive sync tools for enterprise documents.

## 💾 Notebook Persistence Logic
- **Templates 1-4**: Trigger operations in **Persistent** notebooks (Core or Research).
- **Template 5 (Situational)**: Operates in **Conditional/Ephemeral** notebooks. If the bug fix or situational research yields highly reusable architectural insights, the notebook is promoted (metadata updated) via the Lifecycle Manager; otherwise, it is slated for cleanup.

## 👣 Step-by-step Instructions
1. **Receive Intent**: Accept `research_need` and context.
2. **Select Template**: Match intent to Categories 1-6.
3. **Draft Request**: Populate the template variables.
4. **Gate Check**: Trigger `notebook-quality-gate`. **Halt** if rejected and revise.
5. **Manage Sources**: Add necessary sources via `source_add` if not already present.
6. **Execute**: 
   - For fast lookup: Call `notebook_query` and run `verify_notebooklm_provenance.py` on the output.
   - For deep synthesis: Execute the `research_start` -> `research_status` -> `research_import` flow -> `verify_notebooklm_provenance.py`.
7. **Return Results**: Format and deliver the output back to the calling agent.

## 🚨 Error Handling
- **Research Timeout**: If `research_status` polling exceeds 5 minutes, abort and notify the user.
- **Source Limits**: If `source_add` fails due to token/size limits, trigger a request to `notebook-lifecycle-manager` to split the notebook.

## Gate Classification

| Gate Name | Category | Enforcement Mechanism | Failure Action |
|---|---|---|---|
| Provenance Check | Category A | Bắt buộc chạy script `python3 .agent/scripts/verify_notebooklm_provenance.py` đối chiếu kết quả trả về với cấu trúc gốc. | Nếu Exit Code 1, HALT toàn bộ luồng. |
| Firewall Hook | Category A | Tuyên bố tích hợp OOB Hook: Hệ thống Orchestrator sẽ tự động chạy ngầm `session-compliance-auditor.py` để bắt lỗi nếu Agent bypass bước Provenance Check. | Bị Watchmen cách ly phiên làm việc và report Vi phạm Zero-Trust. |
