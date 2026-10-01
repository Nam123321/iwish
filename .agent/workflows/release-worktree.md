---
name: release-worktree
description: "Gi\u1EA3i ph\xF3ng an to\xE0n t\xE0i nguy\xEAn Worktree tr\xEAn m\xE1\
  y (RAM, Port, Disk, SQLite) v\xE0 d\u1ECDn d\u1EB9p Git/GitHub (Branch, PR) khi\
  \ ho\xE0n th\xE0nh story/task"
---
# /release-worktree

Workflow này đóng vai trò là "Cửa ngõ Thoát" (Exit Point / Teardown Gateway) khi Developer hoặc Agent đã hoàn thành story, bugfix, hoặc task trên một Git Worktree và cần thu hồi tài nguyên một cách an toàn.

---

## 🎯 Mục đích & Nguyên tắc Vàng

1. **Zero Data Loss:** Không bao giờ xóa worktree nếu còn uncommitted diffs trừ khi người dùng chỉ định `--backup` hoặc `--force`.
2. **Resource Deallocation:** Tắt toàn bộ tiến trình chạy nền (dev servers, API, test runners) liên quan đến worktree, thu hồi cổng mạng (ports) và dọn dẹp dung lượng đĩa.
3. **SSOT Integrity:** Gỡ bỏ các runtime symlink (`_iwish-output`, `_SSOT`) trước khi xóa để bảo vệ tuyệt đối thư mục gốc `MAIN_REPO`.
4. **Clean Git State:** Hủy đăng ký trong SQLite `.worktrees/registry.db`, xóa local branch và hỗ trợ xóa remote branch trên GitHub (`--delete-remote`).

---

## 🚀 Cú pháp Lệnh (Usage & CLI Flags)

```bash
# 1. Giải phóng worktree hiện tại (tự động nhận diện worktree đang đứng)
/release-worktree

# 2. Giải phóng một worktree cụ thể theo ID, tên thư mục, hoặc branch
/release-worktree --target story-45.1

# 3. Giải phóng an toàn với tự động sao lưu uncommitted diffs vào scratchpad
/release-worktree --backup

# 4. Giải phóng và xóa luôn Remote Branch trên GitHub nếu cần thiết
/release-worktree --delete-remote

# 5. Chạy giả lập (Dry Run) để kiểm tra các tài nguyên sẽ được thu hồi
/release-worktree --dry-run
```

---

## 🔄 Quy trình Thực thi (Execution Sequence)

### Giai đoạn 1: Kiểm tra Tiền khả thi & An toàn (Pre-Flight Safety Checks)
- **Hành động:** Chạy `git status --porcelain` để kiểm tra uncommitted changes.
- **Rào cản (Gate):** 
  - Nếu dirty và KHÔNG có `--backup` / `--force` -> **HALT** ngay lập tức và hướng dẫn lưu trữ diff.
  - Nếu có `--backup` -> Tự động kết xuất file `.patch` tại `_iwish-output/adhoc-workspace/scratch/worktree-backups/<branch>_<timestamp>.patch`.

### Giai đoạn 2: Dừng Tiến trình & Gỡ Symlink (Teardown & Unlink)
- **Hành động 1:** Quét và gửi tín hiệu `SIGTERM` / `SIGKILL` đến các tiến trình chạy ngầm gắn liền với worktree (`lsof +D <target_dir>`).
- **Hành động 2:** Thực hiện `os.unlink` đối với `_iwish-output` và `_SSOT` trong worktree.
- **Hành động 3:** Mở khóa quyền ghi (`sudo chmod -R 755`) trên `.agent/scripts` của worktree.

### Giai đoạn 3: Gỡ bỏ Worktree & Cập nhật Registry
- **Hành động 1:** Chạy `git worktree unlock <path>` và `git worktree remove <path> --force`.
- **Hành động 2:** Gọi `worktree-registry.py unregister` để xóa bản ghi trong `.worktrees/registry.db` và ghi `audit_log`.
- **Hành động 3:** Chạy `git worktree prune`.

### Giai đoạn 4: Dọn dẹp Nhánh Git (Local & Remote / GitHub)
- **Hành động 1:** Kiểm tra xem branch có đang được checkout ở worktree nào khác không. Nếu không, chạy `git branch -d <branch>` (hoặc `-D` nếu `--force`).
- **Hành động 2 (Tùy chọn):** Nếu có cờ `--delete-remote`, kiểm tra `git ls-remote --heads origin <branch>` và chạy `git push origin --delete <branch>`.

### Giai đoạn 5: Hậu kiểm Toàn vẹn (Integrity Sweep)
- **Hành động:** Chạy `python3 .agent/scripts/worktree-integrity-validator.py --fix` và `python3 .agent/scripts/workspace-janitor.py --auto-clean --enforce-structure`.
- **Kết quả:** Báo cáo xác nhận môi trường đã được giải phóng thành công.
