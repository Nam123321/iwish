---
name: "Reset Circuit Breaker"
description: "Sử dụng khi Pipeline Integrity Runner gặp lỗi liên tiếp 3 lần và kích hoạt Circuit Breaker khóa tiến trình. Hướng dẫn Agent cách reset Circuit Breaker để tiếp tục pipeline."
---

# /reset-circuit-breaker-skill

## Ngữ cảnh (Context)
Khi Agent đang chạy các quy trình tự động hóa (đặc biệt là Review và QA), `pipeline-integrity-runner.py` sẽ đếm số lần thất bại liên tiếp (lưu trong các file dạng `integrity-fails-{target_type}-{target}.json` ở thư mục `_iwish-output`). Nếu thất bại >= 3 lần, hệ thống sẽ kích hoạt **Circuit Breaker** (hiện lỗi `"CRITICAL [CIRCUIT BREAKER TRIGGERED]"`) và khóa hệ thống, yêu cầu Agent dừng ngay lập tức. 

Kỹ năng này cung cấp một chốt chặn xác minh chuẩn (Category A) để tự động reset khóa thay vì làm gián đoạn người dùng.

## 1. Dấu hiệu kích hoạt (Trigger)
Kích hoạt tự động khi:
- Người dùng yêu cầu `reset circuit breaker`.
- Trong log xuất hiện chuỗi `"CRITICAL [CIRCUIT BREAKER TRIGGERED]"`.
- Agent bị kẹt và không thể chạy pipeline-integrity-runner.

## 2. Hướng dẫn Reset (Execution Instructions)
Khi phát hiện Circuit Breaker, Agent **PHẢI** chạy đoạn script/lệnh sau để xoá lịch sử thất bại và mở khoá (Unlock) hệ thống.

**Lệnh reset (Category A Gate - Deterministic):**
Sử dụng công cụ `run_command` để thực hiện đoạn mã Bash xoá tracking file:
```bash
rm -f _iwish-output/integrity-fails-*.json
echo "Circuit Breaker đã được reset thành công."
```


## 3. Hành động theo sau (Post-Execution)
Sau khi reset thành công:
1. Thông báo cho người dùng biết rằng lỗi Circuit Breaker đã được xóa và hệ thống đã mở khóa.
2. Tự động thử chạy lại tiến trình pipeline vừa bị thất bại (nếu được người dùng hoặc luồng quy trình trước đó yêu cầu).
3. KHÔNG tự ý sửa mã nguồn lõi hoặc mã hash trong `manifest` nếu chưa có sự chỉ đạo rõ ràng.

## 4. Anti-Fabrication Constraints (Watchmen Rules)
- **Mức độ trưởng thành (Enforcement Maturity):** High (100% Deterministic File Deletion).
- Không được phép "giả vờ" reset hoặc báo cáo "đã reset" mà chưa gọi lệnh `rm` để xóa file vật lý trong `_iwish-output`.

## Gate Classification

| Gate Name | Category | Enforcement Mechanism | Evidence Trail |
|-----------|----------|----------------------|----------------|
| CB-01 | A | Call bash `rm` or python script to physically delete `.json` tracker files | Shell execution code 0 and absent files |
| CB-02 | A | Verify the existence of the circuit breaker file before deleting | Shell output |
| CB-03 | B | Agent notifies the user after resetting the circuit breaker | Chat message |

*Enforcement Maturity: 66.6% (2/3 Category A)*

