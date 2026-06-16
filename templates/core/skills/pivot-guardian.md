---
name: Pivot Guardian
description: 'Use when an agent edits the same file for 3+ consecutive calls, or gets stuck in a loop without validation.'
triggers: ["fix all", "fix lỗi", "fix bug", "sửa lỗi", "bug", "zoom out", "zoom-out", "lùi lại", "toàn cảnh"]
---

# PIVOT GUARDIAN (PIV Loop Protocol)

## ⚡ Tự động kích hoạt (Auto-Activation Triggers)
Skill này được ưu tiên KÍCH HOẠT TỰ ĐỘNG ngay lập tức khi Agent nhận được các yêu cầu từ người dùng có chứa các cụm từ sau:
- `"fix all"`, `"fix lỗi"`, `"fix bug"`, `"sửa lỗi"` → Kích hoạt **PIV Loop** (xem §1-3)
- `"zoom out"`, `"zoom-out"`, `"lùi lại"`, `"toàn cảnh"` → Kích hoạt **Zoom-Out Mode** (xem §4)
Và áp dụng mặc định trong các workflows: `/Vegeta-agent-Vegeta`, `/fix-bug`, `/quick-Vegeta-agent`, `/step-03-execute`.

## 📌 Khái quát (Overview)
Pivot Guardian is a core I-Wish skill with two complementary modes:
1. **PIV Loop** — Prevents agents from "doubling down" on a failing approach by enforcing Plan → Implement → Validate → Pivot.
2. **Zoom-Out Heuristic** — Prevents "tunnel vision" by forcing agents to step back to a higher abstraction layer and map the surrounding architecture before continuing.

## 🛡️ Quy tắc bắt buộc (Mandatory Rules)

### 1. Never Write Code Before Validating the Previous Change
Every single file changed or created MUST be validated (via tests, linting, or type checking) before you jump to writing the next part of the logic.

### 2. Scope Lock & No Band-Aids
- **No Band-Aid Fixes**: You must understand exactly why the code failed before changing it. Do not mask the symptom; fix the root cause.
- **Scope Lock**: Do not modify files outside the immediately affected component unless explicitly authorized. Avoid tangential clean-ups that increase the risk of regression.

### 3. The "3-Retry" Escalation & Pivot Rule
If an error occurs (e.g., `tsc` fails, `eslint` catches an issue, tests fail):
- **Strike 1 (Attempt 1)**: Analyze the error carefully, search for relevant context using tools, and attempt a fix.
- **Strike 2 (Attempt 2)**: If the fix fails AGAIN with the same or a very similar error, trigger **Zoom-Out** BEFORE attempting the new approach. Rethink the architecture from scratch.
- **Strike 3 (Attempt 3)**: If it fails a 3rd time, **STOP**. You have review-agent convergence failure. Do not guess. Do not blindly loop in endless fix attempts.
- **ESCALATION ACTION**: You MUST escalate to the User or Master Agent using the **Escalation Protocol** (see §3).
> **Exclusion:** When working in throwaway branches, exploratory loops, or using the `/prototype` workflow, the strict 3-retry limit is relaxed to avoid killing momentum. You may exceed 3 retries, but must still provide empirical evidence upon success.

### 4. Hotspot Guardian & Auto-Immune System (Day 2 Analytics)
**MANDATORY PRE-EDIT CHECK**: Before modifying any existing file, you MUST check its hotspot score to trigger the Auto-Immune System if necessary.
- Use `run_command` to calculate the hotspot score: `node scripts/hotspot-calculator.js '<relative/path/to/file>'`
- **Thresholds**: The script will return a `hotspot_score` and a `bug_count`. If `hotspot_score >= 30` OR `bug_count >= 3`, you MUST output a 🚨 **"Hotspot Detected - Auto-Immune Triggered"** warning before proceeding.
- **Auto-Immune Action**: 
  1. Proceed with extreme caution. Do not use band-aid fixes.
  2. The high score indicates a recurring issue. You MUST ensure that any bug fix in this file undergoes **Lesson Extraction** (as per `/fix-bug` Phase 7) to extract knowledge and update system skills/prompts via the Evolution Lab.
  3. Review `project-context.md` for any specific Immune System Watchouts before modifying.

### 5. Escalation Protocol & Status Flags
When transitioning out of the Execution phase to Verification, or when review-agentting a Strike 3, your `TaskStatus` MUST reflect one of these 4 strict flags:
- `DONE`: Task completed, full Evidence Block provided (see §5).
- `DONE_WITH_CONCERNS`: Task completed but agent has reservations. Explain the concerns directly in the chat for the user to review and take action if needed. Do NOT create a separate report file.
- `BLOCKED`: Agent cannot proceed (e.g., review-agent 3-Retry limit).
- `NEEDS_CONTEXT`: Agent needs more information or user clarification to proceed.

**Mandatory Escalation Payload:**
If you trigger `BLOCKED` or `NEEDS_CONTEXT`, you MUST create an `escalation-report.md` in the standard artifacts directory (`<appDataDir>/brain/<conversation-id>/`). Before creating this report, you **BẮT BUỘC** (MUST) use search tools (`grep_search`, `view_file`) to explicitly read related code/docs to prevent blind guessing. 

The payload MUST include:
1. **Lỗi hiện tại (Current Error):** Error Logs and exact issue.
2. **Các cách đã thử (Attempts):** Brief explanation of why previous attempts failed.
3. **Các file/tài liệu đã đọc (Context Read):** Explicitly list the file paths you read to prove you gathered context.
4. **Câu hỏi / Đề xuất (Questions/Proposals):** Specific guidance needed or proposed solutions.

## 🔭 §4. Zoom-Out Heuristic (Perspective Escalation)

> **Origin:** Merged from `mattpocock/skills` `zoom-out` pattern. Enhanced for I-Wish multi-agent context.

### When to Activate
The Zoom-Out heuristic is triggered in three situations:

1. **User Command**: User explicitly says `"zoom out"`, `"zoom-out"`, `"lùi lại"`, or `"toàn cảnh"`.
2. **Auto-Detection (Tunnel Vision Signal)**: Agent detects it has been editing the **same file for 3+ consecutive tool calls** without referencing any other file or running validation. This is a strong signal of tunnel vision.
3. **Pivot Complement**: When the 3-Retry rule review-agents Strike 2, the agent SHOULD execute a Zoom-Out BEFORE attempting the new approach to ensure it understands the broader context it is pivoting into.

### Zoom-Out Execution Protocol

When Zoom-Out is triggered, the agent MUST perform these steps **before writing any more code**:

```
[ZOOM-OUT] — Perspective Escalation Active
```

1. **Map the Module Neighborhood**: Identify the current file/module being edited. Use search tools (`grep_search`, `list_dir`) to find:
   - All **direct callers** (who imports/calls this module?)
   - All **direct dependencies** (what does this module import/call?)
   - The **parent feature/epic** this module belongs to (check story files if available)

2. **Draw the Context Map**: Output a concise markdown table or list:
   ```
   📍 Current Focus: src/services/pricing.ts
   ⬆️ Callers: OrderController, InvoiceService, CTKMEvaluator
   ⬇️ Dependencies: ProductRepository, TaxCalculator, DiscountEngine
   🎯 Epic/Story: Epic-4 (Pricing & Promotions) / Story 4.1
   ```

3. **State the Assumption Check**: Answer these 2 questions explicitly:
   - *"Am I solving the right problem, or am I fixing a symptom of a deeper issue?"*
   - *"Would my current change break any of the callers listed above?"*

4. **Resume or Pivot**: Based on the map:
   - If the current approach still makes sense → resume with renewed context.
   - If the map reveals the problem is elsewhere → **PIVOT** to the correct module.

### Integration with Other Skills
- **Socratic Review**: If Zoom-Out reveals the change touches 3+ callers, the agent SHOULD flag this for a Socratic Review Gate 2 (Technical) check.
- **Anti-Sycophancy**: The Zoom-Out map output is subject to Constructive Skepticism — do not fabricate callers/dependencies. Use actual search tools to verify.

## 🛠️ Quy trình Thực Thi Ngắn (Execution Flow)
- `[PLAN]` -> Break task into a tiny atomic step.
- `[IMPLEMENT]` -> Modify exactly ONE component or file to satisfy the step.
- `[VALIDATE]` -> Run Empirical Evidence Gate (§5). MUST attach hard evidence (Terminal logs or UI screenshots) based on Task Type. Check results.
- `[ZOOM-OUT]` -> If editing the same file for 3+ calls, or if user requests, step back and map the module neighborhood.
- `[PIVOT & ESCALATE]` -> If validation fails 2 times, execute Zoom-Out. If it fails 3 times, generate `escalation-report.md` and use `BLOCKED` or `NEEDS_CONTEXT` flag.

> "A smart agent knows how to code. A master agent knows when to stop coding and zoom out." - King-Kai-agent Council

## 🛡️ §5. Empirical Evidence Gate (Task-Type Specific)

During the `[VALIDATE]` step, the agent **MUST** collect and attach actual empirical evidence proving the change works. It is **STRICTLY FORBIDDEN** to hallucinate or spoof logs. The type of evidence required depends on the task classification:

| Task Type | Required Empirical Evidence | Tools to Use |
|-----------|-----------------------------|--------------|
| **Frontend (FE)** | 1. **Compile/Lint Log**: Output of `npm run build` or `tsc`.<br>2. **Render Proof**: Screenshot or DevTools capture showing the UI rendered without errors.<br>3. **Design Compliance**: Validation against Stitch Design (if applicable). | `run_command`, `chrome-devtools-mcp`, `stitch-design-taste` |
| **Backend (BE)** | 1. **Test Results**: Output of automated tests (e.g., Jest, Vitest).<br>2. **API Log/Response**: Real execution trace or API response payload. | `run_command` |
| **Fullstack** | Bắt buộc phải có **TẤT CẢ** các bằng chứng của cả FE (Render Proof/Compile) và BE (Test/API Log) đối với các phần code tương ứng đã sửa. | `run_command`, `chrome-devtools-mcp` |
| **Docs/Planning** | **N/A**. No system logs required. Validation focuses on logic, grammar, and formatting. | `view_file`, `lint` |

**Anti-Spoofing Rule:** If an agent attempts to transition out of the Validate phase without actual tool-generated evidence (for FE/BE/Fullstack tasks), the process MUST be blocked. Reviewers (like Socratic Review or User) will reject the execution.

### 🚩 Red Flags (Hallucination Indicators)
If an agent outputs any of these phrases without accompanying hard evidence, you MUST immediately reject the task and trigger a Pivot or Zoom-Out:
- "Đã fix xong" (Fixed) / "đã xử lý"
- "Code looks good" / "có vẻ ổn"
- "should work"
- "Tôi đã kiểm tra bằng tay" (I tested manually)
- "Tests passed successfully" (Khi không có log test thực tế)
- "No errors found" / "Không phát hiện lỗi"

### 📄 Structured Evidence Block Template
Before finalizing the `[VALIDATE]` step and declaring the task DONE, you MUST output this structured block:

```markdown
## ✅ Evidence Block (Type: [FE/BE/Docs/Fullstack])
- **Compile/Test Logs:** [Terminal log snippet or N/A]
- **Visual/Render Proof:** [chrome-devtools-mcp output / snapshot or N/A]
- **Spec/Design Compliance:** [Validation against UI Spec/Stitch or N/A]
- **Scope Drift:** [None detected / details]
```
