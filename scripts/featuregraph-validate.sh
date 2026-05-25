#!/bin/bash
# ==============================================================
# FeatureGraph Validation Script — Cross-Check 3 Lớp (AC5)
# Chạy SAU khi featuregraph-indexer.sh hoàn tất
# ==============================================================

set -euo pipefail

FALKORDB_HOST="${FALKORDB_HOST:-localhost}"
FALKORDB_PORT="${FALKORDB_PORT:-6379}"
GRAPH_NAME="featuregraph"
PROJECT_ROOT="${1:-.}"
PLANNING_DIR="${PROJECT_ROOT}/_bmad-output/planning-artifacts"
REVIEW_QUEUE="${PROJECT_ROOT}/_bmad-output/featuregraph-review-queue.yaml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

cypher_query() {
  redis-cli -h "$FALKORDB_HOST" -p "$FALKORDB_PORT" \
    GRAPH.QUERY "$GRAPH_NAME" "$1" 2>&1
}

echo "=============================================="
echo " FeatureGraph Validator v1.0 (Cross-Check 3 Lớp)"
echo "=============================================="

# ==============================================================
# LỚP 1: Automated Validation (Structural Checks)
# ==============================================================
echo -e "\n${YELLOW}=== LỚP 1: Automated Validation ===${NC}"

# 1a. Orphan Story Check
echo -n "  Orphan Stories (no FR link)... "
ORPHAN_STORIES=$(cypher_query "
  MATCH (s:Story) WHERE NOT (:FR)-[:IMPLEMENTED_BY]->(s)
  RETURN s.id, s.name
")
ORPHAN_COUNT=$(echo "$ORPHAN_STORIES" | grep -c "s.id" 2>/dev/null || echo "0")
if [ "$ORPHAN_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $ORPHAN_COUNT orphan(s) found${NC}"
  echo "$ORPHAN_STORIES"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ None${NC}"
fi

# 1b. Dead End FR Check (MVP FRs without stories)
echo -n "  Dead End FRs (MVP, no Story)... "
DEAD_ENDS=$(cypher_query "
  MATCH (fr:FR) WHERE fr.phase = 'MVP' AND NOT (fr)-[:IMPLEMENTED_BY]->(:Story)
  RETURN fr.id, fr.name
")
DEAD_COUNT=$(echo "$DEAD_ENDS" | grep -c "fr.id" 2>/dev/null || echo "0")
if [ "$DEAD_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $DEAD_COUNT dead-end FR(s)${NC}"
  echo "$DEAD_ENDS"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ None${NC}"
fi

# 1c. Cycle Detection
echo -n "  Circular IMPACTS chains... "
CYCLES=$(cypher_query "
  MATCH (fr:FR)-[:IMPACTS*2..6]->(fr)
  RETURN DISTINCT fr.id LIMIT 10
")
CYCLE_COUNT=$(echo "$CYCLES" | grep -c "fr.id" 2>/dev/null || echo "0")
if [ "$CYCLE_COUNT" -gt 0 ]; then
  echo -e "${RED}🔴 CRITICAL: $CYCLE_COUNT cycle(s) detected!${NC}"
  echo "$CYCLES"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ None${NC}"
fi

# ==============================================================
# LỚP 2: Data Cross-Check (Source Parity)
# ==============================================================
echo -e "\n${YELLOW}=== LỚP 2: Data Cross-Check ===${NC}"

# 2a. FR Count Match
echo -n "  FR count: Graph vs PRD... "
GRAPH_FR=$(cypher_query "MATCH (fr:FR) RETURN count(fr) AS c" | grep -oE '[0-9]+' | tail -1 || echo "0")
PRD_FR=$(grep -cE '^\s*#{1,4}\s*FR[0-9]+' "$PLANNING_DIR/prd.md" 2>/dev/null || echo "0")
if [ "$GRAPH_FR" = "$PRD_FR" ]; then
  echo -e "${GREEN}✅ Match ($GRAPH_FR)${NC}"
else
  echo -e "${YELLOW}⚠️ Mismatch: Graph=$GRAPH_FR, PRD=$PRD_FR${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 2b. Portal Count Match
echo -n "  Portal count: Graph vs feature-hierarchy... "
GRAPH_PORTALS=$(cypher_query "MATCH (p:Portal) RETURN count(p) AS c" | grep -oE '[0-9]+' | tail -1 || echo "0")
echo -e "Graph has ${GREEN}$GRAPH_PORTALS${NC} portals"

# 2c. Epic Count Match
echo -n "  Epic count: Graph vs epics.md... "
GRAPH_EPICS=$(cypher_query "MATCH (e:Epic) RETURN count(e) AS c" | grep -oE '[0-9]+' | tail -1 || echo "0")
EPICS_FILE=$(grep -cE '^\s*#{1,3}\s*Epic\s+[0-9]+' "$PLANNING_DIR/epics.md" 2>/dev/null || echo "0")
if [ "$GRAPH_EPICS" = "$EPICS_FILE" ]; then
  echo -e "${GREEN}✅ Match ($GRAPH_EPICS)${NC}"
else
  echo -e "${YELLOW}⚠️ Mismatch: Graph=$GRAPH_EPICS, File=$EPICS_FILE${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# ==============================================================
# LỚP 3: Human-In-The-Loop (Low Confidence Detection)
# ==============================================================
echo -e "\n${YELLOW}=== LỚP 3: Human-In-The-Loop ===${NC}"

# 3a. Find low-confidence relationships
echo -n "  Low confidence relationships (< 0.8)... "
LOW_CONF=$(cypher_query "
  MATCH (fr1:FR)-[r:IMPACTS]->(fr2:FR) 
  WHERE r.confidence < 0.8
  RETURN fr1.id, type(r), fr2.id, r.confidence, r.reason
  ORDER BY r.confidence
")
LOW_COUNT=$(echo "$LOW_CONF" | grep -c "fr1.id" 2>/dev/null || echo "0")

if [ "$LOW_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $LOW_COUNT relationship(s) need Master review${NC}"
  
  # Generate review-queue.yaml
  echo "# FeatureGraph Review Queue — Auto-generated" > "$REVIEW_QUEUE"
  echo "# Relationships with confidence < 0.8 need Master approval" >> "$REVIEW_QUEUE"
  echo "# Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REVIEW_QUEUE"
  echo "" >> "$REVIEW_QUEUE"
  echo "pending_reviews:" >> "$REVIEW_QUEUE"
  echo "$LOW_CONF" >> "$REVIEW_QUEUE"
  
  echo "  → Review queue saved to: $REVIEW_QUEUE"
else
  echo -e "${GREEN}✅ All relationships high confidence${NC}"
fi

# ==============================================================
# SUMMARY
# ==============================================================
echo ""
echo "=============================================="
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}🔴 VALIDATION FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️ VALIDATION PASSED WITH $WARNINGS WARNING(S)${NC}"
else
  echo -e "${GREEN}✅ ALL CHECKS PASSED — FeatureGraph is clean!${NC}"
fi
echo "=============================================="
