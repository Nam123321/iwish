---
name: "layout-channel-validator"
description: "Simulates and validates universal layout contracts across external channel renderers like Lark and Telegram."
inputs: ["layoutSpec"]
outputs: ["validationReport"]
mcp_tools_required: []
subagent_triggers: []
---

# Layout Channel Validator

## When to Use This Skill
Use this skill whenever layout contracts or component adapters (like LarkAdapter or TelegramAdapter) are modified, to ensure they don't produce invalid vendor-specific UI payloads.

## Core Rules
1. Every adapter must output valid vendor-specific JSON.
2. Internal fallback objects MUST NOT be leaked directly into the vendor payloads (e.g. `type: 'fallback'` is not a valid Lark tag).
3. Always validate Markdown escaping for Telegram (`MarkdownV2`).

## Execution Guide
Run the validation script via Node:
`node .agent/skills/layout-channel-validator/scripts/validate_layout.js`
