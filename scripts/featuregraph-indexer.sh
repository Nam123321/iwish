#!/bin/bash
# ==============================================================
# FeatureGraph Indexer — 4-Step Pipeline (Story 14.3)
# Parse PRD, Epics, Stories, Feature-Hierarchy → FalkorDB
# Includes: IMPACTS parser, dual Story-ID regex, path fallback
# ==============================================================
# IMPORTANT: Uses Multi-Graph keyspace "featuregraph"
# All GRAPH.QUERY commands target "featuregraph", NOT "codegraph"
# ==============================================================

set -euo pipefail

# --- Configuration ---
FALKORDB_HOST="${FALKORDB_HOST:-localhost}"
FALKORDB_PORT="${FALKORDB_PORT:-6379}"
GRAPH_NAME="featuregraph"
PROJECT_ROOT="${1:-.}"

# --- Path Resolution (AC1): _iwish-output/ first, _bmad-output/ fallback ---
resolve_paths() {
  if [ -d "${PROJECT_ROOT}/_iwish-output" ]; then
    local BASE="${PROJECT_ROOT}/_iwish-output"
    log "Path resolution: using _iwish-output/"
  elif [ -d "${PROJECT_ROOT}/_bmad-output" ]; then
    local BASE="${PROJECT_ROOT}/_bmad-output"
    warn "Path resolution: falling back to _bmad-output/ (legacy)"
  else
    error "No _iwish-output/ or _bmad-output/ directory found at ${PROJECT_ROOT}"
    exit 1
  fi

  # Planning artifacts: check for planning-artifacts/ subdirectory, then base
  if [ -d "${BASE}/planning-artifacts" ]; then
    PLANNING_DIR="${BASE}/planning-artifacts"
  else
    PLANNING_DIR="${BASE}"
  fi

  # Stories directory
  if [ -d "${BASE}/stories" ]; then
    STORIES_DIR="${BASE}/stories"
  else
    STORIES_DIR="${BASE}"
  fi

  OUTPUT_LOG="${BASE}/featuregraph-index.log"
  REVIEW_QUEUE="${BASE}/featuregraph-review-queue.yaml"

  # Feature Hierarchy: canonical path first, then fallback
  if [ -f "${BASE}/2. Product Planning/2.5. feature-hierarchy.md" ]; then
    FEATURE_HIERARCHY_PATH="${BASE}/2. Product Planning/2.5. feature-hierarchy.md"
  elif [ -f "${PLANNING_DIR}/feature-hierarchy.md" ]; then
    FEATURE_HIERARCHY_PATH="${PLANNING_DIR}/feature-hierarchy.md"
  else
    FEATURE_HIERARCHY_PATH=""
  fi

  # Epics file: canonical path first, then fallback
  if [ -f "${BASE}/2. Product Planning/2.4. epics-and-stories.md" ]; then
    EPICS_FILE_PATH="${BASE}/2. Product Planning/2.4. epics-and-stories.md"
  elif [ -f "${PLANNING_DIR}/epics.md" ]; then
    EPICS_FILE_PATH="${PLANNING_DIR}/epics.md"
  else
    EPICS_FILE_PATH=""
  fi

  log "  PLANNING_DIR = ${PLANNING_DIR}"
  log "  STORIES_DIR  = ${STORIES_DIR}"
  if [ -n "$FEATURE_HIERARCHY_PATH" ]; then
    log "  FEATURE_HIERARCHY = ${FEATURE_HIERARCHY_PATH}"
  else
    warn "  FEATURE_HIERARCHY = NOT FOUND (run /feature-hierarchy to generate)"
  fi
}

# Placeholders — set by resolve_paths()
PLANNING_DIR=""
STORIES_DIR=""
OUTPUT_LOG=""
REVIEW_QUEUE=""
FEATURE_HIERARCHY_PATH=""

# --- Garbage Filter Lists (IGNORE patterns) ---
IGNORE_DIRS="archive|templates|drafts|meeting-notes|backups"
IGNORE_FILES="sprint-status.yaml|bug-tracker.yaml|template-*.md|raw-notes.md|meeting-*.md"
IGNORE_CONTENT_PATTERNS="~~.*~~|TODO:|FIXME:|This document outlines|This section describes"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INDEXER]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

cypher_query() {
  redis-cli -h "$FALKORDB_HOST" -p "$FALKORDB_PORT" \
    GRAPH.QUERY "$GRAPH_NAME" "$1" 2>&1
}

# --- FalkorDB Availability Check (AC6) ---
check_falkordb() {
  log "Checking FalkorDB availability at ${FALKORDB_HOST}:${FALKORDB_PORT}..."
  if ! redis-cli -h "$FALKORDB_HOST" -p "$FALKORDB_PORT" PING 2>/dev/null | grep -qi "PONG"; then
    error "FalkorDB is not reachable at ${FALKORDB_HOST}:${FALKORDB_PORT}"
    error "Please start FalkorDB first:  docker start falkordb"
    error "Or run:  docker run -d --name falkordb -p 6379:6379 falkordb/falkordb"
    exit 1
  fi
  success "FalkorDB is running"
}

# ==============================================================
# STEP 1: DISCOVERY — Scan & Filter Garbage
# ==============================================================
step1_discovery() {
  log "Step 1: DISCOVERY — Scanning planning artifacts..."
  
  # Validate required files exist
  if [ ! -f "$PLANNING_DIR/prd.md" ]; then
    error "prd.md not found at $PLANNING_DIR/prd.md"
    exit 1
  fi

  # List files to process (exclude garbage)
  VALID_FILES=()
  
  while IFS= read -r file; do
    basename=$(basename "$file")
    dirpath=$(dirname "$file")
    
    # Skip IGNORE_DIRS
    if echo "$dirpath" | grep -qE "$IGNORE_DIRS"; then
      warn "Skipping (ignored dir): $file"
      continue
    fi
    
    # Skip IGNORE_FILES  
    if echo "$basename" | grep -qE "$IGNORE_FILES"; then
      warn "Skipping (ignored file): $basename"
      continue
    fi
    
    VALID_FILES+=("$file")
  done < <(find "$PLANNING_DIR" "$STORIES_DIR" -name "*.md" -o -name "*.yaml" 2>/dev/null)
  
  success "Discovery complete: ${#VALID_FILES[@]} valid files found"
}

# ==============================================================
# STEP 2: EXTRACTION — Parse Files with Content Filtering
# ==============================================================
step2_extraction() {
  log "Step 2: EXTRACTION — Parsing planning documents..."

  # --- Parse PRD → FR nodes ---
  log "  Parsing prd.md for FR nodes..."
  FR_COUNT=0
  while IFS= read -r line; do
    # Skip strikethrough lines
    if echo "$line" | grep -qE '~~.*~~'; then
      warn "  Skipping strikethrough: $line"
      continue
    fi
    
    # Extract FR ID and name (pattern: FR## — Name or FR##: Name)
    if echo "$line" | grep -qE '^[#]*\s*FR[0-9]+'; then
      FR_ID=$(echo "$line" | grep -oE 'FR[0-9]+' | head -1)
      FR_NAME=$(echo "$line" | sed "s/.*${FR_ID}[[:space:]]*[—:–-][[:space:]]*//" | sed 's/[*#]//g' | xargs)
      
      if [ -n "$FR_ID" ] && [ -n "$FR_NAME" ]; then
        cypher_query "MERGE (fr:FR {id: '${FR_ID}'}) SET fr.name = '${FR_NAME}', fr.updated_at = timestamp()" > /dev/null
        FR_COUNT=$((FR_COUNT + 1))
      fi
    fi
  done < "$PLANNING_DIR/prd.md"
  success "  Extracted $FR_COUNT FR nodes from prd.md"

  # --- Parse epics.md → Epic nodes ---
  log "  Parsing epics file for Epic nodes..."
  EPIC_COUNT=0
  if [ -n "$EPICS_FILE_PATH" ]; then
    while IFS= read -r line; do
      if echo "$line" | grep -qE '^#+\s*Epic\s+[0-9]+'; then
        EPIC_ID=$(echo "$line" | grep -oE '[0-9]+' | head -1)
        EPIC_NAME=$(echo "$line" | sed "s/.*Epic[[:space:]]*${EPIC_ID}[[:space:]]*[—:–-][[:space:]]*//" | sed 's/[*#]//g' | xargs)
        
        cypher_query "MERGE (e:Epic {id: 'E${EPIC_ID}'}) SET e.name = '${EPIC_NAME}', e.updated_at = timestamp()" > /dev/null
        EPIC_COUNT=$((EPIC_COUNT + 1))
      fi
    done < "$EPICS_FILE_PATH"
  fi
  success "  Extracted $EPIC_COUNT Epic nodes"

  # --- Parse feature-hierarchy.md → Portal nodes ---
  log "  Parsing feature-hierarchy.md for Portal nodes..."
  PORTAL_COUNT=0
  if [ -n "$FEATURE_HIERARCHY_PATH" ]; then
    for portal in "admin" "webstore" "sales-web" "sales-app" "driver-app"; do
      if grep -qi "$portal" "$FEATURE_HIERARCHY_PATH"; then
        cypher_query "MERGE (p:Portal {name: '${portal}'}) SET p.updated_at = timestamp()" > /dev/null
        PORTAL_COUNT=$((PORTAL_COUNT + 1))
      fi
    done
  fi
  success "  Extracted $PORTAL_COUNT Portal nodes"

  # --- Parse story files → Story nodes (AC3: dual-format Story ID) ---
  log "  Parsing story files..."
  STORY_COUNT=0
  if [ -d "$STORIES_DIR" ]; then
    find "$STORIES_DIR" -name "*.md" -not -path "*archive*" | while read -r story_file; do
      # AC3: Accept both "Story {N}.{M}" and "S{N}.{M}" formats, normalize to S{N}.{M}
      RAW_ID=$(grep -oE '(Story[[:space:]]+|S)[0-9]+\.[0-9]+' "$story_file" | head -1 || echo "")
      STORY_ID=$(echo "$RAW_ID" | sed -E 's/^Story[[:space:]]+/S/')
      STORY_NAME=$(head -5 "$story_file" | grep -E '^#' | head -1 | sed 's/^#*[[:space:]]*//' | xargs)
      EPIC_REF=$(grep -oE 'E[0-9]+' "$story_file" | head -1 || echo "")
      
      if [ -n "$STORY_ID" ]; then
        cypher_query "MERGE (s:Story {id: '${STORY_ID}'}) SET s.name = '${STORY_NAME}', s.epic_id = '${EPIC_REF}', s.updated_at = timestamp()" > /dev/null
        STORY_COUNT=$((STORY_COUNT + 1))
      fi
    done
  fi
  success "  Extracted $STORY_COUNT Story nodes"
}

# ==============================================================
# STEP 3: MAPPING & SCORING — Build Relationships
# ==============================================================
step3_mapping() {
  log "Step 3: MAPPING — Building relationships..."
  
  # --- FR → Epic relationships from epics file ---
  log "  Mapping FR → Epic (BELONGS_TO)..."
  if [ -n "$EPICS_FILE_PATH" ]; then
    current_epic=""
    while IFS= read -r line; do
      if echo "$line" | grep -qE '^#+\s*Epic\s+[0-9]+'; then
        current_epic="E$(echo "$line" | grep -oE '[0-9]+' | head -1)"
      fi
      if [ -n "$current_epic" ]; then
        for fr_id in $(echo "$line" | grep -oE 'FR[0-9]+'); do
          cypher_query "
            MATCH (fr:FR {id: '${fr_id}'}), (e:Epic {id: '${current_epic}'})
            MERGE (fr)-[:BELONGS_TO]->(e)
          " > /dev/null 2>&1
        done
      fi
    done < "$EPICS_FILE_PATH"
  fi

  # --- FR → Portal relationships from feature-hierarchy.md ---
  log "  Mapping FR → Portal (DISPLAYED_ON)..."
  if [ -f "$PLANNING_DIR/feature-hierarchy.md" ]; then
    current_portal=""
    while IFS= read -r line; do
      for portal in "admin" "webstore" "sales-web" "sales-app" "driver-app"; do
        if echo "$line" | grep -qi "^#.*${portal}"; then
          current_portal="$portal"
        fi
      done
      if [ -n "$current_portal" ]; then
        for fr_id in $(echo "$line" | grep -oE 'FR[0-9]+'); do
          cypher_query "
            MATCH (fr:FR {id: '${fr_id}'}), (p:Portal {name: '${current_portal}'})
            MERGE (fr)-[:DISPLAYED_ON]->(p)
          " > /dev/null 2>&1
        done
      fi
    done < "$FEATURE_HIERARCHY_PATH"
  fi

  success "  BELONGS_TO + DISPLAYED_ON mapping complete"

  # --- Step 3b: FR → FR IMPACTS relationships from stories (AC2/AC5) ---
  log "  Parsing Cross-Feature Dependencies → IMPACTS..."
  IMPACTS_COUNT=0
  if [ -d "$STORIES_DIR" ]; then
    find "$STORIES_DIR" -name "*.md" -not -path "*archive*" | while read -r story_file; do
      in_impacts=false
      while IFS= read -r line; do
        # Detect "## Cross-Feature Dependencies" section
        if echo "$line" | grep -qiE '^##[[:space:]]+Cross-Feature Dependencies'; then
          in_impacts=false  # Wait for ### Impacts sub-heading
          continue
        fi
        # Detect "### Impacts" sub-section
        if echo "$line" | grep -qiE '^###[[:space:]]+Impacts'; then
          in_impacts=true
          continue
        fi
        # Exit on next heading of same or higher level
        if $in_impacts && echo "$line" | grep -qE '^#{1,3}[[:space:]]'; then
          in_impacts=false
          continue
        fi

        if $in_impacts && echo "$line" | grep -qE 'FR[0-9]+'; then
          # Extract all FR references on this line
          fr_refs=$(echo "$line" | grep -oE 'FR[0-9]+' | sort -u)
          # Extract reason text (after the FR ref, strip markdown bullets/dashes)
          reason=$(echo "$line" | sed -E 's/^[[:space:]]*[-*][[:space:]]*//' | sed "s/['\"]//g" | xargs)

          # Determine the source FR from the story filename (story-{epic}.{story}.md)
          story_basename=$(basename "$story_file" .md)
          story_num=$(echo "$story_basename" | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "")
          # Try to find the source FR from the story's epic context
          source_fr=$(grep -oE 'FR[0-9]+' "$story_file" | head -1 || echo "")

          if [ -z "$source_fr" ]; then
            continue
          fi

          for target_fr in $fr_refs; do
            if [ "$target_fr" = "$source_fr" ]; then
              continue  # Skip self-references
            fi

            # AC5: Check if target FR exists in the graph
            fr_exists=$(cypher_query "MATCH (fr:FR {id: '${target_fr}'}) RETURN count(fr)" | grep -oE '[0-9]+' | tail -1 || echo "0")

            if [ "$fr_exists" = "0" ] || [ -z "$fr_exists" ]; then
              # AC5: Unknown FR — create edge with warning flag
              warn "  IMPACTS target ${target_fr} not found in PRD — adding with warning"
              cypher_query "
                MERGE (src:FR {id: '${source_fr}'})
                MERGE (tgt:FR {id: '${target_fr}'})
                MERGE (src)-[:IMPACTS {reason: '${reason}', confidence: 0.5, source: 'story-metadata', warning: 'FR not found in PRD'}]->(tgt)
              " > /dev/null 2>&1
              # Append to review queue
              echo "- fr: ${target_fr}, source: ${source_fr}, story: ${story_basename}, reason: '${reason}'" >> "$REVIEW_QUEUE"
            else
              # Normal IMPACTS edge
              cypher_query "
                MATCH (src:FR {id: '${source_fr}'}), (tgt:FR {id: '${target_fr}'})
                MERGE (src)-[:IMPACTS {reason: '${reason}', confidence: 0.9, source: 'story-metadata'}]->(tgt)
              " > /dev/null 2>&1
            fi
            IMPACTS_COUNT=$((IMPACTS_COUNT + 1))
          done
        fi
      done < "$story_file"
    done
  fi
  success "  Created $IMPACTS_COUNT IMPACTS relationships"
}

# ==============================================================
# STEP 4: VALIDATION — Cross-Check (AC5 Lớp 1 + Lớp 2)
# ==============================================================
step4_validation() {
  log "Step 4: VALIDATION — Running cross-checks..."
  ERRORS=0

  # --- Lớp 1: Orphan Node Check ---
  log "  Checking orphan Story nodes..."
  ORPHANS=$(cypher_query "
    MATCH (s:Story) WHERE NOT (s)<-[:IMPLEMENTED_BY]-(:FR)
    RETURN s.id
  " | grep -c "s.id" || echo "0")
  if [ "$ORPHANS" -gt 0 ]; then
    warn "  Found $ORPHANS orphan Story nodes (no FR link)"
    ERRORS=$((ERRORS + 1))
  fi

  # --- Lớp 1: Cycle Detection ---
  log "  Checking for circular IMPACTS..."
  CYCLES=$(cypher_query "
    MATCH (fr:FR)-[:IMPACTS*2..5]->(fr)
    RETURN fr.id LIMIT 5
  " | grep -c "fr.id" || echo "0")
  if [ "$CYCLES" -gt 0 ]; then
    error "  CIRCULAR DEPENDENCY DETECTED! $CYCLES cycles found"
    ERRORS=$((ERRORS + 1))
  fi

  # --- Lớp 2: FR Count Cross-Check ---
  log "  Cross-checking FR count..."
  GRAPH_FR_COUNT=$(cypher_query "MATCH (fr:FR) RETURN count(fr)" | grep -oE '[0-9]+' | tail -1 || echo "0")
  PRD_FR_COUNT=$(grep -cE '^[#]*\s*FR[0-9]+' "$PLANNING_DIR/prd.md" 2>/dev/null || echo "0")
  
  if [ "$GRAPH_FR_COUNT" != "$PRD_FR_COUNT" ]; then
    warn "  FR count mismatch: Graph=$GRAPH_FR_COUNT vs PRD=$PRD_FR_COUNT"
    ERRORS=$((ERRORS + 1))
  else
    success "  FR count matches: $GRAPH_FR_COUNT"
  fi

  # --- Summary ---
  echo ""
  if [ "$ERRORS" -eq 0 ]; then
    success "✅ VALIDATION PASSED — No errors found"
  else
    warn "⚠️ VALIDATION COMPLETED WITH $ERRORS WARNING(S)"
  fi
  
  log "Index log saved to: $OUTPUT_LOG"
}

# ==============================================================
# MAIN
# ==============================================================
main() {
  echo "=============================================="
  echo " FeatureGraph Indexer v1.1 (Story 14.3)"
  echo " Graph: $GRAPH_NAME @ $FALKORDB_HOST:$FALKORDB_PORT"
  echo "=============================================="

  check_falkordb
  resolve_paths
  
  step1_discovery
  step2_extraction  
  step3_mapping
  step4_validation
  
  echo ""
  success "🎉 FeatureGraph indexing complete!"
}

main "$@" 2>&1 | tee "$OUTPUT_LOG"
