# I-Wish Integration Guide: agent-governance-toolkit
> Generated on: 2026-06-17

---

## 1. What is it
- **Capability/Repo Name**: microsoft/agent-governance-toolkit
- **Source**: [https://github.com/microsoft/agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit)
- **Current Registration State**: Awaiting Promotion (Draft assets prepared in `_iwish-output/iwish-skills/`)
- **Shape Classification**: `skill-attachment` (Policy Evaluators & Budget Monitors) / `skill` (Credential Redactor)
- **Role Classification**: `supportive` / `foundational`

---

## 2. Why it exists
- **What job it solves**: Validates AI agent actions, enforces execution sandboxing, redacts credentials/PII, and monitors token/cost budgets dynamically during multi-agent loops.
- **Why I-Wish wants it**: To harden I-Wish subagent execution loops against OWASP Agentic AI vulnerabilities (specifically prompt injection, recursive loops, and credential leaks).
- **What gap it fills**: I-Wish previously had simple audit checks but lacked dynamic parameter rewriting (transforms) and runtime budget throttling.

---

## 3. Delivery framework placement
- **Which phase(s) it helps**: Phase 0 (Security Guardian) and Phase 3 (Execute).
- **Which stage/task(s) it serves**: Tool execution checks, credential sanitization, and cost control loops.
- **Role Axis**: `supportive` (budgets and policy checks) and `foundational` (credential redaction).

---

## 4. Input -> Process -> Output
- **Inputs**:
  - `action`: Name of the tool or task being invoked.
  - `payload`: Input arguments or data dict passed to the tool.
  - `context`: Running thread context, metadata, and data classification labels.
- **Process**:
  - Validates payload against loaded Cedar/Rego policies (allow, warn, deny, transform).
  - Sanitizes the payload using regular expression keyword matching to redact sensitive variables.
  - Checks cost/token usage and thorttles if error budget is exceeded.
- **Outputs**:
  - `verdict`: Decided enforcement state (`allow`, `deny`, `warn`, `transform`).
  - `sanitized_payload`: Rewritten payload with secrets redacted or parameter values modified.

---

## 5. Use cases
- **Core use cases**:
  - Restricting destructive tool invocations based on agent role (RBAC/ABAC).
  - Redacting OpenAI, AWS, and JWT tokens in logging and communication channels.
  - Auto-capping maximum tool-call budgets on long running tasks.
- **Adjacent use cases**:
  - Logging auditable records of all agent actions.
  - Tracking system health, latency, and token SLOs.
- **Do-not-use cases**:
  - Executing code inside the Python soft sandbox for strong isolation (use OS-level sandboxing instead).
  - Cross-compiling C++ or Rust FFI packages (skip Go/Rust/dotnet SDKs).

---

## 6. Edge cases / Stress cases / Constraints
- **Edge cases**:
  - **Dynamic URL Redirects (SSRF)**: An agent bypasses standard domain allowlists by pointing to redirects (e.g. `http://169.254.169.254` metadata endpoint). Hardened allowlist resolver must validate target IP.
  - **Partial Decision Replays**: Reconstructing execution lineage when some log sinks fail.
- **Stress cases**:
  - **Highly Nested Payloads**: Scanning deeply nested dictionaries or large arrays for secrets might cause regex timeouts (ReDoS).
- **Constraints**:
  - Must remain isolated from system-wide directories (strict workspace isolation).
  - WASM-based evaluations must be skipped in favor of native Python logic to avoid latency.

---

## 7. Agent / Workflow / Skill coordination
- **Which canonical agents should use it**: `review-agent` (runs security guardian checks), `dev-agent` (runs tests), and `orch-agent` (monitors task costs).
- **Which workflows should call it**: `/absorb-repo` (pre-cloning scan), `/code` (pre-execution code check).
- **Supportive skills pairing**: `data-integrity-guardian`, `ai-cost-optimizer`.
- **Usage**: Used directly via supportive functions in the parent orchestrator workflow.

---

## 8. Orch routing hints
- **Trigger phrases**: `"verify agent compliance"`, `"redact credentials"`, `"check task budgets"`, `"owasp audit"`.
- **Anti-triggers**: `"visual design"`, `"create database tables"`.
- **Preferred routing stage**: Pre-execution planning and post-execution review.
- **Proposal mode**: Proposed automatically for security/cost-sensitive tasks.

---

## 9. Review questions for the user
- Should I-Wish automatically redact detected secrets in all console log outputs, or only in saved report files?
- What should be the default budget cap for subagent tasks (e.g. max $5.00 per task, or 50 tool calls)?
- Do we want to enable dynamic webhooks for human-in-the-loop approvals on destructive actions?

---

## 10. Example scenarios
- **Scenario 1: Redacting OpenAI Key**
  - *Prompt*: `"Run task using sk-live-51Nz..."`
  - *Output*: `Sanitized payload: "Run task using [REDACTED]"`
- **Scenario 2: Throttling budget overage**
  - *Scenario*: Subagent gets stuck in a loop calling a tool 100 times.
  - *Output*: Intercepted at call 50, budget overage detected, execution gracefully halted.
