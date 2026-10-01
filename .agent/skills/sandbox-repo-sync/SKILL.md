---
name: sandbox-repo-sync
description: "T\u1EF1 \u0111\u1ED9ng c\u1EADp nh\u1EADt, \u0111\u1ED3ng b\u1ED9 m\xE3\
  \ ngu\u1ED3n v\xE0 re-index kho ki\u1EBFn th\u1EE9c AI Engineering (ai-engineering-from-scratch)"
version: 1.0.0
tags:
- sandbox
- git-sync
- ai-engineering
- routing-index
- zero-trust
---
# Sandbox Repository Sync (`sandbox-repo-sync`)

## 🎯 Mục Đích
Skill này chịu trách nhiệm duy trì tính cập nhật (freshness), toàn vẹn dữ liệu (integrity) và phòng chống rủi ro chuỗi cung ứng cho kho kiến thức cục bộ `ai-engineering-from-scratch` (523 bài học) đặt tại `~/.iwish/sandbox/ai-engineering-from-scratch`.

Được kích hoạt tự động khi `ai-engineering-knowledge-consultant` phát hiện dữ liệu cũ (>7 ngày cảnh báo, >30 ngày chặn), hoặc khi người dùng gõ lệnh `/sync-sandbox` / `/update-sandbox`.

---

## 🛡️ Các Cơ Chế Zero-Trust Category A Bảo Vệ

1. **OS-Level Exclusive Lock (`fcntl.flock`)**:
   - Sử dụng file lock `.ai-engineering-sync.flock` với cờ `LOCK_EX | LOCK_NB`.
   - Ngăn chặn triệt để xung đột ghi (Race Condition) khi nhiều agent hoặc tiến trình cron chạy cùng lúc.
2. **Supply Chain & Conflict Hardening**:
   - Khai báo `GIT_LFS_SKIP_SMUDGE=1` để chống các payload LFS bomb quá tải dung lượng.
   - Sử dụng `git fetch --depth 1 origin main` và `git reset --hard origin/main` (có timeout 30s) thay vì `git pull` mù quáng, tránh treo tiến trình do merge conflict.
3. **Deterministic AST Routing Index Regeneration**:
   - Tự động gọi `python3 .agent/scripts/build-sandbox-routing-index.py` để quét toàn bộ thư mục `phases/` và ánh xạ chính xác số bài học vật lý, ghi nhận Pinned Commit Hash mới nhất vào `routing-index.yaml`.
4. **Post-Sync Citation Verification**:
   - Tự động chạy `validate-citation-integrity.py --mode index-check` để khẳng định 0 bài học mồ côi (orphan ratio = 0%).

---

## ⚡ Hướng Dẫn Thực Thi (Execution Steps)

Khi người dùng hoặc orchestrator yêu cầu đồng bộ sandbox repo:

### Bước 1: Kiểm Tra Độ Cũ (Staleness Audit)
```bash
python3 .agent/scripts/audit-sandbox-staleness.py
```
- Nếu `status: FRESH` (<7 ngày) và người dùng không yêu cầu force sync: Báo cáo trạng thái sạch và hoàn tất.
- Nếu `status: WARN` (>7 ngày) hoặc `status: BLOCK` (>30 ngày): Tiến hành Bước 2.

### Bước 2: Thực Thi Đồng Bộ Sandbox Với OS-Level Lock
```bash
bash .agent/scripts/sync-sandbox-repos.sh
```
- Script sẽ tự động:
  1. Giữ Exclusive Lock.
  2. Shallow fetch và hard reset về `origin/main`.
  3. Rebuild `references/routing-index.yaml` phản ánh chính xác cấu trúc repo mới.
  4. Chạy `validate-citation-integrity.py --mode index-check`.

### Bước 3: Xác Minh Báo Cáo Đồng Bộ
Đọc file báo cáo đồng bộ tại:
`_iwish-output/adhoc-workspace/scratch/sync-report.json`

Báo cáo tóm tắt cho người dùng:
- Commit hash mới nhất (`current_commit`)
- Thời gian thực thi (`duration_seconds`)
- Trạng thái kiểm tra index (`0 orphan lessons`)

---

## 📋 Commands / Triggers
- `/sync-sandbox`: Đồng bộ kho kiến thức sandbox về bản mới nhất trên GitHub.
- `/audit-sandbox`: Kiểm tra độ cũ và tình trạng toàn vẹn của sandbox mà không pull code mới.
