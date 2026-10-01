---
name: User Simulation Guardian
description: >
  1st-Principle User Thinking — REAL-USER Protocol for simulating authentic 
  user behavior across DMS personas. Forces non-linear, context-aware thinking 
  when designing features, reviewing UI specs, and validating interaction patterns.
  Prevents linear/developer-centric design by requiring business context awareness,
  industry-specific scenarios, and multi-persona validation.
---

# 🧑‍💼 User Simulation Guardian SKILL

## Purpose

Forces every feature design and UI spec through the lens of **real users in real contexts** — not the linear flows developers and designers imagine. This SKILL provides:

1. **REAL-USER Protocol** — 8-dimension framework for user simulation
2. **DMS-specific Personas** — 5 personas with sub-types covering B2B, B2C, and hybrid channels
3. **Context Scenarios** — Real-world conditions (rush hour, low connectivity, meal planning)
4. **Feature Validation Checklist** — Gate check that blocks approval of linear-only designs

## When to Use

| Context | Trigger | Required? |
|---------|---------|-----------|
| `/create-ui-spec` | Before finalizing UI spec | ✅ MANDATORY |
| `/dev-agent-story` | When implementing interaction patterns | ✅ MANDATORY |
| `/review` | Reviewing user-facing features | ✅ MANDATORY |
| `/creative-agent` | Ideation sessions | ⚡ RECOMMENDED |

---

## 1. REAL-USER Protocol (8 Dimensions)

> 🚨 **MANDATORY:** Every UI spec and user-facing feature MUST be analyzed through ALL 8 dimensions before approval. Skipping any dimension requires explicit justification documented in the spec.

### R — Reality Context (Bối cảnh thực)

```
Trả lời BẮT BUỘC trước khi thiết kế:

BUSINESS CONTEXT (ngành hàng, kênh phân phối, nhóm đối tượng):
□ Dự án đang kinh doanh trong ngành hàng/lĩnh vực gì? (SaaS, Coworking, Retail, EdTech, Healthcare, khác?)
□ Phân khúc khách hàng mục tiêu là ai? (Đại lý B2B, Người tiêu dùng B2C, Doanh nghiệp lớn, Freelancer, nhóm Focus Group đặc thù?)
□ Kênh phân phối & tương tác: Trực tuyến, trực tiếp, hay hybrid?
□ Portal/ứng dụng: Ai là người dùng trực tiếp của từng màn hình/tính năng?

USER CONTEXT (người dùng lúc này):
□ Người dùng đang ở ĐÂU khi dùng tính năng này? (ngoài đường, trong kho, nhà bếp, văn phòng, phòng hội họp?)
□ Đang dùng THIẾT BỊ gì? (điện thoại tay ướt/bận, tablet di động, PC màn hình rộng?)
□ Mức tập trung? (đang multitask? đang vội/rush-hour? đang thong thả?)
□ MÔI TRƯỜNG? (ồn ào, nắng chói khó nhìn màn hình, văn phòng yên tĩnh?)
```

### E — Emotion & Motivation (Động cơ cảm xúc)

```
□ TẠI SAO mở app LÚC NÀY?
  → Giải quyết sự cố gấp? Routine công việc hàng ngày? Boss yêu cầu báo cáo?
  → So sánh giá/lựa chọn? Đặt dịch vụ/sản phẩm?
□ Cảm xúc của họ?
  → Frustrated (bực bội vì UI chậm/lỗi)? Rushed (áp lực thời gian)?
  → Relaxed (tìm hiểu lúc rảnh)? Curious (khám phá tính năng mới)?
□ Kỳ vọng chính?
  → "Nhanh, chính xác, không lỗi, không cần hướng dẫn"
  → "Muốn hệ thống tự hiểu nhu cầu và gợi ý thông minh"
```

### A — Action Pattern (Hành vi thực tế — KHÔNG tuyến tính)

```
🚨 CRITICAL: Người dùng KHÔNG BAO GIỜ follow flow tuyến tính mà designer vẽ ra.

Các mẫu hành vi thực tế cần giả định:
□ JUMP: User nhảy liên tục giữa các trang/tab để so sánh thông tin.
□ ABANDON: Đang làm dở thì tắt app/khóa màn hình, 2-3 tiếng sau mới quay lại hoàn thành.
□ COPY-PASTE: Copy văn bản từ ứng dụng ngoài (Zalo, SMS, Excel, Email) rồi dán vào thay vì nhập tay từng trường.
□ VOICE-FIRST: Thích dùng giọng nói/tìm kiếm giọng nói hơn gõ chữ (khi đang di chuyển).
□ REPEAT: 80% hành động/đơn đặt hàng là lặp lại đơn cũ hoặc theo thói quen cũ.
□ INTERRUPT: Đang nhập liệu → có cuộc gọi đến/mất mạng đột ngột → quay lại có giữ được state không?
□ BATCH: Thích thao tác hàng loạt (batch action) thay vì bấm từng dòng.
```

### L — Language & Literacy (Ngôn ngữ thực tế)

```
□ Từ viết tắt chuyên ngành/thói quen của tập khách hàng này (ví dụ: "CK" = chiết khấu, "CR" = conference room, "HD" = hot desk).
□ Lỗi gõ phím/chính tả phổ biến trong tiếng Việt (ví dụ: dấu hỏi/ngã, lỗi Telex).
□ Trộn lẫn ngôn ngữ: Tiếng Anh bồi, từ lóng vùng miền (trái/quả, bao/bịch).
□ Cách ghi số lượng mơ hồ: "cho vài cái", "mấy thùng", "lấy y hệt hôm qua".
```

### U — Unexpected Paths (Đường đi không mong đợi)

```
□ Bấm nút Back vật lý của điện thoại giữa chừng → mất dữ liệu đã nhập?
□ Xoay ngang màn hình đột ngột → UI bị vỡ layout?
□ Double-tap / double-click vào nút Submit → gửi trùng yêu cầu?
□ Mất mạng chập chờn → tự động lưu nháp hay bắt làm lại từ đầu?
```

### S — Social Context (Bối cảnh xã hội)

```
□ Áp lực đồng nghiệp/khách hàng xung quanh (ví dụ: đang check-in cho khách đứng chờ trước mặt).
□ Người kiểm duyệt/sếp đang theo dõi (cần hiển thị tóm tắt trực quan để duyệt nhanh).
□ Áp lực của Focus Group hoặc Stakeholder liên quan.
```

### E — Edge Behaviors (Hành vi biên)

```
□ Dữ liệu cực lớn (100+ dòng, text siêu dài) → hiệu năng render và scroll?
□ Dữ liệu trống / 1 món → UI có bị trống trải quá mức?
□ Thao tác liên tiếp nhiều lần gây mỏi mắt/nhàm chán → cần phím tắt (shortcuts).
```

### R — Repeat Patterns (Pattern lặp lại)

```
□ Daily/Weekly Rhythm: Các tác vụ lặp lại theo chu kỳ ngày/tuần/tháng của người dùng.
□ Thói quen "lấy lại cấu hình cũ" hoặc "sử dụng lịch sử gần nhất".
```

---

## 2. Persona System

### Scanning & Loading Protocol

🚨 **DO NOT use hardcoded personas.** The agent MUST scan the target project dynamically to extract target users/customers:
1. **Locate Target Users**: Scan `📄 2. Product Planning/2.1. product-brief-or-prd.md` (or `prd.md`/`product-brief.md`), `📄 1. Idea Discovery/` files, or `📄 project-context.md` for headings like `## Target Users`, `## Target Customers`, `## Focus Groups`, or `## Customer Persona`.
2. **Read Specific Persona Files**: Check if custom personas are saved under `{project-root}/.agent/skills/user-simulation-guardian/personas/` or `{project-root}/docs/personas/`.
3. **Select Minimum 3 Personas**: Make sure the selected personas cover the key customer segments and portals involved in the feature.
4. **Fallback Zero-Shot Deduction**: If no project-specific target users are defined yet in the documentation, deduce the user roles based on the target portals and features, and ask the user for confirmation.

### Reference Examples (B2B Retail / Grocery DMS Domain Only)
*Use these only as guidance for how to build personas for your specific project domain:*
- **Chủ tiệm (B2B Customer):** Nhạy cảm giá, thích reorder nhanh, viết tắt nhiều, dùng mạng 3G yếu ngoài chợ.
- **NVBH (B2B Sales Agent):** Thường xuyên di chuyển ngoài đường, cần voice-first hoặc thao tác 1 tay, multitask.
- **Consumer (B2C End-user):** Mua lẻ, quan tâm tới giao diện đẹp, budget, gợi ý món ăn, dễ sử dụng không cần training.
- **Admin/Supervisor (Internal roles):** Quản lý vận hành, cần xem báo cáo nhanh, thao tác hàng loạt bằng bàn phím PC, ít thời gian.

---

## 3. Scenario System

Scenarios are stored in `{project-root}/.agent/skills/user-simulation-guardian/scenarios/`.

### Scenario Selection

MANDATORY: Every feature MUST be tested against AT LEAST 2 scenarios relevant to the project's domain.

1. **Stress Scenario**: A scenario where the user/customer is under pressure (e.g., rush-hour bookings, low-connectivity offline operations, high-traffic sales events).
2. **Onboarding / First-Time Customer Scenario**: A scenario testing how a first-time user navigates the flow without prior training.
3. **Routine Scenario**: Typical daily or weekly usage.

*Example Grid (Adapt dynamically to your project's customer segments and scenarios):*
- Build a custom evaluation grid comparing your project's target customers (e.g., Tenant, Landlord, Admin) against domain-specific scenarios (e.g., lease expiration, system offline, onboarding).


---

## 4. Feature Validation Gate

> 🚨 **This gate BLOCKS approval of any UI spec or feature that only has linear-flow thinking.**

> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> You MUST use `view_file` to load `/.agent/fragments/feature-validation.md` before proceeding.

### Quick Gate Check (for inline use)

```
PASS/FAIL criteria — ALL must pass:
□ ≥3 personas simulated with documented findings
□ ≥2 scenarios cross-tested
□ Business context (R-dimension) explicitly documented
□ At least 1 non-linear path identified and addressed
□ Copy-paste/voice path designed (not just click path)
□ "Reorder/repeat" path designed for applicable features
□ Edge behaviors (very large, very small, interrupted) addressed
□ Language variants documented (viết tắt, emoji, vùng miền)
```

---

## 5. Output Format

After running user simulation, produce this output for inclusion in UI spec or story:

```markdown
### 🧑‍💼 User Simulation Report

**Feature:** [Feature name]
**Date:** [Date]
**Personas tested:** P1 (Chủ tiệm), P2 (NVBH-CTV), P5 (Consumer)
**Scenarios tested:** Rush Hour, Meal Planning

#### Business Context
- **Ngành hàng:** [e.g., Thực phẩm tươi sống + FMCG]
- **Kênh:** [B2B + B2C]
- **Portal user type:** [Webstore: B2C consumers + B2B dealers]

#### Findings

| # | Persona | Scenario | Gap Found | Severity | Resolution |
|:-:|---------|----------|-----------|----------|------------|
| 1 | Consumer | Meal Plan | Chat-to-Order cannot handle "thực đơn 3 ngày" | HIGH | Add meal-plan intent to NLP |
| 2 | NVBH-CTV | Rush Hour | CTV livestream + receiving orders simultaneously | MEDIUM | Add batch order mode |
| 3 | Chủ tiệm | Repeat | No "reorder" shortcut | HIGH | Add reorder button |

#### Non-Linear Paths Identified
1. [Path description + how it's handled]
2. [Path description + how it's handled]

#### Gate Result: ✅ PASS / ❌ FAIL (with reason)
```

---

## 6. Integration Hooks

### In `/create-ui-spec` (Step N — before finalization)
```
GATE: Load user-simulation-guardian SKILL
→ Run REAL-USER Protocol against the UI spec
→ Minimum 3 personas + 2 scenarios
→ Append User Simulation Report to UI spec
→ FAIL = do not approve UI spec
```

### In `/dev-agent-story` (Step 2 — after loading story)
```
CHECK: If story has UI components:
→ Load user-simulation-guardian SKILL
→ Reference persona files for the target portal
→ Validate interaction patterns against REAL-USER A-dimension
```

### In `/review` (Step 3 — adversarial review)
```
CHECK: For user-facing code:
→ Load user-simulation-guardian SKILL
→ Verify edge behaviors (U-dimension) are handled
→ Verify language variants (L-dimension) are handled
→ Add findings to review report
```
