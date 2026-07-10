---
name: 'brainstorm'
description: 'Use when the user wants to generate new ideas, explore product directions, or structure a brainstorming session.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **ANTI-SYCOPHANCY PREAMBLE (MANDATORY):**
> Before ANY brainstorming interaction, you MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md`. Every idea MUST be stress-tested with at least 1 Pushback Pattern. Banned Phrases are STRICTLY FORBIDDEN. Constructive Skepticism is the default posture.
> 
> **SOCRATIC REVIEW PRE-FLIGHT GATE (MANDATORY):**
> You MUST use `view_file` to load `/.agent/skills/socratic-review/SKILL.md` and execute Gate 0 (`discovery` mode) to stress-test the core strategy and trade-offs before finalizing the brainstorming session.

## Process Flow

### 1. Intake & Complexity Score (CS):
    *   Yêu cầu người dùng mô tả ý tưởng/vấn đề.
    *   Thực hiện tính toán CS (1-5) dựa trên: Kỹ thuật, Dữ liệu, UI/UX, và Rủi ro.
    *   **VALIDATION:** Nếu CS không phải là số 1-5 hoặc không xác định được, mặc định đặt **CS = 5** (Hard Gate) để đảm bảo an toàn kiến trúc.
    *   **Unknowns Gate (Scope Expansion):** 
        - Load `unknowns-scanner` skill.
        - Run with: phase=discovery, scope=macro, depth=quick, tools=competitive-blindspot
        - Surface Adjacent Spaces to Explore (indirect competitors, adjacent markets).
        - If hidden complexity is detected by the scanner, ADJUST the CS upward before routing.
    *   Nếu **CS ≤ 2**: Kích hoạt `quick-design-check.md`.
    *   Nếu **CS > 2**: Bắt buộc kích hoạt `idea-hardening/SKILL.md`.

### 2. Discovery & Hardening
- **Explore Context:** Check existing code, docs, and patterns.
- **Apply `idea-hardening` Skill:**
  - Mandatory 2-3 Approaches.
  - YAGNI Challenge-back.
  - Visual Routing (prefer HTML/Mermaid for conceptual choices).

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/_iwish/core/workflows/brainstorming/workflow.md, READ its entire contents and follow its directions exactly!

> [!IMPORTANT]
> **NAVIGATOR GUARDIAN SYNC (MANDATORY):**
> Upon completing the brainstorming session and outputting any files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
