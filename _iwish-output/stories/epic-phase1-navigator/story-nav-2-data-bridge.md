# Story: Navigator Data Bridge & Sync Engine (NAV-2)

## Status: Todo
## Assignee: Vegeta
## Priority: P0
## Depends On: STORY-NAV-1

---

## Context
Để giữ cho Navigator luôn đồng bộ với "Source of Truth" mà không làm vỡ cấu trúc HTML, chúng ta cần một cơ chế truyền dẫn dữ liệu (Data Bridge).

## Acceptance Criteria
- [ ] Xây dựng file `_iwish-output/navigator-data.js` chứa cấu trúc JSON cho toàn bộ Phase 1.
- [ ] `idea-navigator.html` phải đọc dữ liệu từ `navigator-data.js` và render vào đúng các section tương ứng.
- [ ] Phát triển script `scripts/sync-navigator.sh` (hoặc logic tương đương trong Agent) để trích xuất nội dung từ các file `.md` và cập nhật vào `navigator-data.js`.
- [ ] Hỗ trợ cập nhật từng phần (incremental update) để tránh việc ghi đè toàn bộ dữ liệu.

## Technical Tasks
- [ ] [NEW] `_iwish-output/navigator-data.js`
- [ ] [NEW] Logic `loadData()` trong `navigator-main.js`
- [ ] [NEW] Sync logic cho các Agent.

## Definition of Done (DoD)
- Khi thay đổi nội dung trong một file `.md` (vd: brainstorming.md) và chạy lệnh sync, Dashboard HTML phải hiển thị nội dung mới ngay lập tức.
