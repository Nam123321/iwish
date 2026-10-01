import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import datetime

content = """---
type: I-Wish Story
title: 'Story 67.2: Tenant-isolated Soft Deletes & Trash Bin Recovery'
description: "Cung cấp cơ chế 'Thùng rác' (Trash Bin) cho phép người dùng khôi phục các dữ liệu quan trọng (Core Entities) đã bị xóa trong vòng 30 ngày, đảm bảo tính cô lập dữ liệu (tenant-isolated)."
resource: Story-67.2
tags:
- story
status: backlog
links_to:
- Epic-67
dependencies: []
timestamp: '2026-08-08T13:00:00+07:00'
---

# Story 67.2: Tenant-isolated Soft Deletes & Trash Bin Recovery

**Epic:** Epic 67
FR Covered: [FR-SYS-03: Soft Delete & Trash Bin]({project-root}/_iwish-output/1.%20Discovery/PRD.md)
Complexity Score: 5 (Standard backend logic, cron job, standard UI)

## 1. Mục tiêu (Goal)
Cung cấp cho người dùng một tính năng **Trash Bin (Thùng rác)** để dễ dàng hoàn tác (Undo) các thao tác xóa nhầm đối với các tài nguyên cốt lõi (Core Entities).

## Acceptance Criteria

- **AC1:** Các entity quan trọng phải hỗ trợ cột `deletedAt`. Khi người dùng xóa một entity, hệ thống cập nhật `deletedAt = now()` và tạo một bản ghi vào bảng `TrashBinItem`.
- **AC2:** `TrashBinItem` phải chứa: `tenantId`, `entityType`, `entityId`, `deletedByUserId`, `deletedAt`, và `expiresAt` (mặc định 30 ngày sau `deletedAt`).
- **AC3:** Có một API Trash Bin trả về danh sách các mục đã bị xóa, trả về chi tiết: Tên loại entity, ID, người xóa, thời gian xóa, và thời gian còn lại.
- **AC4:** Cung cấp API để khôi phục các mục trong Trash Bin. Hành động khôi phục sẽ set `deletedAt = null` trên entity gốc và xóa bản ghi `TrashBinItem` tương ứng.
- **AC5:** Có một cronjob chạy định kỳ (mỗi ngày) để quét các bản ghi `TrashBinItem` đã hết hạn và thực hiện Hard Delete (xóa vật lý) các entity tương ứng và các dữ liệu liên quan.

## Tasks
- [ ] Task 1: Update Prisma schema for `deletedAt` and `TrashBinItem`.
- [ ] Task 2: Create Trash Bin APIs (List, Restore).
- [ ] Task 3: Implement Hard Delete cronjob.

## AC-to-Task Traceability Matrix
| Acceptance Criteria | Task |
| --- | --- |
| AC1 | Task 1 |
| AC2 | Task 1 |
| AC3 | Task 2 |
| AC4 | Task 2 |
| AC5 | Task 3 |

## Cross-Feature Dependencies

### Impacts
- Không có impact trực tiếp.

### Consumes
- Sử dụng Prisma Client.

### Shared Entities
- `TrashBinItem`.

### Cross-Portal
- Không.

## QA Simulator Scorecard
| Axis | Score | Notes |
| --- | --- | --- |
| 1. Completeness | 9/10 | Covers all soft-delete requirements. |
| 2. Consistency | 9/10 | Aligns with existing architecture. |
| 3. Feasibility | 10/10 | Standard implementation. |
| 4. Testability | 9/10 | Easy to test APIs. |
| 5. Security | 9/10 | Uses tenantId for isolation. |
| 6. Maintainability | 9/10 | Clear logic. |
| 7. UX Empathy | 8/10 | Gives users an undo option. |
| **TOTAL AVERAGE** | 9.0/10 | PASS |
"""
with open("_iwish-output/3. Development/1. Epic & Story/FG-03-Infrastructure-Core-Services/Epic-67/Story-67.2/story.md", "w") as f:
    f.write(content)
