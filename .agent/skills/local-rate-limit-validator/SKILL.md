---
name: "local-rate-limit-validator"
description: "Use when validating local application rate limits, assessing high concurrency handling, or testing middleware thresholds with k6 or Artillery."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# local-rate-limit-validator

## When to Use This Skill
Use this skill when you need to confirm that local application rate limits and middleware thresholds are functioning correctly under high concurrency. It orchestrates standard tools like k6 or Artillery to simulate load.

## Core Rules
1. Verify the target is strictly a local environment (`localhost`, `127.0.0.1`, or local docker network).
2. Configure load tests to ramp up concurrency gradually to identify exactly when rate limiting triggers.
3. Assert that the server returns correct HTTP 429 status codes when thresholds are exceeded.

## Red Flags — STOP and Reconsider
- If the target endpoint is a public internet address or production environment, STOP. This skill is strictly for local validation.
- If you find yourself thinking "I can test external APIs to see their limits", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| I can test the staging server to get more accurate limits | This skill must strictly validate local application limits. Staging tests require separate explicit authorization. |

## Anti-Patterns
- ❌ NEVER target public, staging, or production endpoints.
- ❌ NEVER generate unbounded traffic without defined ramp-up and ramp-down phases.

## Best Practices
- ✅ ALWAYS use a dedicated script (e.g., `script.js` for k6) that encapsulates the test logic and checks.
- ✅ ALWAYS parse the summary output to ensure thresholds and error rates meet expectations.

## Boilerplate / Snippets
```javascript
// Example k6 local rate limit test script
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up
    { duration: '20s', target: 50 }, // Sustain
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

export default function () {
  const res = http.get('http://127.0.0.1:8080/api/endpoint');
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
}
```

## Version Notes
- Compatible with k6 v0.43+ and Artillery v2.0+
