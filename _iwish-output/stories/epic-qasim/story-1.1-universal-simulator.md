---
story_id: "STORY-SIM-1.1"
epic_id: "EPIC-SIM-01"
title: "Phát triển Siêu Prompt Universal QA Simulator (Monolithic)"
status: "READY_FOR_VEGETA"
assignee: "Vegeta"
phase: "forge"

---
# Story 1.1: Phát triển Siêu Prompt Universal QA Simulator (Monolithic)

## 1. Mục tiêu (Objective)
Phát triển một **Independent Monolithic QA Simulator Skill** (`universal-simulator-skill.md`). Kỹ năng này phải chứa đầy đủ định nghĩa nội tại (micro-encyclopedia) về `8-Pillars`, thuật toán nhập vai `REAL-USER`, và giới hạn `Max 3 Rounds` để tự thân nó có thể đánh giá bất kỳ định dạng tài liệu nào (Code, Prompts, UI, Plans) mà không cần phụ thuộc vào hệ sinh thái I-Wish bên ngoài.

---

## 2. Target Users & Personas
- **AI Agents (Host):** Các Agent như Vegeta, Songoku, Krillin sẽ dùng file này để tự đánh giá lại code/prompt của mình trước khi trả cho người dùng.
- **Universal Developers:** Những kỹ sư tải bản trung lập (Agnostic) về và chạy chay trên ChatGPT/Claude Web.

---

## 3. Scope & Phân loại Deliverables
Cổng phân loại của Skill này cần cover chính xác 13 nhóm từ `SKL_Simulator_v1`:
> 1. Skill/Prompts (.md) | 2. Web App/UI | 3. Plans/Roadmap | 4. SOP/Excel | 5. Emails | 6. Chatbots | 7. Landing Pages | 8. Training | 9. Policy | 10. Pitch Deck | 11. Automation Workflow | 12. Wildcard

---

## 4. Technical Constraints & Data Architecture (Cấu trúc Prompt)
Skill file `universal-simulator-skill.md` bắt buộc phải được xây dựng theo kiểu **Nested Context Windows** bằng thẻ XML block để giúp mô hình ngôn ngữ không bị loạn:

```xml
<skill-metadata> YAML Headers </skill-metadata>
<step-0-classification> ... </step-0-classification>
<structural-validation-8-pillars> ... list 8 rules... </structural-validation-8-pillars>
<ux-simulation-real-user> ... list REAL algorithm... </ux-simulation-real-user>
<mental-sandbox-scratchpad> ... rules for <scratchpad> ... </mental-sandbox-scratchpad>
<hybrid-scoring-and-verdict> ... verdict logic ... </hybrid-scoring-and-verdict>
```

---

## 5. Acceptance Criteria (Tiêu chí hoàn thành BẮT BUỘC)

### AC1: Đóng gói toàn phần 8-Pillars (Structural Quality)
- **GIVEN** The AI is evaluating a piece of logic/code/algorithm.
- **WHEN** It reaches the Structural Check step.
- **THEN** The skill prompt MUST instruct the AI to explicitly check via the 8 pillars defined directly in the file:
  1. *Boundary:* Mảng rỗng, Null, Overflow, XSS.
  2. *State:* Race condition, Impossible state, Orphan records.
  3. *Concurrency:* Trạng thái bất quy tắc khi multi-user.
  4. *Data Integrity:* CASCADE Delete, Precision Loss.
  5. *Integration:* API trễ, timeout, 500 error.
  6. *Security:* Tenant isolation leak, Auth bypass.
  7. *Infra:* Memory leak, N+1 Query.
  8. *Business:* Khuyến mãi chồng chéo, logic loop.

### AC2: Đóng gói toàn phần REAL-USER Protocol (UX Empathy)
- **GIVEN** The AI is evaluating a user-facing output (Web App, Chatbot, Landing Page).
- **WHEN** It reaches the UX Empathy Check step.
- **THEN** The skill prompt MUST instruct the AI to simulate UX across 4 dimensions:
  1. *Reality Context:* Môi trường thực tế rườm rà (ví dụ: dùng 1 tay, ánh sáng chói).
  2. *Emotion:* Cảm xúc vội vã, lo âu, bực bội.
  3. *Action Patterns:* Bấm "Back" đột ngột, Double-tap liên tục, Điền form bừa bãi.
  4. *Language:* Thuật ngữ khó hiểu, Call to Action mơ hồ.

### AC3: Guardrails chống Overfitting & Token Waste
- File phải yêu cầu AI **bắt buộc mở thẻ `<scratchpad>`** để tự suy luận và cấm in các bước test cases chi tiết ra màn hình chat.
- Yêu cầu AI chấm dứt giả lập ở **Max 3 Rounds**. 
- Nếu kết quả thay đổi giữa 2 vòng nhỏ hơn `< 0.5` điểm, lập tức cờ `FORCE STOP`.
- Phải kèm theo một bảng Template Output Scorecard cuối cùng (pass >= 8.5).

### AC4: Tương thích Agnostic (Host-Independent)
- Phải có phần "Custom Context Injection": AI phải hỏi User nhập thêm "Knowledge Base" hoặc "Design System" trước khi bắt đầu mô phỏng (nếu chạy ở môi trường ngoài I-Wish).
- Nếu chạy trong I-Wish, AI Host dùng tính năng Auto-Fix qua tool vật lý thay vì chỉ xuất Checklist.

---

## 6. Definition of Done (DoD)
- [ ] File MD được tạo ở `dragonball_distribution/framework-agnostic/universal-simulator-skill.md`.
- [ ] Toàn bộ định nghĩa AC1 (8-Pillars) và AC2 (REAL-USER) được code tay vào skill dưới dạng các `<instruction-blocks>`, không reference file ngoài.
- [ ] Status đổi thành `READY_FOR_VEGETA` (Khởi chạy bằng /Vegeta-story).
