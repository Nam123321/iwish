---
name: "telemetry-privacy-auditor"
description: "Use when evaluating telemetry platforms (PostHog, Sentry, Prometheus, OTel) configurations for PII leaks, high cardinality risks, or GDPR RTBF/opt-out non-compliance."
inputs: ["Telemetry configuration files", "Source code with instrumentation"]
outputs: ["Privacy audit report", "Remediation code snippets"]
mcp_tools_required: []
subagent_triggers: []
---

# Telemetry Privacy Auditor

## When to Use This Skill
Use when evaluating telemetry setups (PostHog, Sentry, Prometheus, OpenTelemetry) to detect PII exposure, high cardinality metrics, and verify GDPR compliance like Data Portability or Right To Be Forgotten (RTBF).

## Core Rules
1. **PII Isolation MUST be Verified:** Enforce that no raw PII (emails, SSNs, phone numbers, exact IP addresses) is sent to external SaaS logging without prior tokenization or masking.
2. **Cardinality Safety MUST be Checked:** Metric labels in Prometheus/OTel MUST NOT use unbounded variables (like `user_id` or raw URLs).
3. **GDPR Opt-Out Support MUST be Enforced:** Client-side telemetry MUST respect `DO_NOT_TRACK` or local opt-out states before emitting events.
4. **RTBF Validation:** Backend event stores MUST have a documented data deletion or obfuscation process tied to user account deletion.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | PII Masking Check | Category A (Deterministic) | AST/Regex scanning of logger configurations to ensure masking functions wrap PII fields. | Code analysis output log |
| GATE-2  | Cardinality Bound Check | Category A (Deterministic) | Static analysis on label arrays in Prometheus/OTel instruments to reject unbounded identifiers. | Static analysis log |
| GATE-3  | GDPR Opt-out Check | Category B (Trust-Based) | Manual logic review of client-side initialization to verify conditional tracking. | Agent confirmation output |
| GATE-4  | RTBF Capability Check | Category B (Trust-Based) | Manual review of the telemetry data retention policy. | Agent confirmation output |

**Enforcement Maturity Ratio:** 50% (2 Category A / 4 Total Gates). Acceptable (Medium Maturity).

## Red Flags — STOP and Reconsider
- ❌ Missing Data Masking: Do not approve PRs that add new user-specific logging without masking.
- ❌ Unbounded Labels: If a metric uses a UUID or user string as a label, HALT and request it be moved to a trace attribute or log field.
- If you find yourself thinking "I'll just let this user_id metric pass, it's small for now", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The vendor SDK handles privacy automatically." | Default SDKs capture IPs and headers. You MUST explicitly configure IP stripping and PII scrubbing. |
| "High cardinality is fine, our scale is low." | Cardinality explodes exponentially and breaks observability backends. Always enforce bounded labels. |
| "RTBF doesn't apply to logs." | GDPR applies to all user-linked data. Logs must have a retention limit or be anonymizable. |

## Industry Standards & Best Practices
- OpenTelemetry: Use `AttributeLimits` and span processors to redact sensitive data before export.
- Sentry: Enable "Data Scrubber" and "Use Default Scrubbers" in project settings, configure `beforeSend` in SDK.
- PostHog: Use Property Filters and the `opt_out_capturing()` API for GDPR compliance.
