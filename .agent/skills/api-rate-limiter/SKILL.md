---
name: "api-rate-limiter"
description: "Use when making repetitive or high-volume calls to third-party APIs (e.g. Slack, Lark, GitHub) to manage, track, and throttle requests and prevent rate-limit bans."
inputs: ["target_api", "endpoint", "payload"]
outputs: ["response", "rate_limit_status"]
mcp_tools_required: []
subagent_triggers: []
---

# api-rate-limiter

## When to Use This Skill
- When making calls to 3rd-party services that impose strict rate limits (Slack, Lark, etc.).
- When triggering tools inside a loop that could result in API spam.
- When you need to track how many API requests have been made in the current session to avoid timeouts.

## Core Rules
1. NEVER call a third-party API inside a `while True` or unbounded loop without wrapping it in the rate limiter.
2. ALWAYS check the available quota before dispatching a batch of requests.
3. If an API returns a `429 Too Many Requests`, you MUST back off exponentially using the rate limiter script.
4. Track all outgoing requests in the local rate limit state file to share quota across multiple agent steps.

## Execution Guide 
To execute this skill, you MUST NOT run naked curl commands for rate-limited APIs. You MUST wrap your calls using the provided Python tracker:
`python3 .agent/skills/api-rate-limiter/scripts/throttle.py --api <slack|lark|github> --command "<curl command or script>"`

## Red Flags — STOP and Reconsider
- ❌ Running `curl` directly inside a bash `for` loop against an external API.
- ❌ Ignoring HTTP 429 responses and continuing to hammer the endpoint.
- ❌ Hardcoding `sleep 1` without tracking the actual rate limit headers (`X-RateLimit-Reset`).

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just add a sleep 1, it'll be fine." | Static sleeps cause either unnecessary slowness or still hit the limit. You must use header-aware or stateful tracking. |
| "It's only a few requests." | A few requests in a retry loop quickly become hundreds. Always track quota. |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-01 | Quota Check | Category A | `throttle.py` reads state and blocks if quota exceeded | Exit code / Script output |
| G-02 | 429 Backoff | Category A | `throttle.py` automatically pauses on 429 | Script logs |
| G-03 | Header Parsing | Category A | Extracts reset time from API response headers | State file updates |
| G-04 | Loop Prevention | Category B | Agent visually verifies no naked curls in loops | Source code review |

*Enforcement Maturity: 75% (3/4 Category A)*
