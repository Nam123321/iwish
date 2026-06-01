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

## 🎨 Stitch-First Development (Design System)

- **ALL frontend pages and workflows MUST follow the Stitch-First playbook.**
- **Token Mapping**: Use `var(--admin-*)` to map values instead of hardcoded hex values (Check `stitch-first-playbook.md`). 
- **Icon Strategy**: `@ant-design/icons` for internal content (pages, tables, forms); `lucide-react` for navigation wrappers. Do not mix.
- **Visual Verification**: Review visual regression comparisons carefully against Stitch renders.
