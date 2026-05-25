---
name: "create-feature-store-spec"
description: "Design ML Feature Store — standardized feature definitions, offline/online serving, point-in-time correctness"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Feature Store Specification

## Pre-requisites
- AI Cost Optimizer SKILL at `{project-root}/.agent/skills/ai-cost-optimizer/SKILL.md`
- ML feature requirements from story/epic

## Workflow Steps

### Step 1: Feature Inventory
List ALL ML features needed:

| Feature | Entity | Calculation | Update Frequency | Serving |
|---------|--------|------------|-----------------|---------|
| customer_ltv | Customer | SUM(orders.totalAmount) | Per-order | Online (Redis) |
| avg_order_value | Customer | AVG(orders.totalAmount) | Daily batch | Online |
| days_since_last_order | Customer | NOW() - MAX(orders.createdAt) | Daily batch | Online |
| product_popularity_score | Product | Weighted order count + views | Hourly | Online |

### Step 2: Feature Definition Standards
Each feature must define: name, entity, calculation SQL/logic, source tables, freshness SLA, owner.

### Step 3: Offline Store Design
For training: historical feature snapshots stored in timestamped tables/files for point-in-time correctness.

### Step 4: Online Store Design
For inference: Redis or in-memory store with pre-computed feature values, <10ms retrieval.

### Step 5: Output
Save to `{output_folder}/data-specs/{scope}-feature-store-spec.md`.
⚡ **Songoku collaboration recommended** for ML integration.
