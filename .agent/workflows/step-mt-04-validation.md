---
description: 'Step MT-04: Validation — Executed by manual-test.md'
---

# Step MT-04: Validation

## Objective
Execute the instructions defined in this step for the manual-test.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `manual-test.md`.

## Instructions

## Step 3: Execution & Evidence Collection
### 3A: Engine A (Headless Playwright) - MANDATORY EXECUTION
- **Kiểm tra công cụ:** Trình tạo QA (`webwright-qa-generator`) dựa trên công cụ Webwright của Microsoft (cài đặt qua `uvx` hoặc `pip`).
- Trực tiếp chạy lệnh kiểm tra sự tồn tại của `webwright` (ví dụ `webwright --help` hoặc lệnh tương đương do skill định nghĩa).
- **Yêu cầu Xác nhận (Ask):** Nếu CÓ lỗi (command not found), Agent **TUYỆT ĐỐI KHÔNG** tự động bypass. Agent PHẢI dừng quy trình lại và thông báo: *"Webwright chưa được cài đặt. Bạn có muốn install Webwright để sử dụng AI Automation QA không, hay muốn tiếp tục với Vanilla Playwright?"*.
- **Fallback Strategy**: CHỈ KHI người dùng xác nhận "Tiếp tục với Vanilla Playwright", Agent mới được phép bỏ qua wrapper script và tiến hành dùng LLM context gốc để sinh code Playwright.
- Mã Playwright sinh ra bắt buộc chạy ở chế độ headless và xuất kết quả (DOM snapshot, HAR log, screenshot) vào `qa/evidence`.
- *Requirement:* The Agent MUST have `enable_write_tools=true` to write and execute the test scripts natively.

### 3B: Engine B (Agentic Ephemeral MCP) - POST-FAILURE TRIAGE ONLY
- If Engine A fails, the QA Agent may use `chrome-devtools-mcp` tools attached to a separate debugging instance to inspect the DOM, identify missing selectors, or triage the failure.
- Agent proposes script fixes based on triage and loops back to 3A.

### 3C: DoD Audit (Claude Kit Standard)
- Execute Lighthouse and Axe checks programmatically (via CLI or Playwright integration) rather than relying on GUI MCP tools.
- Audit results MUST be captured and appended to the `qa/evidence` folder inside the Story directory.

### 3D: Live Target Grounding & Anti-Mock Audit (MANDATORY GATE)
- The Agent MUST run the Live Target Grounding verifier to ensure zero mock links were used and state deltas are authentic:
  ```bash
  python3 .agent/skills/live-target-grounding-guardian/scripts/verify-live-evidence.py --evidence-dir "<story_dir>/qa/evidence" --target-url "http://127.0.0.1:<ALLOCATED_PORT>" --dom-root "#root"
  ```
- If the verifier flags ANY mock link (`file://`, dummy HTML in `scratch/`), identical before/after hash (no-op action), or missing story keywords in DOM, the QA test MUST be marked as FAILED and routed to triage.

### 3E: QA Acceptance Evidence Packaging & Sealing (Gate ZT-01B)
1. **Package & Sanitize Evidence Manifest:**
   Collect all evidence, sanitize confidential headers (`Authorization`, `Cookie` in HAR), and compile manifest JSON:
   ```bash
   python3 .agent/scripts/package-qa-acceptance.py --story-dir "<story_dir>" --sanitize-headers --output "<story_dir>/qa-acceptance-evidence.json"
   ```
2. **Watchmen Cryptographic Seal (Category A Gate):**
   Request Out-of-Band HMAC Cryptographic Signature from Watchmen MCP:
   `call_mcp_tool("watchmen-mcp", "sign_pipeline_gate", {"artifact_path": "<story_dir>/qa-acceptance-evidence.json", "gate_name": "qa-acceptance-gate"})`
   - Downstream completion gates MUST verify the signature before allowing story status transition to `completed`.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
- [ ] Passed `verify-live-evidence.py` with zero mock link violations.
- [ ] Evidence manifest packaged and cryptographically sealed via Gate ZT-01B (`qa-acceptance-evidence.json.sig` generated).

