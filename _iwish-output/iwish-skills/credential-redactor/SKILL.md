---
name: credential-redactor
description: Detects and redacts credentials (e.g. API keys, JWTs, private keys) in text payloads or data objects before logging or persistence.
inputs:
  payload: The raw text string or nested data object (dict/list) to scan.
outputs:
  sanitized_payload: The data object with all matched credentials replaced by [REDACTED].
mcp_tools_required: []
subagent_triggers: []
---

# Credential Redactor Skill
Uses regular expressions to scan text strings and recursively sanitizes nested Python objects (dicts, lists, tuples) by replacing secrets with `[REDACTED]`.
