# Capability Spec: stripe-webhook-simulator

## Type: SKILL
## Status: Draft
## Created: 2026-08-08

### Problem Statement
Testing hybrid tax configuration events with Stripe requires specific and complex webhook payloads (e.g., invoices with mixed tax rates, customer tax IDs) that are difficult to simulate reliably using only the official Stripe CLI. This skill creates a local simulation environment to generate and inject these complex tax-related webhook events safely for local testing.

### Knowledge Sources
- Source 1: User Request — "Creates a local Stripe webhook simulation environment to test hybrid tax configuration events safely."
- Source 2: Cowok.ai Architecture (ADR 2.9) — Webhook-Driven Subscription State Machine & Asynchronous Compliance Workers.

### Core Concepts
1. **Payload Generation**: Create complex Stripe webhook payloads for tax-related events (e.g., `invoice.created`, `invoice.payment_succeeded`, `customer.tax_id.created`).
2. **Local Injection**: Send these payloads to the local webhook endpoint securely, bypassing or simulating Stripe signature validation as configured for local environments.
3. **Safety First**: Ensure simulated events never interact with or pollute the production environment.
4. **Hybrid Tax Configurations**: Handle scenarios with mixed tax rates, EU VAT, US Sales Tax, and exempt customers.

### Anti-Patterns
- ❌ Do NOT send simulated webhooks to live/production endpoints.
- ❌ Do NOT hardcode production webhook secrets in the simulation scripts.
- ❌ Do NOT rely solely on the Stripe CLI for edge-case hybrid tax scenarios without custom fixture support.

### Best Practices  
- ✅ Use dedicated test signing secrets for local validation.
- ✅ Structure simulated payloads exactly as Stripe API v2023-10-16 (or current project version) dictates.
- ✅ Isolate local simulation from any outbound calls to real Stripe endpoints.

### Deliverables
- [ ] File 1: `.agent/skills/stripe-webhook-simulator/SKILL.md`

### Domain & Trigger Registration Planning
- **Domains**: Payment/Billing, QA, DevOps
- **Triggers**: `stripe webhook`, `simulate tax event`, `hybrid tax`, `test stripe billing`
- **Note**: Must be registered in `.agent/config/domain-skill-registry.yaml` during the Forge/Validate phase.
