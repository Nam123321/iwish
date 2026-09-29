---
name: "pbac-architect"
description: "Use when designing access control matrices, RBAC roles, PBAC policies, evaluating privilege escalation risks, or defining the structure of features requiring authorization."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# PBAC Architect Skill

## When to Use This Skill
- When designing feature hierarchies that require Role-Based or Policy-Based Access Control.
- When generating `access-control-spec.md` or injecting PBAC references into Epics/Stories.
- When reviewing access control logic for privilege escalation risks (Matrix Simulation).

## Core Rules
1. **Portal Topology Mapping First:** Before designing any roles or policies, you MUST read the PRD (`_iwish-output/2. Product Planning/2.1. product-brief-or-prd.md` or dynamically resolve `*prd*.md`) to dynamically identify and map all system Portals for the specific project. While Tenant and SuperAdmin are base defaults for SaaS domains, the PRD may mandate additional portals (e.g., Affiliate, Developer). Access controls are fundamentally isolated by these Portal boundaries. **For SaaS domains, you MUST define explicit tenant boundaries.**
2. **Decouple Tenant from Global Roles:** You MUST explicitly decouple tenant-specific roles (e.g., `TenantAdmin`) from global administrative roles (e.g., `SuperAdmin`). A `TenantAdmin` must NEVER be able to fall back to a `SuperAdmin` role if a route is unmapped (Fail-Closed).
3. **Decouple Policy from Code:** Access rules must be designed as configurations that administrators can change without deploying code.
4. **Hybrid RBAC + PBAC Approach:** Use RBAC for stable job functions (e.g., Admin, Editor). Use PBAC for context-driven logic (e.g., Time of day, ownership, resource status).
5. **YAML SSOT (No Markdown Policies):** DO NOT use Markdown as the SSOT for access rules. The SSOT MUST be a machine-readable YAML file (`_iwish-output/2. Product Planning/2.7. access-control-policy.yaml`) so it is readable by non-technical stakeholders (PM/BA) but can be parsed by code.
6. **Concurrent Updates and File Locking:** When updating `access-control-policy.yaml`, you MUST use file-diffing, patching, or atomic file locking to prevent concurrent overwrites by multiple agents, which could lead to dropped security rules.
7. **Global Setting & Reference Injection:** The `2.7. access-control-policy.yaml` acts as a global setting. When generating or modifying Epics/Stories, agents MUST inject a reference to this global file to ensure development aligns with the planned access control architecture.
8. **Compilation (Filter-before-Fetch):** Ensure the YAML config can be compiled into (1) TS Types for UI visibility, (2) API Guards, and (3) Prisma Models/Seed data for relational integrity and query optimization.
9. **Drill-Down Configurations:** Design the PBAC tree so Main Features are governed by default roles, and Sub-Features can be toggled by policies.
10. **Trusted Auth Context Verification:** Tenant isolation policies MUST explicitly enforce that the `TenantID` is derived strictly from a trusted server-side authentication context (e.g., JWT token payload). You MUST NEVER trust a client-provided `TenantID` (from headers, query params, or body) for authorization boundaries, to prevent Tenant Impersonation (IDOR).

## Matrix Simulation (Adversarial Checking)
Before finalizing any PBAC/RBAC design, you MUST run a Threat Matrix Simulation:
- **Scenario 1 (Happy Path):** Valid user + Valid context = Access Granted.
- **Scenario 2 (Privilege Escalation Attempt):** Valid user trying to access a restricted Sub-Feature within their portal.
- **Scenario 3 (Context Violation):** Valid user + Invalid context (e.g. wrong IP, outside office hours, resource not owned by user) = Access Denied.
- **Scenario 4 (Cross-Tenant Leakage):** Valid `TenantAdmin` in Tenant A attempts to access resources belonging to Tenant B by spoofing the Tenant ID in the request. Must result in Access Denied.

## Red Flags — STOP and Reconsider
- 🚩 **Role Explosion:** Creating roles like `Admin_Finance_USA`. STOP. Use Attribute-Based policies (PBAC) instead.
- 🚩 **Hardcoding Roles in UI:** `if role == "Admin"` in frontend without backend validation. STOP. Enforce at the API boundary.
- 🚩 **Trusting Client Context:** Reading Tenant ID from `req.headers['x-tenant-id']` for data isolation checks. STOP. Use `req.user.tenantId` from verified tokens.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "Just hardcode the role check, it's faster." | Hardcoded checks lead to security debt. Externalize policy design to YAML. |
| "We can just put the PBAC rules in the Epic description." | No SSOT means drift. Put it in `2.7. access-control-policy.yaml` and inject a reference. |
| "Let's use Markdown for the SSOT." | Markdown is passive documentation and will drift. Use YAML so it can be compiled to TS/Prisma. |

## Industry Standards & Best Practices
- **Principle of Least Privilege (PoLP):** Default deny all access unless explicitly granted.
- **NIST ABAC/PBAC Guidelines:** Base authorization decisions on attributes of the subject, object, and environmental conditions.
