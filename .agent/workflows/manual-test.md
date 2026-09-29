---
name: manual-test
description: Dual-Engine Zero-Trust Manual Testing Workflow Orchestrator
category: implementation
roles:
  - qa-agent
  - review-agent
steps:
  - id: step-01-intake
    description: "Read `manual-test-guide.md` and parse Zero-Trust constraints."
  - id: step-02-engine-routing
    description: "Determine execution engine (A vs B) using the 4-layer heuristic."
  - id: step-03-execution
    description: "Run test via chosen engine and collect physical evidence."
  - id: step-04-validation
    description: "Call `validate-qa-evidence.py` to audit the evidence."
  - id: step-05-guided-loop
    description: "If failed, loop to `/fix-bug` (max 3 retries). If passed, wait for Human Cross-Check."
---

# Dual-Engine Zero-Trust Manual Testing Workflow

This workflow orchestrates the QA testing phase by strictly enforcing Zero-Trust physical evidence generation using either Playwright automation or MCP agentic ephemeral testing.

# Dual-Engine Zero-Trust Manual Testing Workflow

This orchestrator runs the following steps:
1. step-mt-01-intake
2. step-mt-02-engine-routing
3. step-mt-03-execution
4. step-mt-04-validation
5. step-mt-05-guided-loop
