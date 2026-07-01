---
name: Billing & Subscription Gating Skill
description: Integrates billing and subscription gating logic as defined in Story 24.2
---

# Billing & Subscription Gating Skill

## Description
This skill enforces subscription gating logic for premium features.

## Rules
1. Check if user has an active subscription.
2. If subscription expires during a transaction, safely rollback or deny access.
3. Call Stripe API or relevant provider to verify status.
