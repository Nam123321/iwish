---
name: 'fast-track-bug-guardian'
description: 'Fast-track bug resolution workflow for low-complexity issues, bypassing full RCA'
---

# 🐞 `/fast-track-bug-guardian`

**Purpose**: A streamlined bug fixing protocol for trivial, low-complexity issues (e.g., typos, missing null checks, CSS tweaks, minor console errors). This workflow explicitly skips the heavy Root Cause Analysis (RCA) and deep impact tracing found in `/fix-bug`, aiming for maximum speed.

## When to use
- Complexity Score < 3
- The error is isolated to 1-2 files.
- No architectural, schema, or deep structural changes are required.
- If the bug involves cross-feature impact or data architecture, HALT and route the user to `/fix-bug`.

---

## Fast-Track Steps

### Step 1: Target Isolation
- Based on the user's error report or logs, use `grep_search` to immediately locate the exact file and line number.
- Restrict scope: Do NOT analyze the entire repository. Limit the search context to the specific component or function mentioned.

### Step 2: Direct Edit (Single-Turn Fix)
- Analyze the isolated function and formulate the fix.
- Apply the fix using `multi_replace_file_content` or `replace_file_content`. 
- Ensure the fix adheres to existing patterns and doesn't introduce new security gaps.

### Step 3: Fast-Track Self-Healing Check
- Run compilation checks or unit tests associated with the modified file (e.g., `npm run build`, `npm test -- <file>`).
- If errors occur, utilize the `fast-track-self-healing` loop: you have a maximum of 3 retries to auto-correct syntax or type errors before escalating back to the user.

### Step 4: Verification & Close
- Present the exact diff or explain the fix concisely to the user.
- Ask the user to confirm the bug is resolved in their local environment.
- Do NOT generate extensive documentation or RCA reports. Keep it brief and focused.
