---
description: 'FeatureGraph README — Integration guide for the Feature Knowledge Graph module within the BMAD Code Intelligence Pack'
---

# 🧠 FeatureGraph — Feature Knowledge Graph for AI Agents

Part of the **BMAD Code Intelligence Pack**.

## Overview

FeatureGraph provides AI Agents with **cross-feature awareness** — the ability to understand how product features relate to each other at the business logic level, complementing CodeGraph's code-level dependency analysis.

```
CodeGraph:    "Who calls PricingService?"     → 12 files
FeatureGraph: "What breaks if Pricing changes?" → 8 features across 4 portals
```

## Architecture

- **Database:** FalkorDB (same instance as CodeGraph)
- **Keyspace:** `featuregraph` (Multi-Graph, isolated from `codegraph`)
- **Query Language:** Cypher (via MCP tools)
- **Data Source:** PRD, Epics, Stories, Feature-Hierarchy (Markdown files)

## Files

| File | Purpose |
|---|---|
| `featuregraph-schema.cypher` | Node types, relationships, indexes |
| `featuregraph-mcp-tools.md` | 6 MCP tool specifications |
| `../../scripts/featuregraph-indexer.sh` | 4-step ETL pipeline |
| `../../scripts/featuregraph-validate.sh` | Cross-Check 3 Layers validation |

## Quick Start

```bash
# 1. Ensure FalkorDB is running (already running for CodeGraph)
docker ps | grep falkordb

# 2. Run the indexer
./scripts/featuregraph-indexer.sh /path/to/project

# 3. Validate the graph
./scripts/featuregraph-validate.sh /path/to/project

# 4. Query via MCP tools in Agent workflows
# feature_impact("FR8", 2)
# cross_feature("FR8", "FR29") 
```

## Consumer Workflows

These workflows query FeatureGraph via MCP:
- `/dev-story` — Step 2 Context Gathering
- `/code-review` — Step 1 Dependency Gate
- `/fix-bug` — Phase 2 Step 8e + Phase 3 RCA
- `/impact-analysis` — Standalone PM/Architect tool

## Producer Workflows

These workflows create data that feeds the Indexer (they do NOT query the graph):
- `/create-prd` — Generates FR definitions
- `/create-epics-and-stories` — Groups FRs into Epics
- `/create-story` — Individual story with `## Cross-Feature Dependencies` section
