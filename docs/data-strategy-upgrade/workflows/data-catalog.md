---
name: "data-catalog"
description: "Generate entity registry — auto-list all Prisma models, relationships, and usage purpose as a living Data Catalog"
agent: "data-architect"
phase: "3-solutioning"
---

# Data Catalog Generation

## Pre-requisites
- Prisma schema accessible at `{project-root}/distro/prisma/schema.prisma`

## Workflow Steps

### Step 1: Schema Parsing
1. Load Prisma schema
2. Extract ALL models, enums, and their fields
3. Extract ALL relations (1:1, 1:N, N:M)

### Step 2: Entity Registry
Generate a table for each model:

| Model | Fields | Relations | Purpose | Owner |
|-------|--------|-----------|---------|-------|
| Order | id, tenantId, customerId, totalAmount, status... | → Customer, → OrderItem[], → Payment | Core sales transaction | Sales Module |

### Step 3: Relationship Map
Generate Mermaid ERD showing all model relationships.

### Step 4: Usage Classification
For each model, classify: Core Business / Supporting / Analytics / System / Archive

### Step 5: Output
Save to `{output_folder}/data-specs/data-catalog.md`.
Auto-update when schema changes are detected.
