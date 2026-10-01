---
name: "stripe-webhook-simulator"
description: "Use when testing or simulating Stripe webhooks locally, specifically for complex hybrid tax configurations, without using the official Stripe CLI."
inputs: ["event_type", "payload_override"]
outputs: ["webhook_response_status", "logs"]
mcp_tools_required: []
subagent_triggers: []
---

# stripe-webhook-simulator

## When to Use This Skill
- Testing hybrid tax configuration events locally.
- Injecting custom Stripe payloads (e.g. `invoice.created`, `customer.tax_id.created`).
- Simulating webhook requests without impacting live environments or relying on Stripe's external API.

## Core Rules
1. **Safety**: Never hardcode production webhook secrets. Use test keys.
2. **Isolation**: Simulated events must target local endpoints (e.g., `http://localhost:3004/api/webhooks/stripe`).
3. **Payload Accuracy**: The payload structure must strictly mimic Stripe API standard for `v2023-10-16`.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | Target Endpoint Check | A | runner.py checks if target URL is localhost | exit code 1 if not localhost |
| GATE-2  | Payload Validation | A | runner.py JSON parses payload against expected schema | exit code 1 on schema fail |
| GATE-3  | Status Code Verification | B | Agent verifies HTTP 200/201 | tool execution output |

## Execution Guide
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 ~/.iwish/generated-skills/stripe-webhook-simulator/scripts/runner.py --target <target_url> --event <event_type>`

## Red Flags — STOP and Reconsider
- **"I'll just use my production Stripe key to test."** STOP. This leaks sensitive data and mixes environments.
- **"I'll send it to the live staging server."** STOP. The simulator is designed for local environments only.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The official CLI is easier to use." | The CLI doesn't natively support injecting complex custom hybrid tax payloads easily without fixtures. |

## Industry Standards & Best Practices
- Stripe webhooks should be idempotent. Ensure your local tests verify idempotency.
- Webhook endpoints should return a 200 quickly and process heavy tasks asynchronously.

## Boilerplate / Snippets
```json
{
  "id": "evt_test_123",
  "object": "event",
  "type": "invoice.created",
  "data": {
    "object": {
      "id": "in_test_123",
      "customer_tax_ids": []
    }
  }
}
```
