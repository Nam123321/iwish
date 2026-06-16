---
name: Page-Agent QA Guardian
description: >
  Alibaba Page-Agent integration for QA, testing, and bug reproduction.
  Enables natural language test scripts, automated bug reproduction,
  and exploratory testing via in-page DOM manipulation.
  Supplements (does NOT replace) Playwright/Cypress for CI/CD.
---

# 🤖 Page-Agent QA Guardian SKILL

## Purpose

Integrates [Alibaba Page-Agent](https://github.com/alibaba/page-agent) into the QA and bug-fixing process. Page-Agent is a JavaScript in-page GUI agent that controls web interfaces with natural language — NO screenshots, NO multimodal LLMs needed.

## When to Use

| Context | Trigger | Required? |
|---------|---------|-----------|
| `/fix-bug` Phase 2 | Bug reproduction (step 8c) | ⚡ RECOMMENDED |
| `/fix-bug` Phase 6 | Post-fix verification (step 17b) | ⚡ RECOMMENDED |
| Manual QA | Exploratory testing | ⚡ RECOMMENDED |
| Smoke test | Quick regression check | ⚡ RECOMMENDED |
| `/dev-story` | Interaction pattern testing | ⚡ RECOMMENDED |

> [!IMPORTANT]
> Page-Agent supplements Playwright/Cypress — it does NOT replace them for CI/CD deterministic testing.

---

## 1. How Page-Agent Works

```
                        ┌─────────────┐
  Natural Language  →   │ Page-Agent  │  → DOM Actions
  "Click login btn"     │ (in-page JS)│     (click, type, scroll)
                        │             │
                        │ DOM → text  │
                        │ text → LLM  │
                        │ LLM → action│
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  LLM API    │  ← BYOL (Gemini, GPT, etc.)
                        │  (T1 Flash) │
                        └─────────────┘
```

**Key characteristics:**
- Text-based DOM parsing (NO screenshots needed)
- Runs IN the browser tab (no headless browser)
- Human-in-the-loop UI available (approve before execute)
- MIT licensed, works with any LLM

---

## 2. Integration Setup

### Development Environment

```javascript
// Install
npm install page-agent

// In test-helper or dev-tools script:
import { PageAgent } from 'page-agent';

const agent = new PageAgent({
  model: 'gemini-2.0-flash-lite',     // T1 Bulk — cheapest
  baseURL: process.env.LLM_BASE_URL,   // Via LLM Gateway
  apiKey: process.env.LLM_API_KEY,
  language: 'vi-VN',                    // Vietnamese natural language
});
```

### CDN Quick Test (for manual testing only)
```html
<!-- Add to page temporarily - REMOVE before commit -->
<script src="https://cdn.jsdelivr.net/npm/page-agent@latest/dist/iife/page-agent.demo.js" crossorigin="true"></script>
```

---

## 3. Bug Reproduction Protocol

> Used in `/fix-bug` Phase 2, Step 8c

### When to Activate
```
IF bug report contains step-by-step reproduction steps
AND bug is UI/State/Integration type
THEN use Page-Agent to auto-reproduce
```

### Protocol

```
1. COPY bug report reproduction steps

2. TRANSLATE to Page-Agent commands:
   Bug report: "Go to order page → click create → fill qty = 0 → submit"
   Page-Agent: 
     await agent.execute('Navigate to the orders page');
     await agent.execute('Click the create new order button');
     await agent.execute('Set quantity field to 0');
     await agent.execute('Click the submit button');

3. OBSERVE: Does the bug reproduce?
   → YES: Capture DOM state, console errors, network responses
   → NO: Check if Page-Agent misidentified elements (check logs)

4. DOCUMENT: Include Page-Agent reproduction result in SBRP report
```

### Vietnamese NL Examples
```javascript
// Navigate
await agent.execute('Vào trang quản lý sản phẩm');
await agent.execute('Mở tab Khuyến mãi');

// Interact
await agent.execute('Click nút Tạo mới');
await agent.execute('Nhập "Mì Hảo Hảo" vào ô tìm kiếm');
await agent.execute('Chọn sản phẩm đầu tiên trong danh sách');
await agent.execute('Đặt số lượng là 0');

// Verify
await agent.execute('Kiểm tra có thông báo lỗi hiển thị không');
```

---

## 4. Post-Fix Verification Protocol

> Used in `/fix-bug` Phase 6, Step 17b

### Protocol

```
1. AFTER fix is applied and code is saved

2. REPRODUCE original bug steps (from 8c):
   → Bug should NO LONGER reproduce
   → If still reproduces → fix is incomplete

3. TEST EDGE CASES around the fix:
   await agent.execute('Nhập số lượng = -1');
   await agent.execute('Nhập số lượng = 999999');
   await agent.execute('Để trống số lượng và submit');

4. VERIFY RELATED FEATURES not broken:
   await agent.execute('Quay lại danh sách đơn hàng');
   await agent.execute('Kiểm tra đơn hàng cũ vẫn hiển thị đúng');

5. DOCUMENT in SBRP report:
   page_agent_verification: PASS/FAIL
   steps_verified: [list of steps]
   edge_cases_tested: [list of edge cases]
```

---

## 5. Exploratory Testing Protocol

> For discovering bugs that scripted tests miss

```
1. DEFINE scope: "Khám phá tất cả tính năng trên trang CTKM"

2. RUN exploration:
   await agent.execute('Liệt kê tất cả nút và link trên trang');
   await agent.execute('Click từng nút theo thứ tự');
   await agent.execute('Kiểm tra mỗi form has validation');
   
3. ADVERSARIAL testing:
   await agent.execute('Thử nhập ký tự đặc biệt <script>alert(1)</script> vào mỗi ô');
   await agent.execute('Thử submit form trống');
   await agent.execute('Double click nhanh nút submit');

4. DOCUMENT findings
```

---

## 6. Smoke Test Protocol

> 5 critical flows checked in under 5 minutes

```javascript
const smokeTests = [
  { name: 'Login', steps: ['Mở trang login', 'Đăng nhập với tài khoản test', 'Verify dashboard hiển thị'] },
  { name: 'Create Order', steps: ['Vào trang đơn hàng', 'Tạo đơn mới', 'Thêm 1 sản phẩm', 'Submit'] },
  { name: 'Product CRUD', steps: ['Vào quản lý sản phẩm', 'Tạo sản phẩm test', 'Sửa tên', 'Kiểm tra cập nhật'] },
  { name: 'CTKM Setup', steps: ['Vào CTKM', 'Tạo chương trình mới', 'Setup điều kiện', 'Lưu'] },
  { name: 'Inventory Check', steps: ['Vào kho', 'Kiểm tra tồn kho', 'Tạo phiếu nhập', 'Verify'] },
];

for (const test of smokeTests) {
  console.log(`Running: ${test.name}`);
  for (const step of test.steps) {
    const result = await agent.execute(step);
    console.log(`  ${step}: ${result.success ? '✅' : '❌'}`);
  }
}
```

---

## 7. Cost Tracking

```
Per-test cost calculation:
- DOM text per page: ~2,000-5,000 tokens
- LLM call per step: ~5K-10K input tokens
- Average test: 5 steps × 8K tokens = 40K tokens

T1 Gemini Flash-Lite:
  40K tokens × $0.10/1M = $0.004/test (< 1 cent!)

Monthly estimate (50 tests/day × 30 days):
  1,500 tests × $0.004 = $6/month ← VERY CHEAP

Track in each SBRP report:
  page_agent_cost:
    tests_run: [N]
    total_tokens: [N]
    estimated_cost: $[N]
```

---

## 8. Limitations & When NOT to Use

| ❌ Do NOT Use For | ✅ Use Instead |
|-------------------|---------------|
| CI/CD pipeline regression | Playwright / Cypress |
| Performance / load testing | Artillery / k6 |
| API-only testing | Supertest / REST client |
| Screenshot comparison | Playwright visual testing |
| Deterministic assertions | Playwright assertions |

> [!WARNING]
> Page-Agent uses LLM to interpret DOM, which means results can vary between runs.
> Always confirm critical findings manually. Never use as sole test method for production releases.

---

## 9. Responsive / Emulation Integration (Chrome DevTools MCP)

Nếu cần chạy QA script trên các giao diện Mobile, Tablet, hoặc mô phỏng mạng chậm:
> [!TIP]
> **Sử dụng `chrome-devtools-mcp` phối hợp cùng Page-Agent!**

1. KHÔNG yêu cầu User kích hoạt chế độ Responsive bằng tay.
2. Dùng tool `emulate` hoặc `resize_page` (từ Chrome DevTools MCP) để thiết lập khung nhìn (VD: width 375px cho Mobile).
3. Sau đó, chạy script Page-Agent như bình thường (cấu trúc DOM lúc này đã tự động cập nhật theo Viewport).
