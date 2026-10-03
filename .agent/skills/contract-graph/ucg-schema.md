# Unified Contract Graph (UCG) Schema Specification

This document defines the formal schema for the FalkorDB UCG database.

## 1. Node Labels & Properties

### 1.1 `(:PrismaModel)`
Represents physical schema models defined in `prisma/schema.prisma`.
- `name` (STRING, UNIQUE INDEX): PascalCase model name (e.g., `Tenant`, `User`).
- `fields_count` (INTEGER): Number of scalar and relation fields.
- `field_names` (LIST OF STRING): JSON-serialized list of field names.
- `enums_count` (INTEGER): Associated enum count.
- `hash` (STRING): SHA-256 hash of model AST definition.
- `drift_status` (STRING): One of `ALIGNED`, `CODE_ONLY`, `ORPHANED`, `PARTIAL`.

### 1.2 `(:PlanningEntity)`
Represents logical data entities planned in `2.2. database-spec.md`.
- `name` (STRING, UNIQUE INDEX): Entity name.
- `section` (STRING): Section number in spec (e.g., `Section 99`, `Section 4.1`).
- `planned_fields` (LIST OF STRING): List of planned fields.
- `drift_status` (STRING): One of `ALIGNED`, `PLANNED`, `PLANNED_NOT_BUILT`.

### 1.3 `(:UIComponent)`
Represents frontend components found in `src/components/**/*.tsx`.
- `name` (STRING, UNIQUE INDEX): Component name (e.g., `TenantSelector`).
- `path` (STRING): Relative file path.
- `props` (LIST OF STRING): Exported prop names.
- `api_calls` (LIST OF STRING): Endpoint URLs or route hooks invoked.

### 1.4 `(:APIEndpoint)`
Represents backend Fastify/REST routes declared in `server/**/*.routes.ts`.
- `key` (STRING, UNIQUE INDEX): Combination of `METHOD:PATH` (e.g., `POST:/api/tenants`).
- `method` (STRING): HTTP Verb (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
- `path` (STRING): URL route path.
- `handler_file` (STRING): Source file declaring the route.

### 1.5 `(:Story)`
Represents individual development stories.
- `story_id` (STRING, UNIQUE INDEX): e.g., `Story-10.10`.
- `epic_id` (STRING): e.g., `Epic-10`.
- `value_stream` (STRING): e.g., `VS-03. Workflow & Automation`.
- `status` (STRING): `completed`, `in-progress`, `planned`.

---

## 2. Relationship Types & Semantics

| Edge Type | Source Node | Target Node | Properties | Description |
|:---|:---:|:---:|:---|:---|
| `MAPS_TO` | `PlanningEntity` | `PrismaModel` | `confidence` (FLOAT), `mapped_at` (TIMESTAMP) | Physical code implementation of planned entity |
| `CLAIMED_BY`| `PrismaModel` | `Story` | `role` (`OWNER`\|`CONTRIBUTOR`), `operations` (LIST) | Story claims ownership or mutation right |
| `CALLS` | `UIComponent` | `APIEndpoint` | `hook` (STRING), `async` (BOOLEAN) | UI component executes API route |
| `MUTATES` | `APIEndpoint` | `PrismaModel` | `operations` (`CREATE`\|`UPDATE`\|`DELETE`) | API endpoint modifies database model |
| `READS` | `APIEndpoint` | `PrismaModel` | `fields` (LIST) | API endpoint queries database model |
| `DEPENDS_ON`| `Story` | `Story` | `reason` (STRING) | Inter-story dependency |

---

## 3. Drift Classification Hierarchy (7 States)

1. `ALIGNED`: Present across Planning Entity, Story Manifest, and Prisma Code.
2. `PARTIAL`: Present in 2 of the 3 sources (e.g., Prisma + Planning, but no story claimed).
3. `PHANTOM`: Present only in Story Manifests without Prisma code or Planning record.
4. `ORPHANED`: Present only in Prisma schema without Planning record or Story claim.
5. `CODE_ONLY`: Present in Prisma schema + Story claim, but missing from `2.2. database-spec.md`.
6. `PLANNED_NOT_BUILT`: Present in Planning Spec but not yet created in Prisma schema.
7. `PLANNED`: Present in Planning Spec without an assigned story.
