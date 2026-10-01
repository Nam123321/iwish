---
name: worktree-init
description: "Lệnh All-in-one khởi tạo Worktree: Tự động đồng bộ dữ liệu SSOT, gài cắm bảo mật Watchmen và cài đặt môi trường"
---
# /worktree-init

Workflow này đóng vai trò là "Cửa ngõ" (Entry point) khi Developer bắt đầu làm việc trên một Git Worktree mới hoặc cần đồng bộ lại toàn bộ môi trường từ master.

**Quy trình Thực thi (Execution Sequence):**

### Giai đoạn 1: Đồng bộ Dữ liệu Lõi & Daemon Zero-Trust
- **Hành động 1:** Kích hoạt Watchmen MCP Daemon nền để phục vụ chữ ký OOB.
  ```bash
  pkill -f watchmen-mcp/index.js || true
  mkdir -p .agent/logs
  nohup node .agent/mcp/watchmen-mcp/index.js > .agent/logs/daemon.log 2>&1 &
  while [ ! -S /tmp/watchmen.sock ]; do sleep 0.5; done
  ```
- **Hành động 2:** Đọc và thực thi hướng dẫn tại `.agent/skills/sync-ssot-worktree/SKILL.md`.
- **Mục đích:** Tự động kéo trạng thái mới nhất từ `master`, thiết lập Symlink cho `_iwish-output` (SSOT), và đồng bộ các Catalog/Registry để chống phân mảnh dữ liệu giữa các nhánh.
- **Rào cản:** Agent phải đợi quá trình này hoàn tất thành công (exit code 0) trước khi đi tiếp.

### Giai đoạn 1.5: Cập nhật Mã nguồn (Source Code) & Khử Ghost Fork
- **Hành động:** Thực thi script tự động hóa khử stale-fork và đồng bộ master:
  ```bash
  python3 .agent/scripts/sync-master-code.py .
  ```
- **Mục đích:** Tự động phát hiện ghost commits, squash-merge duplicates thông qua engine `git cherry` & 3-way diff. Tự động reset về `origin/master` nếu không có commit độc lập, hoặc rebase an toàn nếu có commit mới. Tự động tạo safety net backup branch trước khi thao tác ref.
- **Rào cản:** Script phải trả về exit code 0 trước khi chuyển sang Giai đoạn 2.

### Giai đoạn 2: Cảnh vệ Bảo mật (Watchmen Zero-Trust)
- **Hành động:** Đọc và thực thi hướng dẫn tại `.agent/skills/watchmen-sync-guardian/SKILL.md`.
- **Mục đích:** Bơm các đoạn mã chống mất trí nhớ (Anti-Amnesia hooks) vào script.

### Giai đoạn 3: Thanh tẩy Bóng ma & Dọn dẹp Không gian (Ghost File & Workspace Hygiene)
- **Hành động:** Đọc và thực thi hướng dẫn tại `.agent/skills/ghost-file-guardian/SKILL.md` và `.agent/skills/workspace-hygiene-guardian/SKILL.md`.
- **Lệnh thực thi:**
  ```bash
  bash .agent/scripts/ghost-file-buster.sh src/ prisma/ server/ tests/
  python3 .agent/scripts/workspace-janitor.py --auto-clean --enforce-structure
  ```

### Giai đoạn 4: Cài đặt Môi trường (Dependencies)
- **Hành động:** Kiểm tra nếu tồn tại `package.json`, tự động chạy `pnpm install --frozen-lockfile --prefer-offline` để chuẩn bị môi trường `node_modules` sẵn sàng cho worktree mới.
- **Lệnh thực thi:**
  ```bash
  if [ -f "package.json" ]; then
    echo "📦 [WORKTREE-INIT] Cài đặt dependencies môi trường (pnpm install)..."
    pnpm install --frozen-lockfile --prefer-offline
  fi
  ```

### Giai đoạn 5: Hoàn tất
- Thông báo cho User bằng một Alert (Khối màu xanh lá):
  > [!TIP]
  > **✅ Môi trường Worktree đã hoàn tất Khởi tạo!**
