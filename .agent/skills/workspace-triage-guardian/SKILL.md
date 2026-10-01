---
name: workspace-triage-guardian
description: Zero-trust workspace hygiene scanner that detects cross-contamination, untracked files, and enforces strict cleanup gates.
---

# Workspace Triage Guardian

## Purpose
This skill ensures that isolated Git worktrees do not leak untracked files into the parent repository and do not contain files that belong to another feature's scope. It uses `git status --porcelain` to detect drift and strictly enforces a User Gate before any cleanup action is taken.

## Execution Rules

Khi được gọi, Agent PHẢI thực hiện tuần tự các bước sau:

1. **Quét Workspace (Scan):**
   ```bash
   git status --porcelain
   ```

2. **Phân loại (Triage):**
   - Phân tích output của lệnh trên.
   - Nhận diện các file Untracked (??) hoặc Modified (M) không thuộc scope của story hiện tại.
   - Các file rác (e.g., `test.py`, `temp.js`) ở thư mục gốc (root) phải được phân loại là: `MOVE to _iwish-output/adhoc-workspace/scratch/`.
   - Các file thuộc scope của story khác bị rò rỉ vào: `STASH` hoặc `DISCARD`.
   - Tuyệt đối cấm gán nhãn `DELETE` bằng lệnh `rm -rf <symlink>/`. Nếu xóa symlink, CHỈ ĐƯỢC DÙNG `unlink <symlink>`.

3. **Chốt chặn Người dùng (Zero-Trust User Gate):**
   - Agent **BẮT BUỘC** dừng lại và in ra một bảng Markdown liệt kê các hành động đề xuất.
   - Bảng phải có cấu trúc: `| File | Status | Proposed Action (Move/Stash/Unlink) | Reason |`
   - Báo cho user: *"Vui lòng kiểm tra bảng trên và phản hồi `/approve` nếu bạn đồng ý thực thi dọn dẹp."*
   - KHÔNG ĐƯỢC chạy bất kỳ lệnh bash nào để di chuyển/xóa file cho đến khi user gõ `/approve`.

4. **Thực thi (Execution):**
   - Sau khi user `/approve`, Agent thực thi các lệnh bash tương ứng.
   - Nếu Move: `mv <file> _iwish-output/adhoc-workspace/scratch/`
   - Nếu Unlink Symlink: `unlink <symlink>` (TUYỆT ĐỐI KHÔNG dùng `rm -rf`).
