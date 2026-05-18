# STORY-HSEA-1.4: [COMPLETED] Implement Auto-Immune System (Bug-Driven Knowledge Extraction)

## Epic
EPIC-HSEA: Hermes + Self-Evolution Absorption

## Goal
Tích hợp cơ chế "Miễn dịch chéo" (Cross-Immunity) và "Tiến hóa tự động" (Self-Evolution) vào hệ sinh thái I-Wish, giúp các Agent học hỏi từ bug và tự động tối ưu hóa các quy tắc phòng vệ để tránh lặp lại lỗi.

## Tracer Bullet (Vertical Slice)
Bug fixing workflow (`/fix-bug`) -> `scripts/hotspot-calculator.js` calculates bug/complexity score -> if score exceeds threshold -> Trigger `/enhance-capability` to create a new Draft Skill or update existing Project Memory.

## Acceptance Criteria
- **AC1:** Tạo script `hotspot-calculator.js` để tính `hotspot_score` dựa trên độ phức tạp và file thay đổi.
- **AC2:** Cập nhật `Pivot Guardian` skill để yêu cầu Agent chạy mandatory pre-edit check dùng `hotspot-calculator.js` trước khi sửa file.
- **AC3:** Cập nhật workflow `/fix-bug` (Phase 7) thêm bước "Lesson Extraction", chạy hotspot calculator, và cảnh báo Auto-Immune.
- **AC4:** Tích hợp quy trình để tự động kích hoạt tiến hoá skill qua workflow `/enhance-capability`.

## Plan Tune Complexity Score
- AC Volume: 4 ACs (+0)
- Data Model: N/A (+0)
- UI Surface: N/A (+0)
- Cross-Domain: No (+0)
- Flow Complexity: Script + Workflow modification (+0)
- Test Burden: No (+0)
**CS = 0** -> ✅ **OK**

## AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Create Hotspot Calculator | T1: Implement `hotspot-calculator.js` | ST1.1: Logic, ST1.2: Threshold | ✅ |
| AC2 | Pivot Guardian Update | T2: Edit `pivot-guardian/SKILL.md` | - | ✅ |
| AC3 | `/fix-bug` Update | T3: Edit `fix-bug.md` Phase 7 | - | ✅ |
| AC4 | `/enhance-capability` Update | T4: Edit `enhance-capability.md` | - | ✅ |

## Dev Notes
- Hotspot score >= 30 or bug_count >= 3 triggers the Draft Skill creation.
- Check `scripts/hotspot-calculator.js` for the exact calculation logic.
- Avoid modifying core workflow logic, inject into Phase 7 of `/fix-bug` as a trailing hook.

## QA Simulator Guardian Scorecard
| Axis | Score (1-10) | Evaluation Notes |
|------|--------------|------------------|
| 1. State Integrity | 9/10 | Scripts are stateless; workflows trigger naturally. |
| 2. Error Boundary | 9/10 | Fail-safes built into the hotspot calculator. |
| 3. Concurrency | 10/10 | No concurrent collision risks. |
| 4. Security/Access | 10/10 | Internal CLI operation only. |
| 5. Performance | 8/10 | Local node script execution is fast. |
| 6. Edge Cases | 9/10 | Handles non-existent files gracefully. |
| 7. UX Empathy | 9/10 | Alerts the AI cleanly. |
**TOTAL AVERAGE:** 9.14/10 -> PASS
