---
name: 'agent-booster'
description: 'Bypasses LLM for simple code modifications using local regex and WASM rules.'
inputs:
  - file_path: 'Target source file to modify'
  - intent: 'Shorthand modification intent (e.g., wrap_try_catch, format, jsdoc)'
  - code_context: 'Additional parameter context if needed'
outputs:
  - success: 'Boolean indicating if bypass editing completed'
  - modified_content: 'String containing revised code or null if fallback'
mcp_tools_required: []
subagent_triggers: []
---

# ⚡ Agent Booster (Local Edit Bypass)
> Nhóm phân loại / Classification: `SKILL_ATTACHMENT / SUPPORTIVE`

## 📌 Overview
This skill wraps local regex rules compiled through Node-WASM to perform trivial code refactoring (like formatting, comment generation, adding try-catch blocks) without hitting expensive LLM API models, saving token budgets and reducing latency.

---

## 🛠️ Usage Guidelines

### Execution Flow
1. Check if the task matches one of the supported regex modification patterns:
   - `wrap_try_catch` (wraps targeted blocks in try/catch structures)
   - `add_jsdoc` (adds standard JSDoc method headers)
   - `format_syntax` (basic structural formatting)
2. Execute the parser using Node.js locally:
   ```bash
   node _iwish-output/iwish-skills/agent-booster/scripts/booster-engine.js <file_path> <intent>
   ```
3. If execution exceeds **100ms**, abort immediately to prevent ReDoS CPU exhaustion and return fallback flag.
4. On match failure, return fallback signal to route execution to active LLM provider.

---

## 🚦 Verification Checklist
- [ ] Parse target file using dry-run mode.
- [ ] Run test input matching try-catch intent and check if bọc try/catch correctly.
- [ ] Run infinite-loop style string matching to verify 100ms timeout aborts correctly.
