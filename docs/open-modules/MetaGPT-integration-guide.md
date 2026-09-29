# I-Wish Adoption Review Pack: MetaGPT
Generated: 2026-06-02

## 1. What is it
- **Repo Name**: MetaGPT
- **Source**: [https://github.com/FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT)
- **Current Registration State**: Draft (Registered in `.iwish/absorbed-repos/MetaGPT/` with comparative DNA)
- **Shape Classification**: `compound` / `fragment` (Selective Extraction: extracting sequential turn execution patterns and parsing libraries)
- **Role Classification**: `supportive`

---

## 2. Why it exists
- **What job it solves**: MetaGPT coordinates multiple specialized LLM agents in a structured, sequential workflow to automate software SDLC tasks (requirements engineering, architecture design, coding, testing, and self-healing).
- **Why I-Wish wants it**: We want to adopt two key mechanisms:
  1. The **`BY_ORDER` (Sequential Turn)** execution model to enable fast-track, debate-free agent Turn cycles.
  2. The recursive **ActionNode XML parsing** system to cleanly structure hierarchical LLM input/outputs.
- **What gap it fills**: 
  - Resolves agent conversational deadlock/loops in multi-agent kịch bản (workflows).
  - Standardizes the parsing of complex data types (lists, dicts, schemas) returned from LLM responses.

---

## 3. Delivery framework placement
- **Which phase(s) it helps**: `implement`, `validate`, `operate-learn`.
- **Which stage/task(s) it serves**: Fast-Track implementation (`quick-dev` stage), self-healing debugging loops during compile/test stages.
- **Framework Role**: `supportive` (accelerates code development and improves resilience).

---

## 4. Input -> Process -> Output
- **Expected Inputs**:
  - High-level user idea or feature requirement.
  - Configuration mappings (e.g. expected XML tags/structures).
- **Process**:
  1. The orchestrator maps the workflow into sequential actions.
  2. The parser wraps prompts with strict XML formatting requirements.
  3. LLM executes code, and the output is regex-extracted and safely parsed into native types.
  4. Dynamic terminal feedback executes a self-healing loop for compilations.
- **Expected Outputs**:
  - Structured data matching Pydantic schemas (lists, dicts).
  - Executable, compiled code with test logs.

---

## 5. Use cases
- **Core Use Cases**:
  - **Fast-Track Auto-Pilot Loop (`quick-dev` mode)**: Creating quick, debate-free local code components in isolated workspace environments.
  - **Structured XML Data Parsing**: Mapping complex recursive models (like UI layout structures, nested checklists) into LLM context and validating results.
  - **Self-Healing Compilation Loop**: Running unit tests and passing stderr traceback back to the coding agent for automated fixes (up to 3 retries).
- **Adjacent Use Cases**:
  - **Parallel Code Auditing**: Running multiple specialist review agents (Security, Performance, A11y) concurrently and publishing results.
- **Do-Not-Use Cases**:
  - Open-ended conversational brainstorms (where strict sequential order is counterproductive).
  - Complex architectural decisions requiring human-in-the-loop consensus.

---

## 6. Edge cases / Stress cases / Constraints
- **Edge Cases**:
  - *XML parser mismatch:* LLM fails to close tags or returns raw text instead of structured markup. Handled by fallback text regex parsing and repair tools.
- **Stress Cases**:
  - *Infinite Self-Healing Loops:* Coding agent keeps producing broken code that fails compilation. Constraint: limit self-healing turns to exactly **3 retries** before escalating to the user.
- **Operational Constraints**:
  - *Dynamic Exec / Eval Risk:* MetaGPT uses raw `eval()` which creates RCE vulnerabilities. We **MUST NOT** adopt raw `eval()`. Instead, use `ast.literal_eval()` or native Pydantic schema validation.
- **Governance Constraints**:
  - No global installs (`npm -g` or system-wide hooks) are permitted. All tools must run inside the local project workspace environment.

---

## 7. Agent / Workflow / Skill coordination
- **Which canonical agents should use it**: `dev-agent`, `qa-agent`, and `orch-agent`.
- **Which workflows should call it**: `/quick-dev` and `/fix-bug`.
- **Supportive skills pairing**: `code-search` and `security-guardian`.
- **Direct vs Parent**: Should be called only through parent workflows (e.g., `/quick-dev`).

---

## 8. Orch routing hints
- **Trigger Phrases**: `phát triển nhanh`, `code tự động không qua thiết kế`, `auto-pilot code`, `self-healing compile`.
- **Anti-Triggers**: `brainstorm ý tưởng`, `thiết kế kiến trúc hệ thống lớn`.
- **Preferred Routing Stage**: `orchestration` (during intent-triage for code implementation).
- **Proposal Model**: Proposed automatically for minor feature tweaks/bugfixes, but requires user approval for initial startup.

---

## 9. Review questions for the user
1. Do you agree with restricting the Self-Healing Loop to **exactly 3 retries** before asking you for help?
2. Should we automatically enable the **Fast-Track Auto-Pilot** (without creating stories/epics) for tasks under 3 files, or do you always want a manual checkpoint?
3. Are you comfortable with replacing the risky `eval()` parser with our secure `ast.literal_eval()` equivalent?

---

## 10. Example scenarios
- **Scenario 1 (Fast-Track):**
  *Prompt:* "Tạo một hàm helper tính toán chiết khấu hóa đơn dựa trên độ tuổi khách hàng và cập nhật vào `utils.py`."
  *Action:* Orch routes to `/quick-dev`, bypasses PRD creation, runs the sequential `BY_ORDER` chain (Spec -> Write Code -> Test -> Compile check), and reports success.
- **Scenario 2 (Self-Healing):**
  *Prompt:* "Sửa lỗi Import trong `main.py` khi chạy `npm run build`."
  *Action:* QA runs the compile task, catches the stderr traceback, feeds it directly to the Code-Writer agent to fix, and retries automatically.
