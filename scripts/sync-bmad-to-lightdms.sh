#!/bin/bash
# ==============================================================
# BMAD Sync Script: BMAD-DragonBall → AI-Embedded Light DMS
# ADR-002 ALL-IN Graph Migration
# Date: 2026-04-01
# ==============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LDM="$SCRIPT_DIR/../../AI-Embedded Light DMS"

if [ ! -d "$LDM/.agent" ]; then
  echo "❌ Error: AI-Embedded Light DMS not found at $LDM"
  exit 1
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo " BMAD Sync: DragonBall → Light DMS"
echo " ADR-002 ALL-IN Graph Migration"
echo "=============================================="

# ==============================================================
# 1. UPDATE code-review → add step 7+8 (FeatureGraph validation)
# ==============================================================
echo -e "\n${YELLOW}[1/6] Updating bmad-bmm-code-review.md...${NC}"

# Check if already updated
if grep -q "ADR-002" "$LDM/.agent/workflows/bmad-bmm-code-review.md" 2>/dev/null; then
  echo -e "${GREEN}  → Already up-to-date, skipping${NC}"
else
  # Remove the old </steps> closing tag first, then add new steps + closing tag
  sed -i '' 's|</steps>||g' "$LDM/.agent/workflows/bmad-bmm-code-review.md"

  cat >> "$LDM/.agent/workflows/bmad-bmm-code-review.md" << 'EOF'
7. CRITICAL — DATA-SPEC VALIDATION via FeatureGraph (ADR-002): After completing the standard code review, you MUST perform data-spec compliance checks using FeatureGraph MCP tools.

   PREREQUISITE: Check if FeatureGraph MCP tools are available (feature_impact, cross_feature, add_data_entity).
   → If NOT available → log "⚠️ WARNING: FeatureGraph unavailable, skipping data-spec validation" and SKIP steps 7-8.
   → If available → proceed:

   **7a. Query story's declared data entities:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity) RETURN de.name, de.key_fields, de.prisma_model
   ```
   For each DataEntity returned:
   ☐ **Schema Compliance:** Does the Prisma model in code match `de.key_fields`? Check field names, types, constraints.
   ☐ **DB Guardian:** Are required indexes present? Are `tenantId` compound indexes defined?

   **7b. Query story's declared events:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:PRODUCES]->(e:Event) RETURN e.name, e.type
   Query: MATCH (s:Story {id: $storyId})-[:CONSUMES]->(e:Event) RETURN e.name, e.type
   ```
   ☐ **Event Compliance:** Does code emit/consume ALL declared events?

   **7c. Query story's seed data:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity)-[:HAS_SEED]->(sd:SeedData) RETURN sd.model, sd.values
   ```
   ☐ **Seed Data:** If SeedData nodes exist → verify seed script matches `sd.values`.

   **7d. Deviation Detection:**
   ☐ Does the code introduce ANY model, field, enum, or event NOT declared in FeatureGraph?
   If deviations are detected → flag as 🛑 **DATA-SPEC DEVIATION** finding (CRITICAL severity).

8. CRITICAL — BACKWARD UPDATE BLOCKER via FeatureGraph (ADR-002): If step 7 detected any DATA-SPEC DEVIATION:
   - Story review is BLOCKED — do NOT mark as approved
   - List all deviations clearly with: field/model name, what code has, what FeatureGraph expects
   - Instruct developer to update FeatureGraph using MCP tools:
     a. New/changed model → call `add_data_entity(name, prisma_model, key_fields, story_id)`
     b. New event → call `add_event(name, type, producer_story, consumer_stories)`
     c. New seed data → call `add_seed_data(model, values, source_story)`
     d. New FR dependency → call `add_feature_relationship(fr_id1, relationship, fr_id2, reason, confidence)`
   - After developer completes backward update → re-run step 7 ONLY (max 1 re-check)
   - If deviations STILL exist after 1 re-check → ESCALATE to user with full deviation report, do NOT auto-fix
</steps>
EOF
  echo -e "${GREEN}  → Step 7+8 added${NC}"
fi

# ==============================================================
# 2. UPDATE fix-bug → add step 16c (data-spec sync)
# ==============================================================
echo -e "\n${YELLOW}[2/6] Updating fix-bug.md...${NC}"

if grep -q "16c\." "$LDM/.agent/workflows/fix-bug.md" 2>/dev/null; then
  echo -e "${GREEN}  → Already has step 16c, skipping${NC}"
else
  # Insert step 16c after the fix checklist (after "Fix không break existing tests")
  sed -i '' '/Fix không break existing tests/,/^---/{
    /^---/i\
\
16c. **DATA-SPEC SYNC CHECK via FeatureGraph (ADR-002):**\
     - Bắt buộc kiểm tra toolset xem có `add_data_entity` MCP tool không. Nếu KHÔNG → skip bước này.\
     - Nếu CÓ → kiểm tra:\
       ```\
       □ Fix có thay đổi Prisma schema không?\
         → Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity) RETURN de\
         → So sánh Prisma changes vs DataEntity nodes\
         → Nếu LỆCH → call add_data_entity() to update\
       □ Fix có thêm event/emit mới không?\
         → Nếu CÓ → call add_event() to register\
       □ Fix có thay đổi seed data không?\
         → Nếu CÓ → call add_seed_data() to update\
       ```\
     - **Enforcement theo SBRP Tier:**\
       - 🔴 SBRP-Full (RPN ≥ 60): FeatureGraph update = **MANDATORY** — không approve nếu chưa update\
       - 🟡 SBRP-Standard: FeatureGraph update = **RECOMMENDED** — ghi nhận vào report nếu skip\
       - 🟢 SBRP-Lite: FeatureGraph update = **OPTIONAL** — chỉ update nếu schema thay đổi\
     - Ghi vào SBRP report: `featuregraph_updated: true/false`
  }' "$LDM/.agent/workflows/fix-bug.md"
  echo -e "${GREEN}  → Step 16c added${NC}"
fi

# ==============================================================
# 3. UPDATE FeatureGraph SKILL → add Tool 7-9
# ==============================================================
echo -e "\n${YELLOW}[3/6] Updating FeatureGraph MCP tools skill...${NC}"

if grep -q "add_data_entity" "$LDM/.agent/skills/featuregraph-mcp-tools/SKILL.md" 2>/dev/null; then
  echo -e "${GREEN}  → Already has Tool 7-9, skipping${NC}"
else
  cat >> "$LDM/.agent/skills/featuregraph-mcp-tools/SKILL.md" << 'EOF'

---

## Tool 7: `add_data_entity` (ADR-002)

**Purpose:** Create or update a DataEntity node and link it to an FR/Story.
**Input:** `name` (string), `prisma_model` (string), `key_fields` (string), `story_id` (string)
**Output:** Confirmation message.

```cypher
GRAPH.QUERY featuregraph "
  MERGE (de:DataEntity {name: $name})
  SET de.prisma_model = $prisma_model,
      de.key_fields = $key_fields,
      de.updated_at = timestamp()
  WITH de
  MATCH (s:Story {id: $story_id})
  MERGE (s)-[:USES_ENTITY]->(de)
  RETURN 'DataEntity created/updated: ' + $name + ' linked to ' + $story_id
"
```

**Agent Usage:** `/create-data-spec` (per-story), `/create-data-overview` (cross-epic), backward update in `/code-review`.

---

## Tool 8: `add_event` (ADR-002)

**Purpose:** Create an Event node and link producer/consumer stories.
**Input:** `name` (string), `type` (string), `producer_story` (string), `consumer_stories` (string, comma-separated)
**Output:** Confirmation message.

```cypher
GRAPH.QUERY featuregraph "
  MERGE (e:Event {name: $name})
  SET e.type = $type,
      e.producer_story = $producer_story,
      e.consumer_stories = $consumer_stories,
      e.updated_at = timestamp()
  WITH e
  MATCH (s:Story {id: $producer_story})
  MERGE (s)-[:PRODUCES]->(e)
  RETURN 'Event created: ' + $name + ' produced by ' + $producer_story
"
```

**Agent Usage:** `/create-data-overview` (cross-epic event mapping), backward update when code introduces new events.

---

## Tool 9: `add_seed_data` (ADR-002)

**Purpose:** Record seed/reference data requirements for a model.
**Input:** `model` (string), `values` (string), `source_story` (string)
**Output:** Confirmation message.

```cypher
GRAPH.QUERY featuregraph "
  MERGE (sd:SeedData {model: $model})
  SET sd.values = $values,
      sd.source_story = $source_story,
      sd.updated_at = timestamp()
  WITH sd
  MATCH (de:DataEntity {name: $model})
  MERGE (de)-[:HAS_SEED]->(sd)
  RETURN 'SeedData recorded: ' + $model + ' = ' + $values
"
```

**Agent Usage:** `/create-data-spec` (per-story seed requirements), `/create-data-overview` (cross-epic seed audit).
EOF
  echo -e "${GREEN}  → Tool 7-9 added${NC}"
fi

# ==============================================================
# 4. UPDATE FeatureGraph schema → +Event, +SeedData
# ==============================================================
echo -e "\n${YELLOW}[4/6] Updating FeatureGraph indexer schema...${NC}"

if grep -q "Event" "$LDM/scripts/featuregraph-indexer.sh" 2>/dev/null; then
  echo -e "${GREEN}  → Schema already extended, skipping${NC}"
else
  echo -e "${YELLOW}  → Note: featuregraph-indexer.sh is a bash script, manual schema extension may be needed${NC}"
  echo -e "${GREEN}  → Schema extended in SKILL.md tools (sufficient for MCP usage)${NC}"
fi

# ==============================================================
# 5. CREATE docs/decisions/ADR-002
# ==============================================================
echo -e "\n${YELLOW}[5/6] Creating ADR-002...${NC}"

mkdir -p "$LDM/docs/decisions"

if [ -f "$LDM/docs/decisions/ADR-002-all-in-graph-migration.md" ]; then
  echo -e "${GREEN}  → Already exists, skipping${NC}"
else
  cp "$SCRIPT_DIR/docs/decisions/ADR-002-all-in-graph-migration.md" "$LDM/docs/decisions/ADR-002-all-in-graph-migration.md"
  echo -e "${GREEN}  → ADR-002 copied${NC}"
fi

# ==============================================================
# 6. VERIFY
# ==============================================================
echo -e "\n${YELLOW}[6/6] Verification...${NC}"

echo -n "  code-review ADR-002: "
grep -c "ADR-002" "$LDM/.agent/workflows/bmad-bmm-code-review.md" && echo " refs" || echo "❌"

echo -n "  fix-bug 16c: "
grep -c "16c\." "$LDM/.agent/workflows/fix-bug.md" && echo " refs" || echo "❌"

echo -n "  FeatureGraph tools 7-9: "
grep -c "add_data_entity\|add_event\|add_seed_data" "$LDM/.agent/skills/featuregraph-mcp-tools/SKILL.md" && echo " refs" || echo "❌"

echo -n "  ADR-002 file: "
[ -f "$LDM/docs/decisions/ADR-002-all-in-graph-migration.md" ] && echo "✅" || echo "❌"

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 BMAD Sync Complete!${NC}"
echo "=============================================="
