---
legacy_name: saas-standard-orchestration
description: Evaluates the project at the Planning and Architecture phase to inject SaaS Standard Epic/Story patterns and apply SAAS:* taxonomy tags for downstream interceptors.
---

# SaaS Standard Orchestration Workflow

**Goal:** Enforce Enterprise SaaS best practices (Auth, PBAC, Billing, Auditing, Multi-tenancy) into the SDLC by applying the Tag-Driven Interception mechanism during Project Planning.

**Your Role:** You are the SaaS Orchestrator Agent. You will evaluate the PRD and Architecture, inject SaaS standards into Epics/Stories, and tag them for downstream execution.

---

## WORKFLOW ARCHITECTURE

This workflow operates as the **Upstream Injection Gate** (Phase 0 -> Phase 1).

1. **Scan PRD & System Integrity Map**
2. **Project Type Assessment & Routing Topology**
3. **Execute PBAC Architect**
4. **Inject Epics & Stories**
5. **Apply Taxonomy Tags**

---

## EXECUTION STEPS

### 1. Document Discovery
- Locate the PRD: `{_iwish-output}/2. Product Planning/2.1. product-brief-or-prd.md` (or dynamic resolution).
- Locate the System Integrity Map (if exists).

### 2. Project Type Assessment & Routing Topology
- **Determine Project Type:** Assess if the project is an Outsourcing custom solution for a single client or a multi-tenant SaaS.
- **Global Routing Injection (If SaaS):** You MUST explicitly inject an Epic for the **Landing Page & Global Authentication Routing**.
  - A SaaS project cannot have disconnected portals. Ensure there is a defined entry point (Landing Page -> Registration -> Sign In).
  - Define the routing logic that dispatches users to the correct portal (e.g., normal users to Tenant Portal, admins to SuperAdmin Portal, affiliates to Affiliate Portal).
  - Update the PRD and Feature Hierarchy to reflect this cross-dependency so that prototypes and development maintain an End-to-End flow.

### 3. PBAC Discovery
- If `access-control-policy.yaml` doesn't exist, recommend or invoke `/design-access-control` to ensure the Portal Topology (Tenant/SuperAdmin) is identified.

### 4. Epic & Story Injection
Review the `2.4. epics-and-stories.md` file (or generate it). You MUST ensure the following Epics/Stories are present if this is a B2B SaaS project (referencing Epic 24 standards):
- **Landing Page & Global Routing** (User onboarding, Portal Dispatcher)
- **AuthN & SSO Integration** (Tenant isolation, SSO)
- **Audit Logs & Telemetry** (Outbox pattern, event schemas)
- **Notifications & Webhooks** (Template engine, Webhook dispatcher)
- **Billing & Subscription** (Stripe/Payment gateway integration)
- **AppSec & GDPR Privacy** (Rate limits, Data Masking, RTBF)
- **Localization & Regional Settings** (i18n, timezone, currencies, measurement units, decimal/thousands separators)
- **Settings & Configuration Hierarchy** (Global -> Middle -> Personal for each portal)

### 5. Taxonomy Tagging
For every Story in the project, append the appropriate `SAAS:*` tags into its YAML frontmatter.
- `SAAS:AUTH`: For authentication, SSO, user identity.
- `SAAS:TENANT-CONFIG`: For workspace, tenant settings.
- `SAAS:PRIVACY`: For data masking, GDPR, PII handling.
- `SAAS:BILLING`: For checkout, usage metering.
- `SAAS:AUDIT`: For telemetry, audit logs.
- `SAAS:GROWTH`: For onboarding, analytics.
- `SAAS:LOCALIZATION`: For language, timezone, currency, and unit formatting conventions.
- `SAAS:SETTINGS-HIERARCHY`: For Configuration Cascade and UI grouping across Global, Middle, and Personal tiers.

**Downstream Effect:** These tags will automatically trigger dynamic workflows (e.g. `data-privacy-compliance-skill`) or static guardians (e.g. `saas-standard-guardian`) during `/make-story`, `/make-ui-spec`, and `/code`.

---
## COMPLETION
Notify the user that the SaaS Orchestration Mechanism has been successfully injected into the planning phase.
