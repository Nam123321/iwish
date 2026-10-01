---
name: "security-event-alerter"
description: "Use when critical security events (e.g., webhook verification failures, unauthorized access) occur and must be published to external communication channels (Slack, PagerDuty, Discord, etc.)."
inputs: ["event_type", "severity", "source", "details", "channel"]
outputs: ["delivery_status", "alert_id"]
mcp_tools_required: []
subagent_triggers: []
---

# security-event-alerter

## When to Use This Skill
Use this skill when a security component detects a critical event, such as a webhook signature mismatch or unauthorized access attempt, and this event must be immediately published to an external alerting or communication channel.

## Core Rules
1. **Never log sensitive data (PII/Secrets):** Ensure that the `details` payload is sanitized before broadcasting. Do not include raw tokens, passwords, or customer PII in the alert.
2. **Include actionable context:** Every alert MUST contain the `event_type`, `severity` (e.g., CRITICAL, HIGH), the `source` (e.g., component or IP), and a timestamp.
3. **Synchronous delivery for CRITICAL:** If the severity is CRITICAL, wait for the delivery acknowledgment from the external channel before proceeding.
4. **Fallback mechanism:** If the primary communication channel fails, log the event securely to a durable local storage or fallback alerting system.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-01    | Sanitization Check | Category A | Validation script blocks unmasked secrets | Script exit code |
| G-02    | Channel Auth | Category A | Network layer verification of webhook URL | HTTP 200 OK |

## Red Flags — STOP and Reconsider
- ❌ Sending raw HTTP request bodies or full error traces to a public Slack channel.
- ❌ Ignoring timeout failures on the alerting channel without a fallback.
