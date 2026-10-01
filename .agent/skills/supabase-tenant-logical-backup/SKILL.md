---
name: "Supabase Tenant Logical Backup"
description: >
  Configures and executes RLS-filtered logical pg_dump and pg_restore for isolated 
  tenant data recovery without affecting the global cluster state.
cwi_hint: 100
status: active
created_by: create-skill
---

# Supabase Tenant Logical Backup Skill

## Purpose
Provides a safe, isolated method for backing up and restoring specific tenant data in a multi-tenant Supabase PostgreSQL database using Row-Level Security (RLS) filtered logical dumps. This prevents tenant-specific recovery operations from overwriting the global cluster state or leaking other tenants' data.

## When to Use
- When a single tenant requests a data export.
- When recovering a single tenant's data after accidental deletion or corruption.
- When migrating a specific tenant between environments without a full cluster restore.
- When Point-in-Time Recovery (PITR) is unacceptable because it would roll back all tenants.

## Execution Requirements
- **Target Tables**: Must have RLS enabled and properly configured tenant isolation policies.
- **Roles**: Must use a database role that does NOT have `BYPASSRLS` privileges for the data extraction phase.

## Workflow: Extraction (pg_dump)

Standard `pg_dump` typically runs as `postgres` (superuser), which bypasses RLS. To respect RLS for a specific tenant, you must use a restricted role and set the tenant context.

1. **Schema Extraction (Optional)**: 
   Extract the schema separately using the superuser role.
   ```bash
   pg_dump -d "$DB_URL" --schema-only > tenant_schema.sql
   ```

2. **Tenant Context Setup**:
   Ensure your database is configured to default a restricted role's session to the target tenant, or use a tool/script that wraps the connection and sets `app.current_tenant = '<tenant-id>'`.

3. **Data Extraction**:
   Run `pg_dump` using the restricted role to enforce RLS filtering.
   ```bash
   pg_dump -d "$DB_URL" --data-only --role=restricted_tenant_role > tenant_data.sql
   ```

## Workflow: Restoration (pg_restore)

1. **Verify Isolation**: Inspect the `tenant_data.sql` to ensure no cross-tenant leakage occurred.
2. **Apply Data**: 
   ```bash
   psql -d "$TARGET_DB_URL" -f tenant_data.sql
   ```

## Constraints & Security
- **FORBIDDEN**: Never use PITR for single-tenant recovery in a shared cluster.
- **CRITICAL**: Always verify that the role executing the data dump lacks the `BYPASSRLS` attribute.
- **CRITICAL**: Clean up any temporary credentials or roles immediately after the extraction/restoration process.
