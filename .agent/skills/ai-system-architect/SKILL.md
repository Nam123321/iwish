---
name: "ai-system-architect"
description: "Meta-Orchestrator kết nối và điều phối 6 kỹ năng AI/ML (aiml-architecture-evaluator, system-design-consultant, llm-engineering-skill, ai-native-architecture, llmops-finetuning-serving-skill, ai-engineering-knowledge-consultant) kèm Archify visual generation."
inputs: ["query", "mode", "story_id", "story_dir"]
outputs: ["architecture_report", "archify_visuals", "evidence_manifest"]
mcp_tools_required: ["notebooklm-mcp"]
subagent_triggers: ["architect-agent-persona", "review-agent-persona"]
domain: "AI Architecture Orchestration"
triggers: ["/ai-system-architect"]
---

# 🌐 AI System Architect (Meta-Orchestrator)

Facade duy nhất để thiết kế, thẩm định và tích hợp hệ thống AI/ML vào quy trình SDLC. Được điều phối cấp cao bởi `/ai-engineer-agent`.

---

## 🎛️ 4 Chế Độ Vận Hành (Tiered Modes)

Kích hoạt với cờ `--mode`:

| Mode | Mục Đích | Kỹ Năng Kích Hoạt | Chi Phí Token | Đầu Ra |
|---|---|---|---|---|
| `--mode=evaluate` | Thẩm định nhanh câu chuyện / tính năng AI | `aiml-architecture-evaluator` (Quad-Source) | Thấp (~1K-2K tokens) | 9-Axes Scorecard + Evidence JSON |
| `--mode=design` | Thiết kế kiến trúc giải pháp LLM / Agent | `ai-native-architecture` + `llm-engineering-skill` + `ai-engineering-knowledge-consultant` | Trung bình (~3K-5K tokens) | Solution Spec + Scratch Grounding |
| `--mode=ops` | Tinh chỉnh mô hình, serving, hạ tầng GPU | `llmops-finetuning-serving-skill` | Trung bình (~3K tokens) | Serving Topology + VRAM/GPU budget |
| `--mode=full` | Trọn gói End-to-End (Greenfield / Major Epics) | Cả 6 kỹ năng theo chuỗi + Archify | Cao (~8K-12K tokens) | Full Master Architecture + Archify Dual-File |

Chi tiết quy trình từng mode xem trong thư mục `profiles/`.

---

## 🔒 Category A Execution Verification Gate

Sau khi hoàn thành điều phối, Agent PHẢI:
1. Xác minh rằng tất cả các kỹ năng con được kích hoạt đã sinh file evidence hợp lệ.
2. Chạy `validate-skill-execution-evidence.py` cho từng kỹ năng tương ứng.
3. Nếu ở chế độ `--mode=evaluate` hoặc `--mode=full`, bắt buộc chạy `validate-aiml-evidence.py`.
