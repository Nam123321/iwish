# Integration Guide for mcp-schema-boundary-validator

## Use Cases
- Ingesting a new MCP tool configuration.
- Parsing an externally supplied schema for model context plugins.

## Edge Cases
- Obfuscated IP addresses (e.g. hex encoded) - current runner provides basic checks, may need enhancement.

## Stress Cases
- Very large JSON schemas that may cause a stack overflow during recursive scanning. Python recursion limit should be monitored.

## Constraints
- Does not automatically patch the schema; it fails closed and requires human review or specialized patching tools.

## Routing Hints
- Call this skill before registering any MCP server with `call_mcp_tool`.

## Reviewer Questions
- Do we need to support specific obfuscated SSRF patterns?
- Are there internal tools that legitimately need 127.0.0.1 access? (If so, they need a whitelist override).
