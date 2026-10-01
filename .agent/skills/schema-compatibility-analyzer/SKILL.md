---
name: schema-compatibility-analyzer
description: A tool to analyze Prisma migration files against previous schemas to detect backward-incompatible changes before Canary deployment.
---

# Skill: schema-compatibility-analyzer

## 1. Mục đích (Purpose)
Phân tích các file migration của Prisma so với schema cũ để phát hiện các thay đổi không tương thích ngược (backward-incompatible changes) trước khi thực hiện Canary deployment nhằm giải quyết rủi ro FIX-49-03.

## 2. Đầu vào (Inputs)
- `base_schema`: Prisma schema hiện tại (phiên bản đang chạy trên Production/Canary).
- `migration_files`: Danh sách các file migration SQL được tạo ra bởi Prisma.

## 3. Đầu ra (Outputs)
- `compatibility_report`: Báo cáo chi tiết về tính tương thích ngược.
- `status`: PASS/FAIL (nếu phát hiện các thay đổi phá vỡ cấu trúc như DROP COLUMN, RENAME TABLE mà không có cơ chế tương thích).

## 4. Các bước thực hiện (Steps)
1. Parse các file migration SQL mới.
2. Kiểm tra các câu lệnh SQL nguy hiểm đối với Canary deployment (VD: `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN ... TYPE`, `ALTER TABLE ... RENAME`).
3. Xác minh xem các thay đổi có theo chuẩn "Expand and Contract" hay không (VD: thêm cột mới cho phép NULL thay vì rename/drop cột cũ ngay lập tức).
4. Đánh giá State of Intent (SOI) và đưa ra quyết định PASS/FAIL cho CI pipeline.

## 5. Tiêu chí thành công (Success Criteria)
- Bắt được 100% các lỗi schema compatibility phổ biến.
- Không gây false positive đối với các thay đổi an toàn (như CREATE TABLE, ADD COLUMN nullable).
