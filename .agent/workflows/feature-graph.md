---
name: feature-graph
description: Run the FeatureGraph indexer to populate FalkorDB with feature dependency data.
category: graph
---

# /feature-graph

Canonical workflow name for executing the FeatureGraph indexer pipeline.

## Overview

This workflow triggers the `iwish featuregraph-index` command which parses all product management markdown files (`PRD`, `Epics`, `Stories`, and `Feature-Hierarchy`) and injects them into the `featuregraph` keyspace in FalkorDB.

## Execution

Execute the following command to run the indexer:

```bash
iwish featuregraph-index
```
