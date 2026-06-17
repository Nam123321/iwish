---
name: headroom-proxy-daemon
description: "Starts and manages the Headroom Proxy daemon to automatically compress I-Wish context and save LLM tokens."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# 🌀 Headroom Proxy Daemon

## Overview
This skill starts the `headroom proxy` on port 8787. All AI agent requests should route through `http://localhost:8787/v1` to automatically compress large context payloads (JSON/AST) using Continuous Context Reversibility (CCR), reducing token usage by 60-95%.

## Activation
1. Run the background daemon script with Prose Compression disabled:
   `headroom proxy --port 8787 --disable-prose-compression --whitelist .agent/workflows/*`
   *(Note: Disabling prose compression guarantees that all I-Wish requirement documents remain structurally intact for the orchestrator).*
2. Configure your agent's API Base URL to:
   `http://localhost:8787/v1`
3. Enjoy transparent, reversible token compression.

## Reversibility (CCR)
If the LLM requires original text that was aggressively compressed, it can invoke the `headroom_retrieve` MCP tool to retrieve it. This ensures no data is permanently lost.
