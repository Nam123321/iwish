# ADR-001: Data Workflow Architecture — 2-Tier Integration

- **Status:** Approved
- **Date:** 2026-04-01
- **Decision By:** Master Roshi Council (6/6 unanimous)
- **Participants:** Kira++ (Data Architect), Shinji (Data Strategist), Quinn/Tien-Shinhan (QA), Hit (Edge Case Guardian), Songoku (AI Engineer), Vegeta (Developer)

## Context

Khi tích hợp Kira++ (Data Architect), Shinji (Data Strategist), và Quinn (QA) vào BMAD workflow, cần quyết định:
- **Khi nào** chạy data analysis (Phase 3 vs Phase 4)?
- **Scope** nào (cross-epic vs per-story)?
- **Feedback loop** khi code-review phát hiện lệch?

## Decision

### 1. Tier 1: Lightweight Tags (trong create-epics-and-stories, Phase 3)
- Chạy inline scan nhẹ trong `step-03-create-stories.md` Section 5c
- Output: `[DATA:]`, `[FLOW-OUT:]`, `[FLOW-IN:]`, `[SEED:]`, `[KB-SYNC:]`, `[MANUAL-TEST]` tags
- Không load agent persona files — chỉ dùng embedded checklist

### 2. Cross-Epic Map (1 lần duy nhất, Phase 3)
- Chạy SAU khi tất cả epics hoàn thành via `/create-data-overview`
- Output: cross-epic dependency map + conflict resolution + Mermaid diagram
- Includes cả model relationships (Kira++) và event flows (Shinji)

### 3. Per-Story Data Spec (Phase 4, mỗi story)
- Gọi `/create-data-spec` trước khi code, SAU `/create-ui-spec`
- PHẢI reference cross-epic map để phát hiện conflict
- Output: detailed model spec, fields, indexes, seed data cho story đó

### 4. Code-Review Validation (Phase 4, mỗi story)
- `/code-review` thêm mandatory checklist: data-spec compliance + DB guardian
- Nếu code lệch data-spec → **BLOCKER** — không approve cho tới khi backward update

### 5. Backward Update Loop (khi code-review phát hiện lệch)
- Fix code → update cross-epic map + epic data-arch
- **Max 1 vòng** per review cycle
- Nếu update tạo conflict mới → **escalate to user**
- Phân biệt: schema change (Kira++) vs flow change (Shinji)

## Lifecycle Diagram

```
Phase 3:  create-epics → Tier 1 tags → Cross-Epic Map (1 lần)
Phase 4:  /create-story → /create-ui-spec → /create-data-spec → /Vegeta-story → /code-review
                                                                                     ↓
                                                                              Data-spec valid?
                                                                              ✅ → Approved
                                                                              ❌ → BLOCKER → Backward Update → Re-review (max 1)
                                                                                                                    ❌ → Escalate to User
```

## Conditions (từ phản biện)

| Condition | Source | Rationale |
|-----------|--------|-----------|
| Backward update = BLOCKER | Vegeta, Quinn | Không optional, phải enforce |
| Max 1 backward update per cycle | Hit | Tránh infinite loop |
| Staleness warning (>5 stories) | Hit | Cross-epic map có thể outdated |
| Phân biệt schema vs flow update | Shinji | Đúng ownership domain |
| AI spec coverage in data-spec | Songoku | Nếu story có `[KB-SYNC:]` |

## Consequences
- Cross-epic map là architectural blueprint — chạy 1 lần, updated khi cần
- Per-story data-spec luôn fresh và chi tiết
- Code-review trở thành enforcement point cho data integrity
- Zero untracked schema/event changes nhờ backward update BLOCKER
