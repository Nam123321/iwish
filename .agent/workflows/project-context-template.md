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

_Documented after discovery phase_

## 🎨 Stitch-First Development (Design System)

- **ALL frontend pages and workflows MUST follow the Stitch-First playbook.**
- **Token Mapping**: Use `var(--admin-*)` to map values instead of hardcoded hex values (Check `stitch-first-playbook.md`). 
- **Icon Strategy**: `@ant-design/icons` for internal content (pages, tables, forms); `lucide-react` for navigation wrappers. Do not mix.
- **Visual Verification**: Review visual regression comparisons carefully against Stitch renders.
