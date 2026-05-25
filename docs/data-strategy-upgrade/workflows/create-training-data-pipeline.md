---
name: "create-training-data-pipeline"
description: "Design ML training data pipeline — labeling, versioning, bias detection, data splits"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Training Data Pipeline

## Pre-requisites
- Feature Store Spec (if exists)
- ML model requirements from story/epic

## Workflow Steps

### Step 1: Training Data Source Identification
List all data sources needed for model training:

| Source | Entity | Fields | Volume | Label Source |
|--------|--------|--------|--------|-------------|
| Historical orders | Order | items, amounts, dates | ~100K records | order.status (completed/cancelled) |
| Customer interactions | ChatHistory | messages, intent | ~50K sessions | Manual labels / LLM-assisted |

### Step 2: Data Labeling Strategy
| Method | Use When | Cost | Accuracy |
|--------|----------|------|----------|
| Direct signal | Outcome is observable (purchase/no-purchase) | Free | High |
| LLM-assisted | Text classification, sentiment | Low | Medium-High |
| Human annotation | Complex judgement, edge cases | High | Highest |
| Weak supervision | Large unlabeled dataset | Low | Variable |

### Step 3: Data Versioning
Use DVC or custom version tracking: each training run links to exact dataset version.

### Step 4: Bias Detection
Check for: class imbalance, demographic bias, temporal bias, sampling bias.

### Step 5: Data Split Strategy
Train:Validation:Test = 70:15:15 with stratified sampling by tenant and time period.

### Step 6: Output
Save to `{output_folder}/data-specs/{scope}-training-data-pipeline.md`.
⚡ **Songoku collaboration recommended** for model integration.
