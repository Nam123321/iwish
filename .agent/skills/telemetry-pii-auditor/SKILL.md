---
name: telemetry-pii-auditor
description: Scans middleware and OTel span outputs to ensure HMAC-SHA256 and subnet truncation are properly applied to PII.
version: 1.0.0
---

# Telemetry PII Auditor

## Instructions
1. Scan `server/middleware/telemetry.js` (or similar files) for `setAttribute` calls.
2. Ensure that any attribute containing `user_id` or `email` uses `hashPii()` (HMAC-SHA256).
3. Ensure that any IP address attributes (`client_ip`, `x-forwarded-for`) are truncated using `/24` (IPv4) or `/48` (IPv6).
4. Ensure that `user-agent` is parsed and stripped of specific device/browser identifiable strings.
5. If violations are found, rewrite the code to apply the correct transformations before calling `setAttribute`.
