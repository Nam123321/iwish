---
name: "aiml-architecture-evaluator"
description: "Thẩm định, đánh giá và thiết kế kiến trúc hệ thống AI/ML theo 9 Trục MLSD và giao thức Zero-Trust Category A Tri-Source Provenance."
inputs: ["query", "story_id", "story_dir"]
outputs: ["aiml_scorecard", "cross_validation_matrix", "aiml_evidence"]
mcp_tools_required: ["notebooklm-mcp"]
subagent_triggers: ["notebook-retrieval-engine", "ae-notebook-orchestrator"]
domain: "AI Architecture & Evaluation"
triggers: ["/audit-aiml", "/eval-ml-architecture", "/ai-eval"]
---

# 🤖 AIML Architecture Evaluator

Kỹ năng chuyên sâu phục vụ việc thẩm định kiến trúc AI/ML, Large Language Models (LLM), Small Language Models (SLM), Hệ thống Multi-Agent và ML System Design (MLSD).

---

## 🏛️ 9 Trục Đánh Giá Kiến Trúc MLSD (Scorecard 9 Axes)

Mỗi bài toán AI/ML khi đi qua skill này bắt buộc phải được đánh giá qua 9 trục:
1. **Problem Formulation & Metrics:** Business Metric vs ML Metric (Precision, Recall, NDCG, Latency SLA).
2. **Data Pipeline & Feature Engineering:** Data ingestion, feature store, streaming vs batch, data drift.
3. **Model Selection & Architecture:** LLM/SLM size, Fine-Tuning (LoRA/QLoRA) vs Prompt/RAG, Quantization.
4. **Training & Optimization Strategy:** Distributed training, loss functions, checkpointing, catastrophic forgetting.
5. **Serving & Inference Architecture:** vLLM, TensorRT-LLM, KV Cache optimization, speculative decoding.
6. **Scalability & Capacity Planning:** QPS estimation, GPU VRAM sizing, auto-scaling, thundering herd.
7. **Resilience & Fault Tolerance:** Fallback models, circuit breaker, retry budget, graceful degradation.
8. **Evaluation & Continuous Learning:** Online A/B testing, shadow deployment, human-in-the-loop, feedback loops.
9. **Security, Privacy & Ethics:** Prompt injection, PII scrubbing, model jailbreaking, data sovereignty.

Chi tiết tiêu chí từng trục: xem `modules/scorecard-9-axes.md`.

---

## 🛡️ Zero-Trust Category A Quad-Source Protocol (BẮT BUỘC)

Agent KHÔNG ĐƯỢC phép tự suy diễn kiến trúc mà PHẢI thực thi quy trình **Quad-Source Verification**:

### Nguồn A: Topology & Graph Kiến Thức
- Đọc đồ thị tri thức từ `_iwish-output/1. Idea Discovery/1.4. research/AIMLInterviews-repo-topology.json` (hoặc đồ thị tương đương).
- Xác minh các design patterns đã được kiểm chứng.

### Nguồn B: NotebookLM Domain Deep Retrieval
- Gọi MCP `notebooklm-mcp: notebook_query` hoặc qua `ae-notebook-orchestrator` tới Notebook:
  - Notebook ID: `655d181d-af8c-48d3-b775-db3408e5a82e` (AIML System Design Playbook)
  - Hoặc các Notebook AI Layer tương ứng (`Cowok/Research-AI-Models`: `6e704ca7-...`).
- Trích xuất trích dẫn thực tế từ tài liệu MLSD.

### Nguồn C: Hiện Trạng Kiến Trúc Dự Án (Reality Check)
- Dùng `view_file` đọc trực tiếp `_iwish-output/2. Product Planning/2.5. architecture.md` và `tech-decision-registry.yaml`.
- So khớp ràng buộc hạ tầng của dự án (Node.js, Postgres, Redis, Python service...).

### Nguồn D: Giáo Trình & Scratch-Built Code Grounding (Curriculum Reality)
- Sử dụng kỹ năng `ai-engineering-knowledge-consultant` để truy xuất các bài học từ `ai-engineering-from-scratch` (523 lessons).
- Cung cấp nền tảng toán học, thuật toán và code mẫu từ gốc (scratch-built code) đối chiếu với các quyết định kiến trúc.
- Bắt buộc xác thực trích dẫn vật lý qua `.agent/scripts/validate-citation-integrity.py`.

---

## 🔒 Physical Evidence Gate (Category A Enforcement)

Sau khi hoàn thành thẩm định, Agent PHẢI:
1. Sinh file evidence JSON: `_iwish-output/adhoc-workspace/scratch/{uuid}-aiml-evidence.json` theo đúng schema.
2. Chạy validator kiểm tra transcript provenance:
```bash
python3 .agent/scripts/validate-aiml-evidence.py \
  --file "_iwish-output/adhoc-workspace/scratch/{uuid}-aiml-evidence.json" \
  --conversation-id "<YOUR_CONVERSATION_ID>"
```
3. Nếu script trả về exit code `1` (FAIL), Agent bị coi là **Fabricating Evidence (Giả lập)** và pipeline sẽ dừng lại ngay lập tức.

---

## 📊 Archify Dual-File Visual Rule
Khi người dùng hoặc kịch bản yêu cầu trực quan hóa sơ đồ kiến trúc AI/ML:
1. Luôn hỏi người dùng trước khi sinh sơ đồ visual lớn.
2. Tuân thủ **Dual-File Rule**: Sinh đồng thời cả file `.json` schema và file `.html` render tại thư mục `_iwish-output/2. Product Planning/system-design-visuals/{topic}-{uuid}-schema.json` và `.html`.
