---
name: data-privacy-compliance-skill
description: "Scan DB schemas, detect PII, and generate data masking & GDPR logic including RTBF and data portability."
---

# Data Privacy & Compliance Skill

## Purpose
This skill provides structured capabilities for identifying Personally Identifiable Information (PII) within database schemas and generating compliant data masking, data export, and Right to Be Forgotten (RTBF) logic.

## When to Use
Trigger this skill whenever you are:
- Designing or auditing a database schema that handles user data.
- Implementing data deletion logic (GDPR RTBF).
- Implementing data export features (GDPR Data Portability).
- Configuring logging and masking rules for production data pipelines.

## Execution Steps

### 1. Schema Parsing & Chunking (AC7)
- If dealing with large schemas or heavily nested unstructured `JSONB` columns, explicitly chunk the input to prevent context overflow.
- **JSONB Strategy**: When encountering JSONB, document explicitly which known keys within the JSON payload are expected to contain PII and instruct the implementation on how to partially mask the JSON.

### 2. PII Identification (AC1)
Scan the provided data schema and tag fields categorized as PII. Examples include:
- `email`, `phone_number`, `ssn`, `date_of_birth`, `ip_address`, `address`
- First and last names, if combined with other identifiers.

### 3. Data Masking & Tokenization Rule Generation (AC2, AC6)
For each identified PII field, generate a specific masking rule:
- **Partial Redaction**: For emails (e.g., `j***@example.com`) or phone numbers.
- **Tokenization**: For sensitive exact matches (e.g., SSN).
- **PK/FK Constraint Handling**: If a PII field is used as a Primary Key or Foreign Key, **flag this as an integrity risk**. Do not apply destructive redaction; instead, propose format-preserving tokenization (FPT) or a surrogate key migration plan to maintain relational integrity.

### 4. GDPR Logic Definition (AC3, AC5)
- **Right to Be Forgotten (RTBF)**: Generate structured deletion queries or cascading soft-delete logic.
  - **CRITICAL CONFLICT CHECK**: Your logic *must* account for business rule conflicts. Before deleting a user record, include checks for active financial transactions, legal retention holds, or compliance audit requirements. If a hold exists, anonymize the profile rather than hard-deleting the transaction history.
- **Data Portability**: Define logic to aggregate and export a user's comprehensive data footprint into a standard format (e.g., JSON or CSV) upon request.

### 5. Output Safety Enforcement (AC4)
- **No Echoing**: When generating reports, summaries, or internal logs detailing the PII findings, you must strictly avoid echoing or quoting real PII sample data. Always enforce dummy-data replacement (e.g., `[REDACTED_EMAIL]`, `555-0199`) in your outputs.

## Required Outputs
When applying this skill, your final output must include:
1. An itemized list of identified PII fields.
2. The masking strategy mapped to each field.
3. Pseudocode or SQL/Prisma schema implementations for RTBF and Portability.
4. An explicit confirmation that retention hold conflicts and PK/FK integrity risks were checked.
