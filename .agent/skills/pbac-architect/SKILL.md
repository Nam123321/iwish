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
1. **Decouple Policy from Code:** Access rules must be designed as configurations that administrators can change without deploying code.
2. **Hybrid RBAC + PBAC Approach:** Use RBAC for stable job functions (e.g., Admin, Editor). Use PBAC for context-driven logic (e.g., Time of day, ownership, resource status).
3. **YAML SSOT (No Markdown Policies):** DO NOT use Markdown as the SSOT for access rules. The SSOT MUST be a machine-readable YAML file (`_iwish-output/2. Product Planning/2.7. access-control-policy.yaml`) so it is readable by non-technical stakeholders (PM/BA) but can be parsed by code.
4. **Global Setting & Reference Injection:** The `2.7. access-control-policy.yaml` acts as a global setting. When generating or modifying Epics/Stories, agents MUST inject a reference to this global file to ensure development aligns with the planned access control architecture.
5. **Compilation (Filter-before-Fetch):** Ensure the YAML config can be compiled into (1) TS Types for UI visibility, (2) API Guards, and (3) Prisma Models/Seed data for relational integrity and query optimization.
6. **Drill-Down Configurations:** Design the PBAC tree so Main Features are governed by default roles, and Sub-Features can be toggled by policies.

## Matrix Simulation (Adversarial Checking)
Before finalizing any PBAC/RBAC design, you MUST run a Threat Matrix Simulation:
- **Scenario 1 (Happy Path):** Valid user + Valid context = Access Granted.
- **Scenario 2 (Privilege Escalation Attempt):** Valid user trying to access a restricted Sub-Feature.
- **Scenario 3 (Context Violation):** Valid user + Invalid context (e.g. wrong IP, outside office hours, resource not owned by user) = Access Denied.

## Red Flags — STOP and Reconsider
- 🚩 **Role Explosion:** Creating roles like `Admin_Finance_USA`. STOP. Use Attribute-Based policies (PBAC) instead.
- 🚩 **Hardcoding Roles in UI:** `if role == "Admin"` in frontend without backend validation. STOP. Enforce at the API boundary.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "Just hardcode the role check, it's faster." | Hardcoded checks lead to security debt. Externalize policy design to YAML. |
| "We can just put the PBAC rules in the Epic description." | No SSOT means drift. Put it in `2.7. access-control-policy.yaml` and inject a reference. |
| "Let's use Markdown for the SSOT." | Markdown is passive documentation and will drift. Use YAML so it can be compiled to TS/Prisma. |

## Industry Standards & Best Practices
- **Principle of Least Privilege (PoLP):** Default deny all access unless explicitly granted.
- **NIST ABAC/PBAC Guidelines:** Base authorization decisions on attributes of the subject, object, and environmental conditions.
