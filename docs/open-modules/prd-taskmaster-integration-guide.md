# 🧭 Adoption Review Pack: prd-taskmaster Integration
> **Target Asset:** prd-taskmaster (v3.0.0)
> **Integration Mode:** Selective Pattern Adoption (SYSTEM_SKILL)
> **Host Framework:** I-Wish Core

---

## 1. Classification & Framework Placement
- **Shape Axis:** `skill-attachment` (PRD Validation Filter) & `fragment` (Throttled Update Cooldown)
- **Role Axis:** `supportive`
- **Framework Placement:** Tích hợp bộ quét từ ngữ mơ hồ vào `/validate-prd` workflow và tích hợp hàm helper cooldown-throttled check vào bộ thư viện dùng chung của I-Wish (`.agent/scripts/`).

---

## 2. Core Use Cases
1. **Kiểm tra chất lượng Spec tự động (Automatic Spec Auditing):** Khi tác nhân I-Wish (ví dụ: `pm-agent` hoặc `dev-agent`) tạo hoặc cập nhật tài liệu PRD/Architecture, bộ lọc `VAGUE_WORDS` sẽ tự động chạy để phát hiện các tính từ định lượng không đo lường được (e.g. "performant", "easy", "scalable") và đề xuất thay thế bằng chỉ số đo lường (e.g. "< 200ms p95", "system memory < 512MB").
2. **Tối ưu hóa API Call ngoại vi (Externally Throttled Checks):** Khi I-Wish cần gọi API hoặc kiểm tra phiên bản bên ngoài (e.g. check updates, query ontology), helper cooldown sẽ lưu cache thời gian và bỏ qua việc gọi API nếu chưa hết thời hạn chờ (cooldown 24h), tránh nguy cơ bị rate-limit.

---

## 3. Boundary Cases & Constraints

### Edge Cases
- **Bao phủ từ ngữ (Vocabulary Coverage):** Một số từ ngữ có thể mang tính chất kỹ thuật trong ngữ cảnh này nhưng lại bị lọc là mơ hồ trong ngữ cảnh khác (e.g., "secure" khi thiết lập SSL có thể là hợp lệ, nhưng "system should be secure" là mơ hồ). Cần xây dựng logic loại trừ phù hợp dựa trên vị trí câu.
- **Cách ly cục bộ (Local Sandbox Environment):** Mọi tệp cấu hình của bộ cooldown phải nằm trong cấu trúc ứng dụng I-Wish (`~/.gemini/antigravity/` hoặc folder brain), không viết trực tiếp vào thư mục toàn cục của hệ thống nằm ngoài quyền kiểm soát của workspace.

### Stress Cases
- **Kiểm định tài liệu cực lớn (Ultra-Large Documents):** Đối với các tệp PRD lớn hơn 10,000 dòng, bộ lọc regex có thể gặp hiệu năng chậm hoặc nghẽn (catastrophic backtracking). Giải pháp: Phân khúc file theo từng heading và quét riêng lẻ.

---

## 4. Coordination & Orchestrator Routing Hints
- **Trigger:** Khi người dùng chạy lệnh `/validate-prd` hoặc trong pha validation của `/create-prd`.
- **Orch Routing:** Bộ kiểm định chất lượng tài liệu sẽ tự động nạp bộ lọc vague-language để tăng mức độ khắt khe của đánh giá chất lượng spec, giảm điểm số nếu có vi phạm.

---

## 5. Review Questions for the User
1. **Bộ từ khóa mơ hồ (Vague Words):** Bạn có muốn bổ sung thêm bất kỳ từ khóa tiếng Việt hay tiếng Anh nào đặc trưng cho dự án của bạn (ví dụ: "nhanh", "mượt", "ổn định") vào bộ lọc tự động không?
2. **Cấu hình Cooldown:** Bạn có đồng ý đặt thời gian chờ mặc định cho việc kiểm tra cập nhật các skill ngoài là 24 giờ không?
