---
name: watchmen-skill
description: Watchmen v2.0 Platform-Enforced Zero-Trust Security Guardian
---

# 🛡️ Watchmen v2.0 — Zero-Trust Security Guardian

**Watchmen v2.0** is the foundational anti-hallucination and zero-trust framework for I-Wish agents. It abandons prompt-based "honor system" compliance in favor of Platform-Enforced structural isolation.

## The 4 Operating Modes

### Mode 1: Pipeline Integrity (Out-of-Band Signing)
**Scope**: Final artifacts (sprint-status, architecture, ui-spec) within the SDLC `/flow`.
**Execution**: Agents MUST NOT run validation scripts via `bash` using OS-level permissions.
**Mechanism**:
1. Agent completes file writing.
2. Agent invokes the MCP Gateway (or Out-of-Band daemon) passing the file path.
3. The isolated Daemon independently reads, validates, and cryptographically signs the file using an `OOB_SIGNING_KEY` inaccessible to the agent.
4. The Daemon returns the detached HMAC signature to the agent.

### Mode 2: Capability Audit (Injection Assessment)
**Scope**: Validating new or enhanced Skills/Workflows before promotion.
**Execution**: When running `/create-skill` or `/enhance-skill`, the workflow must call `mcp-signing-daemon.py --assess-injection` via the framework.
**Mechanism**:
- The Daemon parses the capability file and calculates the **Watchmen Injection Score (WIS)**.
- If WIS >= 6, the capability is flagged as requiring a Watchmen Integration Gate.
- The Daemon signs the capability evidence JSON.

### Mode 3: Session Compliance Audit (Orchestrator-Enforced)
**Scope**: All general agent sessions and un-lockable outputs (e.g. chat debates).
**Execution**: The agent does NOT manually invoke the auditor.
**Mechanism**:
- When the agent signals end of turn (yielding to the user), the Antigravity Orchestrator triggers an `on_turn_complete` intercept hook.
- The Orchestrator runs `session-compliance-auditor.py` in the background.
- If the agent skipped mandatory gates, the Orchestrator HALTS the turn end, injects a High Priority system message with the failure report, and forces the agent to resolve the compliance gap.

### Mode 4: Anti-Hallucination Research Guard (Zero-Trust Sourcing)
**Scope**: All research, context gathering, and documentation referencing.
**Execution**: Agents MUST NOT hallucinate, guess, or synthesize file names or content without explicit physical tool verification.
**Mechanism**:
- Before referencing or extracting data from any documentation (e.g., `_iwish-output/research/`), the agent MUST physically invoke directory listing or search tools (like `list_dir`, `grep_search`, or `view_file`) to confirm the file's exact name and content.
- If an agent generates output relying on non-existent files or purely hallucinates sources (e.g., hallucinating a "Cowok Vs Dify Architecture" file when no such file exists), the Orchestrator will intercept via telemetry, flag the hallucination, and force the agent to use proper file-system tools to read actual sources (e.g., `_iwish-output/research/llm-engineering-architecture-master-v3.md`).

## Gate Classifications

| Gate Level | Description | Enforcement Type |
|---|---|---|
| **Category A** | Platform-level physical intercept (MCP Daemon, Orchestrator turn-blocker, stream tracing) | Guaranteed Execution (Zero-Trust) |
| **Category B** | Prompt-based instructions inside a workflow (e.g., "You MUST read X") | Agent Volitional (Prone to Bypass) |

> [!WARNING]
> Agents are structurally prohibited from reading environment variables or invoking commands that might leak signing keys. The Orchestrator will intercept and flag `env`, `printenv`, or `cat .env` commands.

## Orchestrator Cognitive Stream Tracing

The `session-compliance-auditor.py` now leverages **Framework-Level LLM Telemetry**.
- It does not just parse tool calls. It parses raw LLM completions and `<thought>` blocks directly from the `transcript_full.jsonl` stream log.
- This ensures cognitive (chat-only) steps are traced cryptographically, eliminating the blindspot where agents could hallucinate manual tasks.
