---
description: 'FeatureGraph MCP Tools specification for CGC MCP Server extension. Defines 6 tools for querying the featuregraph keyspace in FalkorDB.'
---

# FeatureGraph MCP Tools Specification

> **CRITICAL**: All tools MUST query the `featuregraph` keyspace using `GRAPH.QUERY featuregraph "..."`.
> NEVER use default graph or `codegraph` keyspace.

---

## Tool 1: `feature_impact`

**Purpose:** Find all FRs impacted by changes to a given FR.
**Input:** `fr_id` (string), `depth` (integer, default=2)
**Output:** List of impacted FRs with reason and confidence.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr:FR {id: $fr_id})-[:IMPACTS*1..$depth]->(impacted:FR)
  RETURN impacted.id AS id,
         impacted.name AS name,
         impacted.portal_list AS portals,
         length(shortestPath((fr)-[:IMPACTS*]->(impacted))) AS distance
  ORDER BY distance
"
```

**Agent Usage:** `/dev-story` Step 2, `/fix-bug` Phase 3, `/code-review` Step 1.

---

## Tool 2: `feature_portals`

**Purpose:** Find which portals display a given FR.
**Input:** `fr_id` (string)
**Output:** List of portals with context description.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr:FR {id: $fr_id})-[:DISPLAYED_ON]->(p:Portal)
  RETURN p.name AS portal,
         p.display_name AS display_name,
         fr.id AS fr_id
"
```

**Agent Usage:** `/dev-story` (to know which portals need UI updates).

---

## Tool 3: `cross_feature`

**Purpose:** Find shared entities and relationships between two FRs.
**Input:** `fr_id1` (string), `fr_id2` (string)
**Output:** Shared entities, relationship chain, and impact direction.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr1:FR {id: $fr_id1})-[r]-(fr2:FR {id: $fr_id2})
  RETURN type(r) AS relationship,
         r.reason AS reason,
         r.shared_entities AS shared_entities,
         r.confidence AS confidence,
         startNode(r).id AS from_id,
         endNode(r).id AS to_id
"
```

**Agent Usage:** `/fix-bug` Phase 3 RCA, `/code-review` Dependency Gate.

---

## Tool 4: `feature_stories`

**Purpose:** Find all stories that implement a given FR.
**Input:** `fr_id` (string)
**Output:** List of stories with status.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr:FR {id: $fr_id})-[:IMPLEMENTED_BY]->(s:Story)
  RETURN s.id AS story_id,
         s.name AS story_name,
         s.status AS status,
         s.epic_id AS epic_id
  ORDER BY s.id
"
```

**Agent Usage:** `/impact-analysis` (Master wants to know implementation status).

---

## Tool 5: `concept_features`

**Purpose:** Find all FRs belonging to a business concept group.
**Input:** `concept` (string, e.g., "pricing", "promotions")
**Output:** All FRs in the concept group.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr:FR)-[:PART_OF]->(c:SharedConcept {name: $concept})
  RETURN fr.id AS id,
         fr.name AS name,
         fr.phase AS phase,
         fr.tier AS tier
  ORDER BY fr.id
"
```

**Agent Usage:** `/impact-analysis` (broad concept-level query).

---

## Tool 6: `add_feature_relationship`

**Purpose:** Agent self-updates the graph when discovering a new dependency.
**Input:** `fr_id1` (string), `relationship` (string), `fr_id2` (string), `reason` (string), `confidence` (float)
**Output:** Confirmation message.

```cypher
GRAPH.QUERY featuregraph "
  MATCH (fr1:FR {id: $fr_id1}), (fr2:FR {id: $fr_id2})
  CREATE (fr1)-[:$relationship {
    reason: $reason,
    confidence: $confidence,
    source: 'agent-discovered',
    created_at: timestamp()
  }]->(fr2)
  RETURN 'Relationship created: ' + $fr_id1 + ' -[' + $relationship + ']-> ' + $fr_id2
"
```

> [!WARNING]
> This tool creates data. Agent MUST set `confidence < 0.8` for self-discovered relationships
> and flag them in `review-queue.yaml` for Master approval.

**Agent Usage:** Any workflow when agent discovers implicit dependency.

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

---

## Integration Pattern (for MCP Server code)

```typescript
// In CGC MCP Server — extend existing tool registry
const FEATUREGRAPH_TOOLS = {
  feature_impact: {
    description: "Find FRs impacted by changes to a given FR",
    inputSchema: {
      type: "object",
      properties: {
        fr_id: { type: "string", description: "FR ID, e.g. FR8" },
        depth: { type: "integer", default: 2, description: "Traversal depth" }
      },
      required: ["fr_id"]
    },
    handler: async ({ fr_id, depth = 2 }) => {
      // MUST use featuregraph keyspace
      return await falkordb.query("featuregraph", `
        MATCH (fr:FR {id: "${fr_id}"})-[:IMPACTS*1..${depth}]->(impacted:FR)
        RETURN impacted.id, impacted.name, impacted.portal_list
      `);
    }
  },
  // ... similar for other 5 tools
};
```
