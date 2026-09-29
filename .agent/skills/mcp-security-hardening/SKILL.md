---
name: mcp-security-hardening
description: Hướng dẫn tiêm các pattern bảo mật và vận hành cốt lõi vào code MCP (Idempotency keys, Rate limiters, HMAC Signatures, Semantic Error Translators).
---

# MCP Security Hardening Skill

Skill này hướng dẫn chi tiết cách áp dụng 4 cơ chế bảo mật cốt lõi vào một MCP Server thực tế, đáp ứng đầy đủ các Edge Case bảo mật và vận hành. Các cấu phần middleware cần được thiết kế để không làm treo request pipeline với giới hạn timeout tối đa là 50ms.

## 1. Idempotency Key Integration
Sử dụng Idempotency Key để đảm bảo các thao tác quan trọng không bị thực thi nhiều lần.

- **Format Validation & Length Check**: Kiểm tra tính hợp lệ và độ dài của Idempotency Key ngay đầu middleware. Nếu key sai định dạng hoặc vượt quá độ dài cho phép, **bắt buộc** trả về mã lỗi `400 Bad Request` ngay lập tức.
- **In-flight Handling**: Khi phát hiện một request sử dụng Idempotency Key đã được nhận trước đó nhưng vẫn đang ở trạng thái xử lý (in-flight), hệ thống phải trả về `409 Conflict`.
- **TTL (Time To Live)**: Việc lưu trữ Idempotency Key bắt buộc phải cấu hình TTL mặc định (ví dụ: 24 giờ) để phòng ngừa rò rỉ bộ nhớ (memory leak).
- **Timeout**: Idempotency middleware phải có cấu hình timeout (< 50ms) để không làm treo toàn bộ request pipeline.

## 2. Rate Limiting Integration
Cấu hình Rate limiters cho các MCP endpoints để chống DDoS và lạm dụng API.

- **Atomic Updates**: Cấu hình Rate Limiter phải đảm bảo tính nguyên tử (atomic) trong môi trường concurrency cao. Sử dụng các cấu trúc dữ liệu nguyên tử hoặc Redis Lua scripts để tránh lọt request do race conditions.
- **Fail-Closed Policy**: MCP Framework phải xử lý an toàn khi hệ thống lưu trữ cache bị sập. Hệ thống phải áp dụng fail-closed policy (từ chối request hoặc chuyển sang chế độ giới hạn cực thấp) thay vì cho phép tất cả request đi qua.
- **Timeout**: Tương tự như Idempotency, Rate Limit middleware cũng phải có cấu hình timeout (< 50ms).

## 3. HMAC Signatures
Tích hợp xác thực HMAC Signatures để đảm bảo tính toàn vẹn và xác thực nguồn gốc của request.

- **Validation**: Nếu HMAC signature trống, hệ thống phải trả về mã lỗi `400 Bad Request` ngay lập tức.
- **Timestamp Check (Anti-Replay Attacks)**: Xác thực HMAC Signatures phải bắt buộc đi kèm kiểm tra độ trễ Timestamp. Hệ thống cần so sánh Timestamp của request với thời gian hiện tại và từ chối nếu chênh lệch vượt quá một ngưỡng nhất định (ví dụ: 5 phút).
- **Fail-Closed Policy**: Trong trường hợp gặp sự cố nội bộ khi xử lý secret key hay cache bị sập trong quá trình xác thực (như khi lấy nonces), hệ thống phải tuân theo fail-closed policy.

## 4. Semantic Error Translators
Chuyển đổi các lỗi kỹ thuật và hệ thống thành các thông báo lỗi ngữ nghĩa (Semantic Errors) dễ hiểu cho LLM hoặc client.

- **No Stack Trace**: Semantic Error Translators **tuyệt đối không bao giờ** được trả về Stack Trace trong response.
- **Data Sanitization**: Ngăn chặn rò rỉ thông tin nội bộ của server (chẳng hạn như đường dẫn thư mục, thông tin DB, phiên bản thư viện, v.v.). Chỉ trả về thông điệp chung đã được làm sạch và thân thiện.
