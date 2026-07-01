---
name: tenant-config-workflow
description: Use when rolling out, verifying, or auditing tenant configurations such as BYOK API keys and compliance levels. Do not use for user authentication.
---

# /tenant-config-workflow

## Objective
Automate the secure orchestration and validation of Tenant Settings, specifically BYOK API Keys and Compliance Level toggles.

## Prerequisites
- Tenant Admin privileges (RBAC verified).
- Target Tenant ID.

## Steps

### Step 1: Validate API Key (Zero-Trust)
Read and execute: `step-tc-01-validate-key.md`

### Step 2: Guard Compliance State
Read and execute: `step-tc-02-compliance-guard.md`

## Exit Criteria
- [ ] API keys are verified via external provider calls and stored securely.
- [ ] Compliance level transitions are audited and warned if downgrading.
- [ ] No API keys returned in plaintext.
