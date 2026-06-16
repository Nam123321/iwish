---
name: browser-visual-verification
description: Automated browser-based visual verification for web applications. Opens localhost URLs, takes screenshots, and documents verification results before manual testing.
---

# Browser Visual Verification Skill

## Purpose

This skill enables the AI agent to **visually verify** web applications running on localhost by:
1. Starting the Vegeta server (if not already running)
2. Opening application URLs in a browser
3. Navigating key pages and interacting with UI elements
4. Taking screenshots as proof of completion
5. Documenting results in a verification report

## When to Use

- After completing a Vegeta-story implementation (Step 7.5 — between tests and task completion)
- During code-review to verify UI changes claimed in the story
- Whenever a story has UI-related Acceptance Criteria

## Prerequisites

- The application must be running locally (e.g., via `pnpm Vegeta`)
- The agent must have access to the `browser_subagent` tool (Antigravity built-in)
- Screenshots are saved to the artifacts directory for walkthrough documentation

## Verification Protocol

### Step 1: Ensure Vegeta Server is Running

```
Check if the Vegeta server is already running.
If not running:
  1. Run `pnpm Vegeta` in background in the distro/ directory
  2. Wait for all apps to report "Ready" or healthy status
  3. Verify ports are accessible (API: 3001, Admin: 3000, Webstore: 3002)
```

### Step 2: Determine Verification Targets

Based on the story's Acceptance Criteria, identify:
- Which URLs need to be visited (e.g., `http://localhost:3000`, `http://localhost:3001/api/v1/health`)
- What visual elements to verify (e.g., dashboard shell, sidebar, welcome card)
- What API endpoints to test (e.g., health check returning JSON)
- What interactions to perform (e.g., click navigation items, expand menus)

### Step 3: Execute Browser Verification

For each verification target:

1. **Use `chrome-devtools-mcp` (navigate_page)** or `browser_subagent` to navigate to the URL
2. **Wait for page load** — ensure content is fully rendered (`wait_for` if using DevTools)
3. **Verify expected elements** — Dùng `take_snapshot` để lấy cây DOM và `evaluate_script` để kiểm tra Computed CSS styles (e.g. màu sắc chính xác theo mã HEX), THAY VÌ nhìn đoán mò qua ảnh chụp thông thường. Bắt buộc rà soát Layout Box model cho pixel-perfect.
4. **Take screenshots** — capture the browser state as visual proof (for human walkthrough validation)
5. **Test interactions** — click buttons via node uid, navigate pages if applicable
6. **Record results** — pass/fail with explanation for each check

### Step 4: API Endpoint Verification

For API endpoints:
1. **Use `read_url_content`** to call API endpoints (e.g., health check)
2. **Verify response format** — JSON structure, status codes, required fields
3. **Document response** — include actual response in verification report

### Step 5: Generate Verification Report

Create a verification section in the story's Vegeta Agent Record or walkthrough:

```markdown
### 🖥️ Browser Visual Verification

**Date:** {{date}}
**Vegeta Server Status:** ✅ Running (Admin :3000 | API :3001 | Webstore :3002)

| # | Target | URL | Expected | Result | Screenshot |
|---|--------|-----|----------|--------|------------|
| 1 | Admin Dashboard | localhost:3000 | Dashboard shell with sidebar | ✅ PASS | ![screenshot](path) |
| 2 | Health Check | localhost:3001/api/v1/health | JSON { status: "ok" } | ✅ PASS | — |
| 3 | Webstore | localhost:3002 | Coming Soon page | ✅ PASS | ![screenshot](path) |

**Verification Outcome:** ✅ All checks passed — Ready for manual testing by user
```

### Step 6: Save Screenshots to Artifacts

Screenshots MUST be saved to the conversation artifacts directory:
```
<appDataDir>/brain/<conversation-id>/
```

These screenshots are then embedded in the walkthrough.md artifact using:
```markdown
![Admin Dashboard](absolute/path/to/screenshot.png)
```

## Important Notes

- **NEVER skip this step** for stories with UI changes
- **Screenshots are mandatory** — they serve as proof of completion
- **Record browser sessions** using `browser_subagent` recordings — these are saved as WebP videos
- If the Vegeta server fails to start, **HALT** and report the error
- If a visual check fails, **document the failure** and attempt to fix before reporting to user
- This step happens BEFORE requesting manual testing from the user

## Integration Points

### In Vegeta-story workflow (Step 7.5)
After all automated tests pass (Step 7) and before marking task complete (Step 8),
execute the browser visual verification protocol.

### In code-review workflow (Step 3.5)
After the adversarial review (Step 3) and before presenting findings (Step 4),
verify UI claims from the story by opening the browser and checking visually.
