# Epic: Superpowers Framework Absorption (Surgical Merge)

## Epic ID: SP-ABSORB
## Status: Draft
## Priority: High
## Source: [Gap Analysis](file:///Users/hatrang20061988/.iwish-dragonball/gap-analysis/superpowers_skill_analysis.md)

---

## Objective

Phẫu thuật cắt ghép (Surgical Merge) các DNA tinh hoa nhất từ framework `obra/superpowers` vào hệ sinh thái I-Wish-Dragonball. Mục tiêu là nâng cao kỷ luật thực thi, chất lượng review, và quy trình brainstorming mà KHÔNG gây token bloat hoặc làm mất tính linh hoạt hiện có.

## Phạm vi (Scope)

### Trong phạm vi (IN):
- Nhúng "Verification Before Completion" vào Pivot Guardian
- Nhúng "Don't Trust The Report" vào `/code-review` workflow
- Chuẩn hóa Escalation Protocol cho toàn bộ I-Wish Agents
- Nhúng Bisection Search + Git Worktrees vào Day-2 Ops
- Nhúng TDD-for-Prompts + CSO vào Capability Forging system
- Nhúng 2-3 Approaches Rule, Quick Design Check, YAGNI Challenge, Visual Routing vào Brainstorming/Socratic Review
- Audit lại toàn bộ `description` metadata của I-Wish skills/workflows

### Ngoài phạm vi (OUT):
- Import nguyên bộ Subagent Triad framework (quá tốn token)
- Hard-gate "cấm code trước design" kiểu Superpowers (quá cứng cho I-Wish)
- TDD Iron Law cho UI/UX tasks
- Visual Companion browser server (I-Wish đã có Stitch MCP)

## Acceptance Criteria (Epic Level)
- [ ] Pivot Guardian từ chối mọi báo cáo hoàn thành thiếu evidence
- [ ] `/code-review` workflow chứa directive "Don't Trust The Report"
- [ ] Tất cả I-Wish agents sử dụng Escalation Protocol chuẩn hóa
- [ ] `/fix-bug` tích hợp Bisection Search pattern
- [ ] `/create-capability` và `/enhance-capability` có bước Adversarial Authoring + CSO audit
- [ ] Socratic Review Gate 0 bắt buộc 2-3 approaches + YAGNI Challenge
- [ ] Vegeta/Songoku có Quick Design Check trước khi code task nhỏ
- [ ] Gotenks workflow có Visual Routing logic

---

## Stories

### Story SP-1: Verification & Trust — Hardening Pivot Guardian & Code Review
### Story SP-2: Escalation Protocol — Chuẩn Hóa Giao Tiếp Liên Agent
### Story SP-3: CSO & Adversarial Authoring — Nâng Cấp Capability Forging
### Story SP-4: Brainstorming Enhancement — 2-3 Approaches, YAGNI Challenge & Visual Routing
### Story SP-5: Day-2 Operations — Bisection Search & Git Worktrees

---

## Dependencies
- Pivot Guardian skill: `.agent/skills/pivot-guardian/SKILL.md`
- Socratic Review skill: `.agent/skills/socratic-review/SKILL.md`
- Code Review workflow: `.agent/workflows/iwish-bmm-code-review.md`
- Fix Bug workflow: `.agent/workflows/fix-bug.md`
- Create Capability workflow: `.agent/workflows/create-capability.md`
- Enhance Capability workflow: `.agent/workflows/enhance-capability.md`
- Brainstorming workflow: `.agent/workflows/iwish-brainstorming.md`
- Gotenks workflow: `.agent/workflows/gotenks.md`

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Over-constraining Vegeta/Songoku flow | Quick Design Check là SOFT gate, không phải hard block |
| YAGNI Challenge gây friction với user | AI chỉ challenge, KHÔNG tự cắt scope — user có quyền quyết định cuối |
| CSO audit scope quá lớn | Ưu tiên audit top-20 skills/workflows được dùng nhiều nhất trước |
| Escalation Protocol bị ignore | Nhúng vào core agent prompt, không chỉ documentation |
