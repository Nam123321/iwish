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

## 🧠 Prime Directive: Autonomous Instinct Logging

> **CRITICAL RULE — Applies to ALL agents in ALL contexts (including free chat).**

Whenever you help a user fix a bug, correct a mistake, discover a new coding pattern, or learn something new about this project during **any interaction** (formal workflow OR casual chat):

1. **BEFORE ending your response**, append ONE Dense JSONL record to `.agent/memory/instincts.jsonl`:
   ```jsonl
   {"ts":"YYYY-MM-DD","src":"ad-hoc","ctx":"tech,tags","bad":"what was wrong","good":"correct approach","sev":1-5,"file":"affected-file.ts"}
   ```
2. This enables **Whis (Capability Management Master)** to periodically evolve the system's Skills and Workflows based on accumulated learnings.
3. **DO NOT** write instincts as Markdown prose. Use ONLY the Dense JSONL format above. This is machine memory, not human documentation.
