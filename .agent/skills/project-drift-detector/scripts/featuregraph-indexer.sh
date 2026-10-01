#!/usr/bin/env bash
# FeatureGraph Indexer for I-Wish Anti-Drift V4
# Enforces: FalkorDB configuration, PROJECT_ID injection, and strict Node ID structure

PROJECT_ID="${PROJECT_ID:-unknown_project}"
EPOCH="${EPOCH:-$(date +%s)}"
FALKORDB_HOST="${FALKORDB_HOST:-localhost}"
FALKORDB_PORT="${FALKORDB_PORT:-6379}"  # Standard profile port (6379 or 6380)

GRAPH_KEY="iwish:${PROJECT_ID}:featuregraph"
NODE_ID="iwish:${PROJECT_ID}:featuregraph:${EPOCH}"

echo "[INFO] Indexing to FalkorDB at $FALKORDB_HOST:$FALKORDB_PORT"
echo "[INFO] Node ID: $NODE_ID"

# Add PROJECT_ID to all Cypher queries
CYPHER_QUERY="MERGE (n:FeatureGraphNode {id: '${NODE_ID}', projectId: '${PROJECT_ID}', epoch: '${EPOCH}'}) RETURN n"

redis-cli -h "$FALKORDB_HOST" -p "$FALKORDB_PORT" GRAPH.QUERY "$GRAPH_KEY" "$CYPHER_QUERY"

echo "[SUCCESS] FeatureGraph node indexed."
