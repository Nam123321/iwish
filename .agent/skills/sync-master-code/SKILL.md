---
name: sync-master-code
description: Tự động kéo mã nguồn (code logic) mới nhất từ nhánh master về worktree hiện tại thông qua rebase để đảm bảo lịch sử tuyến tính.
---

# Sync Master Code

## Purpose
Skill này giúp lập trình viên nhanh chóng cập nhật mã nguồn (UI, API, Logic) mới nhất từ nhánh `master` của remote (GitHub) về worktree hiện tại.
Sử dụng `git rebase` thay vì `git merge` để giữ lịch sử commit tuyến tính và sạch sẽ.

## Execution Rules

Khi user gõ lệnh `/sync-master-code`, Agent PHẢI thực thi script đồng bộ chuẩn Category A:

```bash
python3 .agent/scripts/sync-master-code.py .
```

Script sẽ tự động:
1. **Kiểm tra an toàn**: Chặn đứng nếu working tree có file bẩn (`git status --porcelain`).
2. **Tạo Safety Net**: Tự động tạo nhánh backup `auto-backup-pre-init-<timestamp>` trước khi thao tác.
3. **Phát hiện Ghost Fork (Dual-Tier Engine)**: Phân tích cả commit thường (`git cherry`) và squash-merged PRs (`git diff origin/master...HEAD`).
4. **Tự động Auto-Heal**: Nếu là nhánh cũ đã merge, tự động reset về `origin/master`.
5. **Rebase Tuyến tính**: Nếu có commit mới thực sự, tự động rebase lên `origin/master`. Nếu có conflict thực sự, tự động abort và hướng dẫn người dùng chi tiết.

