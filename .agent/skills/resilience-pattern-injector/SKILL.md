---
name: resilience-pattern-injector
description: Analyzes FMEA scanner outputs and automatically injects try/catch blocks, retry mechanisms, and circuit breakers into the designated code.
inputs:
  - FMEA scanner outputs
  - Designated codebase
outputs:
  - Injected resilience patterns (try/catch, retry, circuit breakers)
mcp_tools_required: []
subagent_triggers: []
---

# resilience-pattern-injector

## Overview
Analyzes FMEA scanner outputs and automatically injects try/catch blocks, retry mechanisms, and circuit breakers into the designated code.

## When to Use
- When FMEA (Failure Mode and Effects Analysis) scanner outputs indicate a high risk of failure or unhandled exceptions in the codebase.
- During the implementation phase when robustness and fault tolerance are required.
- After code reviews highlighting a lack of error handling.

## Core Rules
1. Analyze FMEA scanner outputs to identify failure points.
2. Inject appropriate `try/catch` blocks around high-risk operations.
3. Implement retry mechanisms (e.g., exponential backoff) for transient failures (e.g., network calls).
4. Integrate circuit breakers to prevent cascading failures in distributed systems.

## Anti-Patterns
- Do not blindly wrap every line of code in a `try/catch`.
- Do not implement infinite retries without a backoff strategy or max attempt limit.
- Do not use circuit breakers for local, guaranteed operations.

## Best Practices
- Ensure logs and metrics are emitted whenever a fallback or retry is triggered.
- Keep the fallback logic as simple and deterministic as possible.
- Configure circuit breaker thresholds appropriately based on system SLA.

## Anti-Fabrication
- Category A (Deterministic): Run tests to verify the retry mechanism works as expected (e.g., mocking transient failures). (50%)
- Category B (Trust-Based): Code review to ensure patterns are applied correctly according to FMEA output. (50%)
Enforcement Maturity: 50%
