---
name: "pbac-intake-audit"
description: "Evaluates whether a story or feature requires Policy-Based Access Control (PBAC) or Role-Based Access Control (RBAC), mapping the access control requirements and determining if UI spec integration is necessary."
inputs:
  - name: "story_content"
    description: "The draft or existing user story text"
outputs:
  - name: "pbac_required"
    type: "boolean"
  - name: "access_control_matrix"
    type: "markdown_table"
---

# PBAC Intake & Assessment Audit

Use this skill during the Story Design (`/make-story`) and UI Specification (`/make-ui-spec`) workflows to systematically evaluate if a feature needs Policy-Based Access Control (PBAC).

---

## 🔍 1. Trigger Criteria (Evaluation Checklist)

An access control audit is **MANDATORY** if the story or feature meets ANY of the following criteria:
1. **Data Sensitivity**: Handles, reads, or exposes Personally Identifiable Information (PII), credentials, financial records, billing, or tenant-scoped assets.
2. **State Mutation**: Performs Create, Update, or Delete (CUD) operations on database models.
3. **Role-based UI States**: The user interface hides, disables, or alters sections, buttons, or pages based on who is logged in.
4. **Administrative Routes**: Integrates routes under administrative namespaces (e.g., `/api/admin/*`, `/api/settings/*`, or `/api/superadmin/*`).
5. **Multi-Tenant Boundaries**: The resource is tenant-scoped and must be protected from cross-tenant access.

---

## 🛠️ 2. Core Audit Dimensions

If access control is triggered, you must answer these four questions:
1. **Subject (Actors)**: Which roles need access? (e.g., `SuperAdmin`, `TenantAdmin`, `DepartmentAdmin`, `Member`, `Anonymous`).
2. **Object (Resource)**: What is the resource being accessed? (e.g., `TokenUsageLog`, `WikiPage`, `Invoice`).
3. **Action**: What specific operation is performed? (e.g., `view`, `create`, `edit`, `delete`, `approve`).
4. **Environment / Attributes (Context)**: What dynamic conditions apply? (e.g., `Only owner of resource`, `Only during billing grace period`, `Tenant status is active`).

---

## 📊 3. Output Requirements

### A. If PBAC is REQUIRED:
1. **Story Integration**: Insert a dedicated section `## 🔒 Access Control (PBAC)` in the story file containing:
   * **Verdict**: `Access_Control_Required: true`
   * **Access Control Matrix**:
     | Role | Resource | Action | Access (Allow/Deny) | Contextual Condition / Policy |
     |---|---|---|---|---|
   * **Risk Assessment**: A short summary of privilege escalation risks.
2. **UI Spec Integration**: In `ui-spec.md`, you **MUST** include:
   * The Access Control Matrix.
   * Specific visual states for unauthorized users (e.g., hidden buttons, disabled states with tooltips, or 403 error page routing) mapped in the `Interaction Flow & AC Verbs Validation` and `Screen Transitions & Interactive States` matrices.

### B. If PBAC is NOT REQUIRED:
1. **Story Integration**: Document the assessment:
   ```markdown
   ## 🔒 Access Control (PBAC)
   * Verdict: `Access_Control_Required: false` (Reason: Static public marketing page / no data mutations / no role-specific UI elements).
   ```
2. **UI Spec Integration**: You **MAY SKIP** adding the Access Control Matrix and access state transitions, keeping the UI spec lightweight.

---

## 🛡️ Threat Scenarios (Adversarial Check)
When access control is required, verify:
- **IDOR Prevention**: Is the `TenantID` or `UserID` checked server-side from the auth context rather than trusted from client headers/payloads?
- **Fail-Closed**: If a user role is undefined or an action is unmapped, does the system block access by default?
