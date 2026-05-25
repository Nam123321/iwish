---
name: "create-data-governance-policy"
description: "Create data governance policy — PII classification, retention rules, access control, audit trails, compliance (GDPR/PDPA)"
agent: "data-architect"
phase: "3-solutioning"
---

# Create Data Governance Policy

## Pre-requisites
- Data Retention Validator SKILL at `{project-root}/.agent/skills/data-retention-validator/SKILL.md`
- Prisma schema accessible
- Regulatory requirements (GDPR, PDPA, or project-specific)

## Workflow Steps

### Step 1: Context Loading
1. Load validation SKILLs
2. Load Prisma schema from `{project-root}/distro/prisma/schema.prisma`
3. Load existing data-raci.md for ownership context

### Step 2: Data Classification
Classify ALL Prisma models by sensitivity:

| Level | Description | Examples | Handling |
|-------|------------|---------|---------|
| **PII-Critical** | Personally identifiable, financial | `Customer.phone`, `Order.totalAmount`, `Wallet.balance` | Encrypted at rest, masked in logs, access-controlled |
| **PII-Standard** | Personally identifiable, non-financial | `Customer.name`, `Customer.email`, `Address.*` | Access-controlled, anonymizable |
| **Business-Sensitive** | Trade secrets, pricing | `CTKM.discountRules`, `Product.costPrice` | Role-restricted, audit-logged |
| **Internal** | Operational data | `Order.status`, `Product.name` | Standard access controls |
| **Public** | Non-sensitive | `Product.description`, `ContentAsset.body` | No restrictions |

### Step 3: Retention Policy
For each data category, define retention rules:

| Entity | Active Retention | Archive After | Purge After | Legal Basis |
|--------|-----------------|---------------|-------------|-------------|
| Order | Indefinite (active) | 2 years → cold storage | 7 years (tax law) | Legal obligation |
| Customer PII | While active | 30 days after account deletion request | 90 days | Consent + Legal |
| Chat History | 1 year | Archive to S3 | 3 years | Legitimate interest |
| Audit Logs | 2 years | Archive | 5 years | Compliance |
| Session Data | 24 hours | — | 7 days | Performance |

### Step 4: Access Control Matrix
Define who can access what:

| Role | PII-Critical | PII-Standard | Business-Sensitive | Internal |
|------|-------------|-------------|-------------------|----------|
| Super Admin | Full | Full | Full | Full |
| Tenant Admin | Own tenant | Own tenant | Own tenant | Own tenant |
| Sales Rep | Masked | Own customers | Read-only | Read-only |
| API Service | Via service account | Via service account | Via service account | Full |

### Step 5: Audit Trail Requirements
Define what must be logged:
- All PII access events (who, when, what field, why)
- All data exports and downloads
- All permission changes
- All data deletion requests and execution
- All cross-tenant access attempts (should be zero)

### Step 6: Output
Save to `{output_folder}/data-specs/{scope}-data-governance-policy.md`.
Present to user for review.
