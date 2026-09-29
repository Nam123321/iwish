---
name: 'idea-discover'
description: 'Làm rõ ý tưởng thô ban đầu sử dụng bộ khung 5 Lăng Kính (Mom Test & JTBD) để xác định bối cảnh và nỗi đau người dùng trước khi brainstorm.'
---

# Idea Discovery Workflow (`/idea-discover`)

**Goal:** Elicit, validate, and harden a new 0-to-1 product or startup idea before brainstorm, planning, or execution cycles. Structure the conversation with the user around the **5 Lenses of Product Discovery** while strictly adhering to **The Mom Test** principles and triggering necessary **Agent Pushbacks** to filter out weak assumptions.

---

## PREREQUISITES

1. User has a rough idea or goal to build a new product or module.
2. Must be executed **first** as Step 1 before `/brainstorm` or `/idea-challenge` to establish a clean and traceable source of truth.

---

## EXECUTION SEQUENCE

### 1. Structure Elicitation (The 5 Lenses)
Load and read `/.agent/fragments/idea-discovery-framework.md`. Interview the user step-by-step to gather details for each of the 5 Lenses:
1. **🔍 Lens 1: Customer & Context:** Define core target personas, concrete pain points, and current workarounds.
2. **🎯 Lens 2: Problem & Value Prop:** Identify root causes, one-sentence value proposition, and customer definition of success.
3. **🛡️ Lens 3: Competitors & Moat:** List alternatives/competitors, current limitations, and defensive moats (network effects, switching costs, etc.).
4. **🛠️ Lens 4: Execution & MVP Scope:** Call out complex tech requirements, define minimum week-one scope, and identify major failure risks.
5. **📈 Lens 5: Metrics & Growth:** Define primary and secondary success metrics.

### 2. Apply The Mom Test & Pushback Guards
During the dialogue, enforce these golden rules:
- **No speculation:** Do not ask if they *would* buy or use the product. Focus on *past behaviors* and *actual evidence* (budget, time spent).
- **Pushback Triggers:** Actively trigger pushbacks for vague answers, e.g., if target customer is "everyone", if there is "no workaround", or if the MVP scope is too large.

### 3. Generate the Idea Discovery Document
Synthesize the verified details into a structured markdown document and write it to:
`_iwish-output/1. Idea Discovery/1.1. idea-discovery.md`

Use the following template:

```markdown
---
type: I-Wish Idea
title: "[Tên dự án/Ý tưởng]"
description: "[Tuyên bố giá trị độc bản trong 1 câu]"
resource: "file://{project-root}/_iwish-output/1. Idea Discovery/1.1. idea-discovery.md"
tags: ["idea", "discovery"]
timestamp: "[ISO-8601]"
links_to: []
---

# Idea Discovery: [Tên dự án/Ý tưởng]

## 1. Executive Summary & Core Value
- **Core Value Proposition**: [Tuyên bố giá trị độc bản trong 1 câu]
- **Target Persona**: [Ai là người dùng cốt lõi cảm nhận nỗi đau sâu sắc nhất?]
- **The Core Problem**: [Vấn đề thực sự cần giải quyết là gì?]

## 2. Problem & Workaround Analysis
- **Root Cause**: [Nguyên nhân gốc rễ, triệu chứng]
- **Current Workaround**: [Họ đang giải quyết tạm thời bằng cách nào? (Excel, giấy, quy trình thủ công,...)]
- **Why Alternatives Fall Short**: [Tại sao các giải pháp hiện tại chưa đáp ứng tốt?]

## 3. Solution & MVP Scope
- **Proposed Solution**: [Cách giải quyết của chúng ta]
- **MVP Features (Week 1)**: [1-2 tính năng cốt lõi bắt buộc phải có để kiểm chứng]
- **Out of MVP Scope**: [Các tính năng hoãn lại sang Phase 2 (tuân thủ YAGNI)]

## 4. Competitive Moat & Risks
- **Our Moat**: [Lợi thế phòng thủ độc bản (network effects, switching costs,...)]
- **Key Risks & Mitigations**:
  - *Risk 1*: [Mô tả] -> *Mitigation*: [Cách giảm thiểu]

## 5. Success Metrics
- **Primary Metric**: [Chỉ số chính đo lường sự thành công]
- **Secondary Metrics**: [Các chỉ số phụ]

<!-- coaching-notes-stage-1 -->
<!-- Lưu lại các phản biện của Agent và các lựa chọn đã bị User từ chối để giữ ngữ cảnh -->
```

### 4. Direct Handoff
Once the `idea-discovery.md` file is generated, prompt the user with the next logical step:
- **Next Canonical Workflow:** Route to `/brainstorm` to expand on the MVP features and build the Idea Bank.

---

## SUCCESS METRICS
- ✅ Elicited all 5 Lenses from the user.
- ✅ Successfully challenged speculative assumptions and applied Mom Test principles.
- ✅ Structured output saved to `_iwish-output/1. Idea Discovery/1.1. idea-discovery.md`.
