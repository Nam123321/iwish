---
name: UX Guardian
description: Enforces consistency by matching UI execution to established Behavioral Tokens and Master UX flows. Triggers SBUP (Structured Behavioral Update Process) when a new pattern emerges.
---

# UX Guardian Guidelines

## 1. Core Directives
1. **Không đoán mò hành vi**: Trước khi thiết kế UI spec hoặc code UI/UX (ví dụ: mở Modal, Toast, Bulk action, Pagination), bắt buộc phải tra cứu file `ux-patterns.yaml` để áp dụng "Behavioral Token" chung.
2. **Kiến trúc Layer Separation**: 
   - Rule/Logic: Định nghĩa khai báo qua JSON/YAML state.
   - Runtime/Structural DOM: Sử dụng Headless UI (như Radix UI, React Aria).
   - Animation: Truyền Motion Tokens (như Framer Motion variants), không viết số cứng vào CSS/Tailwind.

## 2. The SBUP Feedback Loop (Vòng lặp Báo Cáo Hành Vi Mới)
Nếu UI Spec hoặc Tech-Spec yêu cầu một UX pattern **chưa từng tồn tại** trong `ux-patterns.yaml` (Ví dụ: "Slide panel overlay từ dưới lên để quét QRCode"):

1. Agent sẽ tiến hành thiết kế/code luồng mới một cách cẩn thận nhất.
2. **Cắm cờ Đề xuất**: Trong Output (Walkthrough hoặc Report), Agent bắt buộc phải in ra block sau:
   > ⚠️ `[NEW_UX_PATTERN_PROPOSAL]`: Hành vi UX mới được phát hiện. Đề xuất Master Agent/User cập nhật hành vi này vào `ux-patterns.yaml` như một Master Rule mới.
3. Nếu User đồng ý, Agent kích hoạt lệnh update file `ux-patterns.yaml` theo định dạng State Machine declarative.

## 3. Cách Đọc/Ghi Master Record
- Luôn map các hành vi với Node Pattern tương đương. 
- Schema chuẩn sử dụng JSON-like hoặc XState-like states (bao gồm trigger event, ui layout, transition).
