# Story: Celestial One-Page Template (NAV-1)

## Status: Ready
## Assignee: Vegeta (UI/UX specialist co-pilot)
## Priority: P0

---

## Context
Chúng ta cần một giao diện "đẳng cấp" để trình bày toàn bộ thành quả của Phase 1. Giao diện này phải vượt xa các file Markdown thông thường, tạo cảm giác chuyên nghiệp và có chiều sâu.

## Acceptance Criteria
- [ ] Tạo file `_iwish-output/idea-navigator.html` với cấu trúc One-Page scroll.
- [ ] Thiết kế theme "Celestial Realm": White background, Deep Navy/Gold accents, Glassmorphism panels.
- [ ] Tích hợp `marked.js` từ CDN để render Markdown nội bộ.
- [ ] Sidebar/Floating Menu để điều hướng nhanh giữa các phần: Vision, Brainstorming, Research, Brief.
- [ ] Hiệu ứng Scroll-Reveal cho các component.
- [ ] Header hiển thị Project Metadata (Name, Status, Hardening Score).

## Technical Tasks
- [ ] [NEW] `_iwish-output/idea-navigator.html`
- [ ] [NEW] `_iwish-output/assets/navigator-styles.css`
- [ ] [NEW] `_iwish-output/assets/navigator-main.js` (cơ chế render cơ bản)

## Definition of Done (DoD)
- Giao diện hiển thị đúng layout Celestial khi mở file HTML.
- Markdown render đẹp mắt, không bị lỗi font hay lề.
- Có thể cuộn mượt mà giữa các section.
