---
name: sync-worktree-to-root
description: "\u0110\u1ED3ng b\u1ED9 an to\xE0n thay \u0111\u1ED5i t\u1EEB worktree\
  \ sang root workspace v\xE0 commit v\xE0o master"
version: 1.0.0
tags:
- worktree
- git-sync
- master-sync
- zero-trust
---
# Sync Worktree To Root (`sync-worktree-to-root`)

## 🎯 Mục Đích
Skill này cung cấp quy trình tự động hóa **chiều ĐẨY (Upstream Sync)**: Chuyển toàn bộ các file mới, mã nguồn cập nhật, kỹ năng (skills), cấu hình và tài liệu từ worktree phát triển hiện tại về **thư mục gốc (Main Repo Workspace: `{project-root}`)** và commit vào nhánh `master` một cách an toàn.

---

## 🛡️ Các Cơ Chế Zero-Trust Category A Bảo Vệ

1. **Tuân Thủ Git Ref Modification Safety Rule**:
   - Sử dụng `git worktree list --porcelain` để xác định chính xác vị trí nhánh `master` đang được checkout theo thời gian thực (Real-time check).
   - Tuyệt đối KHÔNG sử dụng `git update-ref` hoặc `git branch -f` từ bên ngoài để tránh làm hỏng trạng thái index của worktree gốc.
   - Thao tác commit được thực hiện trực tiếp tại ngữ cảnh của thư mục gốc (`git -C <root> commit`), đảm bảo an toàn tuyệt đối cho các tiến trình agent khác đang hoạt động.
2. **Selective Staging (Phòng Chống Ghi Đè Chéo)**:
   - Chỉ copy và stage các file thuộc phạm vi công việc vừa hoàn thành.
   - Bỏ qua các file rác, file tạm, lockfile nội bộ và không can thiệp vào các file unstaged chưa hoàn thiện của các agent khác tại root.
3. **Workspace Hygiene Enforcement**:
   - Tự động chạy `workspace-janitor.py --auto-clean --enforce-structure` trước khi đồng bộ để dọn sạch mọi file scratch/patch tạm thời.
4. **Read-Only Permission Auto-Healing**:
   - Tự động phát hiện và cấp quyền ghi (`chmod 0644`) khi cập nhật các script hoặc file cấu hình read-only tại thư mục root.

---

## ⚡ Hướng Dẫn Thực Thi (Execution Steps)

Khi người dùng gõ lệnh `/sync-worktree-to-root` hoặc `/sync-master`:

### Bước 1: Thực Thi Đồng Bộ Tự Động
```bash
python3 .agent/scripts/sync-worktree-to-root.py --commit-msg "feat(sync): sync updates from worktree to master"
```

Tùy chọn:
- Muốn đẩy code lên GitHub remote luôn: Thêm cờ `--push`.
- Muốn chỉ copy file sang root mà chưa commit: Thêm cờ `--no-commit`.
- Muốn chỉ định danh sách file cụ thể: Thêm `--files path/to/file1 path/to/file2`.

### Bước 2: Xác Minh Kết Quả Đồng Bộ
Kiểm tra JSON kết quả in ra:
- `synced_files_count`: Số file đã đồng bộ sang root.
- `master_commit`: Mã SHA commit mới trên nhánh `master` tại root.
- `status`: Bắt buộc là `SUCCESS`.

---

## 📋 Commands / Triggers
- `/sync-worktree-to-root`: Đồng bộ toàn bộ thay đổi từ worktree hiện tại về root workspace và commit vào master.
- `/sync-master`: Lệnh tắt tương đương.
