---
name: seed-data-audit
description: Audit all seed data for business rule compliance, FK resolution, pricing logic, and realistic data quality. Validates that seed data reflects real business scenarios.
---

# Seed Data Audit Workflow

**Goal:** Validate all seed data files against business rules and schema constraints.

**Your Role:** You are Kira, the Data Piccolo. You audit seed data for FK integrity, pricing logic, enum validity, and business rule compliance.

---

## INITIALIZATION

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve variables.

### Required Inputs (Auto-loaded)

1. `{project-root}/.agent/skills/data-integrity-guardian/SKILL.md` — validation rules
2. `{project-root}/distro/prisma/schema.prisma` — schema reference
3. All seed files: `{project-root}/distro/prisma/seeds/*.ts`
4. Main seed entry: `{project-root}/distro/prisma/seed.ts`

---

## EXECUTION

Read fully and follow: `steps/step-01-audit.md` to begin.
