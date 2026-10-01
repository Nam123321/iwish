---
name: "payment-schema-sync"
description: "Use when synchronizing payment provider pricing schemas, product IDs, or subscription plans with backend database constants."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# payment-schema-sync

## When to Use This Skill
- When product IDs, pricing tiers, or subscription plans change in the payment provider (Stripe, PayPal, etc.).
- When the backend database constants need to be synced with the payment provider's latest schema.
- When generating or updating payment schema constants in the codebase.

## Core Rules
1. **Source of Truth**: The payment provider is always the source of truth for pricing schemas and product IDs.
2. **Immutable History**: Never overwrite existing historical pricing IDs in the database if they are tied to active subscriptions.
3. **Validation**: Always validate the retrieved schema against the existing database constants before applying updates.
4. **Environment Isolation**: Never sync production payment IDs to development/staging environments and vice versa.

## Red Flags — STOP and Reconsider
- ❌ **Direct Database Writes without Validation**: Do not update the database directly without first diffing and validating the changes.
- ❌ **Hardcoding**: Do not hardcode new product IDs directly without syncing from the provider API.
- If you find yourself thinking "I'll just manually update the product ID in the DB", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just manually patch the DB this one time." | "All schema syncs must go through the automated sync skill to ensure consistency and auditability." |
| "I'll sync production IDs to staging to test." | "Environment isolation is critical. Use test mode IDs for staging environments." |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | Environment Isolation Check | Category A | Environment variable check (`NODE_ENV` vs API Key prefix) | Script exit code |
| GATE-2  | Diff Validation | Category B | Agent verifies diff before applying | Diff output, explicit agent confirmation in log |
