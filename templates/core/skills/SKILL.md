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
| `/Vegeta-story` | When implementing interaction patterns | ✅ MANDATORY |
| `/code-review` | Reviewing user-facing features | ✅ MANDATORY |
| `/simulate-user` | Dedicated user simulation workflow | ✅ MANDATORY |
| `/create-epics-and-stories` | Writing acceptance criteria | ⚡ RECOMMENDED |
| `/Gotenks` | Ideation sessions | ⚡ RECOMMENDED |

---

## 1. REAL-USER Protocol (8 Dimensions)

> 🚨 **MANDATORY:** Every UI spec and user-facing feature MUST be analyzed through ALL 8 dimensions before approval. Skipping any dimension requires explicit justification documented in the spec.

### R — Reality Context (Bối cảnh thực)

```
Trả lời BẮT BUỘC trước khi thiết kế:

BUSINESS CONTEXT (ngành hàng & kênh phân phối):
□ Client đang kinh doanh ngành hàng gì? (thực phẩm tươi sống, FMCG, 
  gia vị, đồ uống, nông sản, hóa mỹ phẩm, khác?)
□ Sản phẩm bán có đặc thù gì? (dễ hỏng, cần bảo quản lạnh, mùa vụ,
  đơn vị tính phức tạp: kg/thùng/bó/con?)
□ Kênh phân phối: bán cho đại lý (B2B), người tiêu dùng (B2C), hay cả hai?
□ Webstore: ai đang dùng? Đại lý đặt sỉ hay người tiêu dùng mua lẻ?
□ Sales App/Web: NVBH đang phục vụ đại lý hay directly serve consumers?

USER CONTEXT (người dùng lúc này):
□ Người dùng đang ở ĐÂU? (ngoài đường, trong kho, nhà bếp, văn phòng?)
□ Đang dùng THIẾT BỊ gì? (điện thoại tay ướt, tablet trong xe tải, PC?)
□ Mức tập trung? (đang multitask? đang gấp? đang relaxed?)
□ MÔI TRƯỜNG? (ồn ào ngoài chợ? yên tĩnh văn phòng? nắng không thấy màn hình?)
```

### E — Emotion & Motivation (Động cơ cảm xúc)

```
□ TẠI SAO mở app LÚC NÀY? 
  → Hết hàng gấp cần đặt? Routine hàng ngày? Boss yêu cầu?
  → Đang browse xem hàng mới? Kiểm tra đơn đã đặt?
  → Lên thực đơn gia đình cho tuần? So sánh giá?
□ Cảm xúc? 
  → Frustrated vì UI phức tạp? Rushed vì khách đang chờ?
  → Relaxed lúc rảnh? Curious khám phá tính năng mới?
□ Kỳ vọng?
  → "Nhanh, chính xác, không cần nghĩ nhiều"
  → "Muốn AI hiểu tôi, đề xuất đúng thứ tôi cần"
```

### A — Action Pattern (Hành vi thực tế — KHÔNG tuyến tính)

```
🚨 CRITICAL: Người dùng KHÔNG BAO GIỜ follow flow designer vẽ.

Patterns thực tế phải simulate:
□ JUMP: User nhảy giữa pages (catalog → orders → catalog)
□ ABANDON: Bỏ giữa chừng, quay lại sau 2 giờ
□ MULTI-TAB: Mở nhiều tab so sánh
□ COPY-PASTE: Paste tin nhắn Zalo/SMS thay vì gõ lại
□ VOICE-FIRST: Nói trước, gõ sau (NVBH ngoài đường)
□ REPEAT: 80% đơn hàng giống tuần trước → "lấy lại đơn cũ"
□ APPEND: "À thêm 2 thùng bia nữa" → thêm vào đơn đã tạo?
□ INTERRUPT: Đang đặt hàng → điện thoại gọi đến → quay lại → state mất?
□ BATCH: Không đặt từng món — muốn đặt cả danh sách 1 lần
```

### L — Language & Literacy (Ngôn ngữ thực tế)

```
□ Tiếng Việt viết tắt: "HH" = Hảo Hảo, "NC" = nước cam, "NM" = nước mắm
□ Emoji trong chat: "🍜 x 5" = 5 thùng mì?
□ Lỗi chính tả: "nước mấm" → nước mắm
□ Giọng vùng miền: "trái" vs "quả", "bao" vs "bịch"
□ Mix: tin nhắn trộn đơn hàng + câu hỏi giá + emoji
□ Số liệu mơ hồ: "vài thùng" = 3? 5? "mấy ký" = bao nhiêu?
□ Context-dependent: "chai nhỏ" nhỏ là bao nhiêu ml?
```

### U — Unexpected Paths (Đường đi không mong đợi)

```
□ Back button giữa chừng → state mất?
□ Xoay ngang/dọc thiết bị → layout vỡ?
□ Double-tap / double-click → duplicate action?
□ Internet chập chờn → retry → duplicate order?
□ App bị kill (OOM, OS) → quay lại → resume from where?
□ Đổi tab browser → SSE stream mất?
□ Multiple devices: bắt đầu trên điện thoại, hoàn tất trên PC
```

### S — Social Context (Bối cảnh xã hội)

```
□ NVBH đang đứng trước mặt khách → cần nhanh, nhìn chuyên nghiệp
□ Client chủ tiệm → khó tính về giá, so sánh, muốn deal tốt
□ Consumer mua cho gia đình → cân nhắc dinh dưỡng, budget, preference
□ Supervisor đang họp → cần summary nhanh, không chi tiết
□ CTV online → đang livestream + nhận order song song
□ MLM/trưởng nhánh → vừa bán hàng vừa quản lý team
```

### E — Edge Behaviors (Hành vi biên)

```
□ Đơn hàng rất lớn (100+ items) → scroll performance? input time?
□ Đơn hàng 1 item → overkill UI? bypass flow?
□ 3 đơn liên tiếp → fatigue, muốn shortcut
□ Sản phẩm hết hàng giữa lúc đặt → UX khi OOS?
□ Giá thay đổi giữa lúc browse và confirm → surprise?
□ Quay lại đơn cũ → "lấy lại đơn tuần trước cho bà Năm"
□ Đặt hàng cho người khác → "đặt cho chi nhánh Bình Dương"
```

### R — Repeat Patterns (Pattern lặp lại)

```
□ 80% đơn hàng giống tuần trước → "reorder" phải là flow #1
□ "Lấy y hệt đơn hôm qua" = use case phổ biến nhất
□ Thứ 2 heading, thứ 6 summary → daily/weekly rhythm
□ Tháng đầu → "Đơn hàng đầu tiên" = onboarding moment
□ Mùa lễ → volume tăng 3-5x → AI phải handle scale
□ Chu kỳ mua hàng: D2/D3 mua theo tuần, consumer mua theo ngày/bữa
```

---

## 2. Persona System

Personas are stored in `{project-root}/.agent/skills/user-simulation-guardian/personas/`.

### Loading Protocol

```
1. Identify which personas are relevant for the feature being analyzed
2. Load MINIMUM 3 personas per feature
3. For each persona, walk through the FULL REAL-USER Protocol
4. Document gaps/conflicts between persona experiences
5. If feature is multi-portal → MUST include personas from EACH portal
```

### Persona Registry

| ID | File | Portal | Type | Priority |
|----|------|--------|------|----------|
| P1 | `tiem-tap-hoa.md` | Webstore | B2B Customer | ⭐ Always |
| P2 | `nvbh-comprehensive.md` | Sales Web/App | B2B/B2C Sales | ⭐ Always |
| P3 | `admin-van-phong.md` | Admin Portal | Internal | When admin features |
| P4 | `supervisor-giam-sat.md` | Admin Portal | Internal | When management features |
| P5 | `consumer-end-user.md` | Webstore | B2C Consumer | ⭐ Always for webstore |

---

## 3. Scenario System

Scenarios are stored in `{project-root}/.agent/skills/user-simulation-guardian/scenarios/`.

### Scenario Selection

```
MANDATORY: Every feature MUST be tested against AT LEAST 2 scenarios.
RECOMMENDED: Cross-test persona × scenario combinations.

Example grid:
┌──────────────┬──────────┬──────────┬────────────┬──────────────┐
│ Persona \     │ Rush     │ Low      │ First-time │ Meal         │
│ Scenario     │ Hour     │ Connect  │ User       │ Planning     │
├──────────────┼──────────┼──────────┼────────────┼──────────────┤
│ Chủ tiệm     │ ✅ Must  │ ⚡ Should│ ⚡ Should  │ ❌ N/A       │
│ NVBH         │ ✅ Must  │ ✅ Must  │ ⚡ Should  │ ❌ N/A       │
│ Consumer     │ ⚡ Should│ ⚡ Should│ ✅ Must    │ ✅ Must      │
│ Admin        │ ❌ N/A   │ ❌ N/A   │ ⚡ Should  │ ❌ N/A       │
│ Supervisor   │ ⚡ Should│ ❌ N/A   │ ❌ N/A     │ ❌ N/A       │
└──────────────┴──────────┴──────────┴────────────┴──────────────┘
```

---

## 4. Feature Validation Gate

> 🚨 **This gate BLOCKS approval of any UI spec or feature that only has linear-flow thinking.**

Load checklist from `{project-root}/.agent/skills/user-simulation-guardian/checklists/feature-validation.md`.

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

### In `/Vegeta-story` (Step 2 — after loading story)
```
CHECK: If story has UI components:
→ Load user-simulation-guardian SKILL
→ Reference persona files for the target portal
→ Validate interaction patterns against REAL-USER A-dimension
```

### In `/code-review` (Step 3 — adversarial review)
```
CHECK: For user-facing code:
→ Load user-simulation-guardian SKILL
→ Verify edge behaviors (U-dimension) are handled
→ Verify language variants (L-dimension) are handled
→ Add findings to review report
```
