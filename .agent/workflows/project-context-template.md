---
project_name: '{{project_name}}'
user_name: '{{user_name}}'
date: '{{date}}'
sections_completed: ['technology_stack']
existing_patterns_found: { { number_of_patterns_discovered } }
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

_Documented after discovery phase_

## Critical Implementation Rules

### 🌐 Global Pattern Synchronization
- **Trigger**: When the user requests to "apply this pattern to the whole project", "use this globally", "áp dụng pattern này cho toàn dự án", "cách này cho toàn dự án" or any similar phrasing during a session.
- **Action**: You MUST immediately consult `project-context.md`. If the requested pattern or architectural rule is not already documented there, you MUST update `project-context.md` to ensure the pattern is preserved and automatically applied to all future stories and components. Do not rely on session memory for global rules.

### 🛡️ Architecture Guardian (File Length & Modularity)
- **Hard Limit**: No source code file (e.g., JS, TS, PHP, Python) should exceed the **300-500 lines threshold** unless it is strictly auto-generated (like Prisma clients). 
- **Modularity**: You MUST strictly adhere to Separation of Concerns (SoC). Never write business logic inside entry points like `server.js` or `app.js`. 
- **Action**: Follow the "Make it work, Make it right" principle. If your feature implementation pushes a file past this threshold, you may finish the current functional implementation to ensure tests pass. However, you MUST trigger a `/refactor` to split the file into smaller modules **before** concluding the story or passing it to code review.

### 📁 Standard Phase & Folder Mapping (VERY IMPORTANT)

To prevent agents from hallucinating directories or paths, you MUST strictly adhere to the following mapping between workflow Phases and output folders on disk. Never use natural language phase names to construct directory names (e.g. do not create "2. Domain & Technical Research" or "3. Product Requirements" folders).

| Giai đoạn quy trình (Phase) | Thư mục lưu trữ chuẩn trên đĩa | Lệnh slash command tương ứng | Outputs chính |
| :--- | :--- | :--- | :--- |
| **Phase 1: Idea Discovery** | `_iwish-output/1. Idea Discovery/` | `/idea-discover`, `/brainstorm`, `/idea-challenge` | `1.1. idea-discovery.md`, `1.2. idea-bank.md`, `1.3. idea-challenge.md` |
| **Phase 2: Research** | `_iwish-output/1. Idea Discovery/1.4. research/` | `/research` (market, competitor, domain, tech) | các file nghiên cứu `competitor-research.md`..., `project-context.md` |
| **Phase 3: Product Planning** | `_iwish-output/2. Product Planning/` | `/plan`, `/make-ui-spec` (UX Design) | `2.1. product-brief-or-prd.md`, `2.2. database-spec.md`, `2.3. ui-ux-spec.md`, `2.4. epics-and-stories.md`, master `DESIGN.md` |
| **Phase 4: Development** | `_iwish-output/3. Development/` | `/make-story`, `/make-ui-spec` (Story), `/make-data-spec`, `/code` | Cấu trúc cây `1. Epic & Story/...`, `2. Bug Report/...`, `sprint-status.yaml`, `PER-[name].md` |
| **Phase 5: Verification & Release** | `_iwish-output/4. Verification & Release/` | `/review`, `/canary`, `/retro` | `4.1. walkthrough.md`, `4.2. merge-report.json`, `4.3. retrospective.md` |

Every artifact must be written exactly into these folders. Dynamic or dated filenames for research reports are forbidden; write them directly to static names (e.g., `market-research.md`, `competitor-research.md`).

## 🎨 Design-First Development (Design System)

- **ALL frontend pages and workflows MUST follow the Design-First playbook using the user-selected/configured design tool (Stitch, Figma, Claude Design, Canva, etc.).**
- **Token Mapping**: Use the design system tokens (e.g. `var(--admin-*)` for Admin portal) instead of hardcoded values.
- **Icon Strategy**: Follow the defined icon strategy for the designated design tool.
- **Visual Verification**: Review visual regression comparisons carefully against the approved mockup/design renders.

## 🔄 Process-Based Epic & Story Development (Standard Flow)

- **Triggers**: When the user uses terms like *"phát triển epic và story theo quy trình"*, *"go ahead với story"*, *"dev story"*, *"deploy story/ epic"*, *"chạy story"*, *"triển khai epic/story"*, etc.
- **Workflow Pipeline**:
  1. `/make-story` -> Initial story specification.
  2. `/make-ui-spec` (if frontend/UI required) AND `/make-data-spec` (if database/API required).
  3. **Design Scoring**: Score the UI/UX complexity to see if a design asset needs to be generated on design tools (Stitch, Figma, Claude Design, Canva, or user-configured tools).
  4. **Generate Design**: Create visual design draft for user review.
  5. **Implementation (`/code`)**: Code the feature after specification and design approval.
  6. **Quality Gate (`/review`)**: Audit the code and run quality verification checks.
- **Pause & Resume**: Whenever user input, feedback, or approval is required (e.g., spec reviews, design approvals, or code review findings), the agent **MUST automatically pause (Pause)**. Once the user replies or approves, the agent **MUST automatically resume the flow** from the next sequential step.
- **Mandatory Spec Synchronization during Planning & Course Correction**: Whenever the user adds new requirements to an in-flight or completed story, or when a course correction/pivot is requested:
  - When entering `planning_mode` or creating/updating `implementation_plan.md`, the agent **MUST** proactively review all related system specification documents (PRD, UI Spec, Data Spec, and FeatureGraph) to determine if they need to be updated to ensure synchronization.
  - You **MUST** add a dedicated "Spec Reconciliation & Synchronization" section or task block inside the proposed changes of the `implementation_plan.md` identifying exactly which spec files (e.g. `PRD.md`, `ui-spec.md`, `data-spec.md`) will be updated.
  - When execution starts, the agent **MUST** update those specifications first before writing/changing code, and then run `iwish reconcile-change` to log the sync.
  - Never skip this check even if the change seems minor or localized.

## 🔔 Context Drift Detection (Auto-Audit on Update)
- **Trigger**: Khi agent bắt đầu session mới, kiểm tra git hash của `project-context.md`.
- **Action**:
  - Chạy `git log -1 --format=%H -- project-context.md` để lấy hash hiện tại.
  - So sánh với `last_audited_hash` trong `_iwish/runtime/.context-audit-state.json`.
  - Nếu hash khác nhau → chạy `git diff` để xác định thay đổi.
  - Kiểm tra `## 📋 Changelog` section — nếu có entry mới với `remediation` → ưu tiên chạy theo đó.
  - Nếu không có changelog entry → agent tự phân tích diff và đề xuất audit scope.
  - **THÔNG BÁO user** và **CHỜ approve** trước khi chạy audit.
  - Sau khi audit xong → cập nhật `.context-audit-state.json`.
- **QUAN TRỌNG**: Agent KHÔNG ĐƯỢC tự sửa data mà không có user approval.

---

## 📋 Changelog (Optional)

Section này ghi nhận các thay đổi rule quan trọng kèm hướng dẫn remediation cụ thể. Agent sử dụng section này kết hợp với git hash tracking để phát hiện và xử lý thay đổi.

> Khi thêm rule mới phức tạp, maintainer **NÊN** (không bắt buộc) thêm entry vào đây để agent biết chính xác cần audit gì.

### v1.0.0 — {{date}}

| Rule | Type | Summary | Audit Scope | Remediation |
|:---|:---|:---|:---|:---|
| _Chưa có entry_ | — | — | — | — |
