---
name: webhook-boundary-validator
description: Validates incoming webhook signatures against tenant secrets to enforce zero-trust dataflow boundaries.
---

# Webhook Boundary Validator

Validates incoming webhook signatures (e.g., from Google Drive/OneDrive) against tenant secrets to enforce zero-trust dataflow boundaries.

## Core Directives

1. **Deterministic Verification (Category A)**: You MUST run the `verify_signature.py` script to cryptographically verify the HMAC signature of incoming webhooks. You MUST NOT rely on string matching or heuristic trust.
2. **Tenant Secret Isolation (Category A)**: You MUST fetch the tenant secret from the secure Key Management Service (KMS) using the Tenant ID. You MUST NOT hardcode secrets or use shared secrets across tenants.
3. **Dataflow Boundary Enforcement (Category A)**: If the signature is invalid, you MUST drop the payload immediately and return a 401 Unauthorized. You MUST NOT process any part of the payload or log PII from the payload.
4. **Replay Attack Prevention (Category A)**: You MUST check the timestamp of the webhook. If it is older than 5 minutes, you MUST reject it as a replay attack.
5. **Watchmen Injection Gate (Category B)**: Log the validation outcome (success or failure) to the audit log along with the Tenant ID, but without logging the payload or secret.

## Execution Steps

1. Receive webhook payload and headers.
2. Extract Tenant ID and Signature from headers.
3. Fetch Tenant Secret from KMS using Tenant ID.
4. Calculate HMAC of the payload using the Tenant Secret.
5. Compare calculated HMAC with the provided Signature using a constant-time comparison function.
6. Validate the timestamp to prevent replay attacks.
7. Accept or reject the webhook based on the validation results.

## Gate Classification

| Gate Name | Category | Description | Tool/Script |
|-----------|----------|-------------|-------------|
| Cryptographic Verification | A | Verify HMAC signature | `verify_signature.py` |
| KMS Secret Retrieval | A | Fetch secret from KMS | `fetch_secret.py` |
| Dataflow Drop | A | Drop payload on invalid | HTTP 401 |
| Replay Prevention | A | Check timestamp < 5m | `verify_signature.py` |
| Audit Logging | B | Log outcome to Watchmen | `log_audit.py` |
