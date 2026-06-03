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
  - You **MUST** add a dedicated "Spec Reconciliation & Synchronization" section or task block inside the proposed changes of the `implementation_plan.md` identifying exactly which spec files (e.g. `PRD.md`, `ui-ux-spec.md`, `database-spec.md`) will be updated.
  - When execution starts, the agent **MUST** update those specifications first before writing/changing code, and then run `iwish reconcile-change` to log the sync.
  - Never skip this check even if the change seems minor or localized.
