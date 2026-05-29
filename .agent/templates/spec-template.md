# Specification: {{Title}}

**Version:** 1.0.0
**Status:** Under Review
**Last Updated:** {{Date}}

---

## 1. Overview

Provide the high-level context of this specification.

---

## 2. Functional Requirements

All functional requirements must be measurable and testable. If details are missing, use the standard `[NEEDS CLARIFICATION]` marker.

- **FR1**: The system must allow users to log in via email and password.
- **FR2**: The system must display a dashboard summary after login.
  - Detail: The dashboard should display {{Metric_Name}} [NEEDS CLARIFICATION: What exact metrics should be shown on the home dashboard summary?]
- **FR3**: The user must be able to export reports in {{Export_Format}} format [NEEDS CLARIFICATION: What export formats are required? e.g., PDF, CSV, Excel, or JSON?]

---

## 3. Data Schema & Requirements

Identify entities and data fields.

- **Entity**: User
  - Fields: `id`, `email`, `password_hash`, `role`.
- **Entity**: Profile [NEEDS CLARIFICATION: What fields are required in the Profile entity? Do we need avatar URL, full name, address, or phone?]

---

## 4. Validation Gate Check

Run validation check to ensure all `[NEEDS CLARIFICATION]` tags are resolved before moving to the next workflow.
- **Checked Status:** [ ] No unresolved markers found in this document.
