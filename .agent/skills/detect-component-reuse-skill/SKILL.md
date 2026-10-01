---
name: "Detect Component Reuse"
description: "Zero-Trust Enforcement gate to prevent Agents from creating duplicate UI components by semantically scanning existing libraries."
---

# /detect-component-reuse-skill

## Ngữ cảnh (Context)
Agent thường có xu hướng "lười" tái sử dụng Component cũ (Re-invent the wheel) và tự ý tạo ra các Component mới có chức năng trùng lặp. Skill này cung cấp một **Máy quét Ngữ nghĩa 3 Lớp (3-Layer Semantic Scanner)** để phát hiện và ép buộc Agent phải giải trình trước khi được phép tạo mới.

## 1. Dấu hiệu kích hoạt (Trigger)
Kỹ năng này BẮT BUỘC (MANDATORY) được kích hoạt trong các luồng UI Spec (`iwish-feature-create-ui-spec.md` hoặc `step-00-visual-research.md`) ngay tại thời điểm Agent nảy ra ý định đề xuất một `Candidate for Library` mới.

## 2. Hướng dẫn Thực thi (Execution Instructions)
Trước khi Agent quyết định một Component là "mới", Agent **PHẢI** chạy công cụ CLI sau:

```bash
python3 .agent/scripts/detect-component-reuse.py --component "TênComponentĐềXuất" --desc "Mô tả ngắn gọn về chức năng của component này"
```

## 3. Lớp 3: Agentic Semantic Evaluation (Zero-Trust Gate)
Sau khi script trả về Top các Component có độ trùng lặp ngữ nghĩa cao, Agent KHÔNG ĐƯỢC PHÉP phớt lờ kết quả.
Agent BẮT BUỘC phải thực hiện một thao tác phân tích công khai (Output text):
1. **Nếu tìm thấy Component phù hợp:** Agent phải thông báo "Sẽ tái sử dụng Component [Tên]" và DỪNG việc tạo mới. (Có thể dùng cờ `[COMPONENT MUTATION DETECTED]` nếu cần sửa đổi nhỏ).
2. **Nếu từ chối dùng lại:** Agent phải viết một đoạn giải trình chỉ rõ sự khác biệt về **Ngữ nghĩa (Semantic)** hoặc **Kiến trúc (Architecture)** giữa component đề xuất và các component cũ. Nếu lý do không đủ thuyết phục, Agent sẽ bị tính là vi phạm Zero-Trust.

## Gate Classification

| Gate Name | Category | Enforcement Mechanism | Evidence Trail |
|-----------|----------|----------------------|----------------|
| REUSE-01 | A | Call `detect-component-reuse.py` | Shell execution code 0 |
| REUSE-02 | B | Agentic Evaluation Prompt | LLM output in transcript |

*Enforcement Maturity: 50.0% (1/2 Category A)*
