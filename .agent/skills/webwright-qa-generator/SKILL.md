---
name: webwright-qa-generator
description: Use when generating persistent E2E automation tests based on the Webwright methodology (Playwright Python/JS scripts). This skill creates robust, resilient code-based UI interaction scripts instead of relying on ephemeral single-action MCP DevTools operations.
---

# Webwright QA Generator Skill

## Context
Khi QA Agent được giao nhiệm vụ tự động hóa kiểm thử (QA Automate) cho một User Story hoặc tính năng, skill này bắt buộc áp dụng **Triết lý Webwright** để tạo ra các bài test Automation bền vững.
Thay vì sử dụng Chrome DevTools MCP để click từng bước một cách tạm thời, QA Agent phải lập trình một script Playwright giả lập hành vi người dùng. Script này sẽ trở thành một tài sản (Artifact) E2E Test chạy độc lập trong CI/CD.

## Core Directives (Chỉ thị cốt lõi)

### 1. Code-First Approach (Tiếp cận bằng Code)
KHÔNG sử dụng các lệnh tương tác tức thời của Chrome DevTools MCP (`click`, `fill`, `navigate_page`) để hoàn thành nghiệp vụ. Thay vào đó, hãy sinh mã nguồn Playwright (bằng Python hoặc TypeScript tùy thuộc stack dự án).

### 2. Auto-Wait & Resiliency (Tính bền bỉ)
- Tận dụng tối đa tính năng `auto-wait` của Playwright.
- Tránh sử dụng `time.sleep` hoặc hardcoded timeouts.
- Ưu tiên sử dụng các locator tin cậy: `get_by_role`, `get_by_text`, `get_by_test_id`.

### 3. Vòng lặp Thực thi (Execution Loop)
1. **Analyze (Phân tích):** Đọc Acceptance Criteria từ User Story hoặc PRD.
2. **Generate (Sinh mã):** Viết script Playwright và lưu vào thư mục E2E Test (ví dụ: `tests/e2e/`).
3. **Execute (Chạy thử):** Dùng Terminal (`run_command`) chạy script vừa tạo để đảm bảo nó Pass với UI hiện hành.
4. **Iterate (Tinh chỉnh):** Nếu lỗi, đọc traceback từ Terminal (không cần vào DevTools) và sửa script Playwright cho đến khi Pass.

### 4. Output Artifact (Đầu ra)
Kết quả cuối cùng là một file Playwright Script hoàn chỉnh đã được test thành công. Cập nhật lại Task/Story báo cáo rằng E2E Test đã bao phủ tính năng.

### 5. Storage & Environment Configuration (Lưu trữ & Môi trường)
- **Directory Structure:** Lưu tất cả script sinh ra vào thư mục `tests/e2e/`. KHÔNG để lẫn vào thư mục `src`.
- **Version Control:** File script (`.spec.ts` hoặc `.py`) phải được đưa vào Git để chạy CI/CD. Đảm bảo các thư mục sinh ra trong lúc chạy test (như `test-results/`, `playwright-report/`) được thêm vào `.gitignore`.
- **Môi trường:** Không hardcode URL (ví dụ `http://localhost:3000`). Mọi script sinh ra phải sử dụng biến môi trường (ví dụ `process.env.BASE_URL` hoặc lấy từ file cấu hình Playwright) để dễ dàng chạy test trên Local, Staging hoặc Production.
