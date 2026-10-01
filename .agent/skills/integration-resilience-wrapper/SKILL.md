---
name: "integration-resilience-wrapper"
type: I-Wish Workflow
description: "Use when the user asks to implement or update external HTTP/SMTP integration code, or when you notice integration code lacking error handling, timeouts, or retries."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# integration-resilience-wrapper

## When to Use This Skill
Use this skill when you are generating or modifying code that communicates with external services (HTTP APIs, SMTP servers, third-party systems) to ensure it handles failures gracefully using timeouts, retries, and circuit breakers.

## Core Rules
1. **Timeout Injection**: Every external call MUST have a defined timeout appropriate for the context (do not use infinite waits).
2. **Retry with Backoff**: Transient errors (e.g., HTTP 500, 502, 503, 504, network drops) MUST be retried using exponential backoff with jitter.
3. **Circuit Breaking**: Repeated failures MUST trip a circuit breaker to prevent cascading system failures.
4. **Idempotency**: Do NOT blindly retry non-idempotent operations (like POST requests) unless explicitly safe or handled via idempotency keys.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "This is a simple script, I can skip the circuit breaker", STOP. All external integrations must use full resilience wrappers.
- If you find yourself thinking "A simple while loop with `sleep(1)` is enough for retries", STOP. You must use exponential backoff and jitter to prevent thundering herd scenarios.
- If you find yourself thinking "The external service says it's 100% available, so I'll just skip adding resilience for this specific API", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The integration is a simple one-off script, so I don't need a circuit breaker, just a timeout will do." | One-off scripts can still hang forever and exhaust resources. Full resilience is mandatory. |
| "I will just use a simple while-loop with a static sleep for retry instead of importing a resilience library because it's faster to implement." | Static sleeps cause synchronized retries (thundering herd), taking down recovering services. |
| "The external service says it's 100% available, so I'll just skip adding resilience for this specific API." | No service is 100% available. Network partitions always occur. |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| RES-01 | Appropriate timeout value configured | Category B | Trust-Based | Review of code snippet |
| RES-02 | Retry configured with jitter | Category B | Trust-Based | Review of backoff implementation |
| RES-03 | Circuit breaker integrated | Category B | Trust-Based | Review of state machine / library config |

## Boilerplate / Snippets
Example (Node.js with `axios-retry` and `opossum`):
```javascript
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');

// Setup Axios Retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response.status >= 500;
  }
});

// Setup Circuit Breaker
const breaker = new CircuitBreaker(async (url) => {
  return await axios.get(url, { timeout: 5000 });
}, {
  timeout: 5000, // If function takes longer than 5s, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30s, try again
});
```
