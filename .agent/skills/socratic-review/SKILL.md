---
name: "socratic-review"
description: 'Use when generating an implementation plan to evaluate architectural drift, database migrations, and backward compatibility before execution.'
version: "1.0.0"
author: "I-Wish Architecture Team"
type: "SKILL"
---

# Socratic Review Mode

## 1. Purpose
The Socratic Review Mode is a 4-Gate Quality System that forces users to clarify ambiguities, justify tech-stack choices, and handle edge cases before they solidify into code or documentation. It uses a Progressive Socratic Loop (asking questions one branch at a time) to prevent cognitive overload while ensuring thorough adversarial review.

## 2. Prerequisites
- This skill ASSUMES the agent has the `@.agent/fragments/anti-sycophancy.md` fragment injected.
- `anti-sycophancy.md` provides the **adversarial posture** (Constructive Skepticism).
- `socratic-review` provides the **structured interview protocol** that operationalizes that posture into an interactive loop.

## 3. Modes (The 4 Gates)
When invoking this skill, you must specify the `mode` parameter.

| Mode | Trigger Point | Focus / What to Grill |
|---|---|---|
| `discovery` | Gate 0: `/brainstorming`, `/create-prd`, `/create-architecture` | Strategy, MVP scope, tech stack choice. Why this? Why now? Simplest version? Trade-offs? |
| `business` | Gate 1: `/create-story` | UX flow, AC completeness, **Tracer Bullet (Vertical Slice)** identification, and persona coverage. |
| `technical` | Gate 2: `/Vegeta-story` (Before Implementation Plan) | DB schema, API contracts, **Module Depth (Deletion Test)**, performance, security, and state management. |
| `drift` | Gate 3: Implementation Plan creation (e.g. `/fix-bug`) | Feature Drift detection. If the fix/plan introduces new logic, grill the user on backward syncing to the PRD. |

## 4. Constraints & Rules (MANDATORY)

### Rule 1: Progressive Socratic Loop (Depth-First)
- **DO NOT** output a bulleted list of multiple questions (e.g., 5-10 questions at once).
- You MUST ask a MAXIMUM of **1 to 2 questions** per turn.
- Wait for the user's response. Drill down into their answer before moving to an unrelated branch.

### Rule 2: Question Templates

### 1. 2-3 Approaches (Standard Gate 0)
```markdown
**Option A: [Name] ⭐ (Recommended)**
- **Mô tả:** [1-2 câu]
- **Ưu điểm:** [bullets]
- **Nhược điểm:** [bullets]

**Option B: [Name]**
...
**Option C:** Your own answer → ___
```

### 2. YAGNI Challenge
```markdown
### ⚠️ YAGNI Check
Feature **[X]** có vẻ vượt quá MVP scope. Bạn chắc chắn cần nó ngay bây giờ?

**Option A:** Giữ lại — vì [lý do tiềm năng]
**Option B:** Defer sang Phase 2 — giảm complexity, ship nhanh hơn
**Option C:** Your own answer → ___

> 💡 **Agent rationale:** [tại sao Agent nghĩ đây là scope creep]
```

### Rule 3: Exit Condition & Synthesis
- The loop ends when you are satisfied that the critical risks for the current Gate have been addressed.
- When exiting, you MUST output a **Synthesis Summary** summarizing the decisions made.

### Rule 4: Anti-Overwrite Safety Net
- You are **STRICTLY PROHIBITED** from automatically overwriting `project-context.md`, `PRD`, or Epic/Story files based on the Socratic session.
- You may only **PROPOSE** updates. You must ask: *"Do you want me to backward-sync these decisions into the PRD/Story?"*
- Wait for explicit user `Approve` before modifying files.

### Rule 5: Loop Breaker / Timeout
- If the user fails to provide a substantive answer after 2 iterations of the same question (e.g., replying "I don't know" or ignoring the options), you MUST auto-select the safest proposed option (Option A).
- Log a warning stating: *"Auto-selected Option A due to timeout. Please manually review this decision."*
- Proceed to the next question or exit the loop.

### Rule 6: Empirical Evidence Check (Technical & Drift Gates)
- For `technical` and `drift` gates (Gate 2 & 3), Reviewers MUST ask for empirical evidence according to **Pivot Guardian's Empirical Evidence Gate (§5)**.
- If evidence is fake or missing (e.g., "Code looks good" or no terminal/DevTools log for FE/BE tasks), you MUST score it as FAIL and force the implementer to provide hard evidence.

### Rule 7: Agent Pre-Debate Protocol (Party Mode Integration)
- **Scope Division:** For Epic-level decisions (Gate 0: Discovery), ALWAYS ask the user directly. Zero-to-one strategic decisions require human input.
- **Story-Level Auto-Resolution:** For Story-level gates (Gate 1: Business, Gate 2: Technical, Gate 3: Drift), before asking the user a question, you MUST simulate a 1-round `party-mode` debate internally with other relevant agent personas (e.g., Vegeta, Piccolo, Bulma).
- **Anti-Sycophancy:** The simulated debate MUST follow the `anti-sycophancy` rules (e.g., one agent must play devil's advocate and push back).
- **Context-Backed Consensus:** If the agents reach a consensus *explicitly backed by existing project documentation* (e.g., `project-context.md`, existing PRDs, or reference stories), auto-select that option. Do NOT ask the user.
- **Escalation Trigger:** If the agents cannot reach a context-backed consensus in exactly one round, or if the documentation is ambiguous/conflicting, you MUST escalate the question to the user. Include a brief summary of why the agents conflicted.
- **Decisions Log:** At the end of the Socratic Review session, output a "Decisions Log" summarizing any questions that were auto-resolved by the agents so the user retains visibility.

### Gate 0: Discovery Loop (The "Stop & Think" Phase)
Before proposing any solution, you MUST answer the following questions based on the **Complexity Score (CS)**:

### 🔹 For CS = 3 (Medium Complexity)
- **Core Purpose:** What problem are we *really* solving? (Root cause analysis)
- **Alternative:** What is Option B (the "lesser" or "alternative" path)?

### 🔸 For CS ≥ 4 (High Complexity)
- **YAGNI Check:** Do we *really* need this now? What happens if we don't build it?
- **Debt Check:** What technical debt are we introducing with this approach?
- **Visual Path:** Should we use HTML/Mermaid for conceptual review instead of Stitch UI?
- **Future Impact:** How will this affect other epics/stories? (Reference FeatureGraph)

## 5. Execution Template

When activated, initialize the session with this opening:

```markdown
🛡️ **Socratic Review Mode Initiated** | Gate: `[MODE]`

I am scanning the current context for hidden risks and undocumented assumptions. I will ask you 1-2 questions at a time. Let's resolve these before we lock in the [artifact name].

*(If applicable for Gates 1-3)*
🤖 **Agent Pre-Debate Check:** `[N]` questions were auto-resolved by the council using existing context. `[M]` questions require your input.
*(Include Decisions Log at the end of the review if N > 0)*

[Insert first question using the mandatory format]
```
