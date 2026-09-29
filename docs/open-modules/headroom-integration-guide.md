# Headroom Integration Guide (Adoption Review Pack)

## 1. Classification & Placement
- **Shape**: `SYSTEM_SKILL` (Bundle)
- **Role**: `supportive`
- **Framework Placement**: Acts as a middleware / background proxy layer between I-Wish agents and the LLM API provider. It intercepts and automatically compresses tool outputs and JSON/AST responses.

## 2. Core Use Cases
- Tự động nén (compress) các payload quá lớn từ output của command line, JSON log, hoặc RAG context để tiết kiệm 60-95% lượng token API.
- Cung cấp mô hình proxy drop-in, giúp I-Wish không cần thay đổi code của agents mà vẫn được hưởng lợi từ việc giảm lượng token.

## 3. Adjacent Use Cases
- Có thể hoạt động như một MCP Server (`headroom_compress`, `headroom_retrieve`) để LLM chủ động quyết định nén văn bản hoặc giải nén (CCR pattern).

## 4. Edge Cases & Stress Cases
- **Over-compression**: Nén quá mức có thể làm mất các stack trace lỗi quan trọng trong logs, dẫn đến AI "ảo giác" (hallucinate).
- **Incompatible payloads**: Payload không phải chuẩn JSON hoặc AST hợp lệ có thể bị bypass hoặc xử lý lỗi không đồng nhất.
- **Latency**: Có độ trễ nhất định do quá trình nén và phân tích AST tại proxy trước khi gửi HTTP request.

## 5. Constraints
- Cần Python 3.10+ để chạy proxy daemon.
- Phải đảm bảo không làm thay đổi các metadata quan trọng (schema yêu cầu cấu trúc chặt chẽ).

## 6. Agent / Workflow Coordination (Orch Routing Hints)
- **Orch-Agent**: Có thể kích hoạt (hoặc nhắc user bật) proxy headroom trước khi chạy `/absorb-repo` hoặc `/analyze-codebase` vì các workflow này đọc khối lượng code cực kỳ lớn.
- **Dev-Agent / QA-Agent**: Khi các agent này đối mặt với lỗi "Context Window Exceeded", hệ thống có thể đề xuất tự động khởi động Headroom proxy.

## 7. Review Questions cho User
- Bạn có muốn I-Wish tự động bật/tắt proxy Headroom dựa trên độ dài dự kiến của payload không, hay muốn nó luôn chạy (always-on daemon)?
- Với rủi ro mất mát thông tin (over-compression), bạn có muốn cấu hình một tệp `whitelist` (ví dụ: không bao giờ nén các tệp PRD và Epic) không?
