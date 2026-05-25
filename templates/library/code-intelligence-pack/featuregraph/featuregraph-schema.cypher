-- ============================================================
-- FeatureGraph Schema for FalkorDB (Multi-Graph: "featuregraph")
-- Part of BMAD Code Intelligence Pack
-- ============================================================
-- IMPORTANT: All queries MUST use: GRAPH.QUERY featuregraph "..."
-- NEVER use default graph to avoid cross-contamination with codegraph.
-- ============================================================

-- ===================== NODE CREATION ========================

-- FR (Functional Requirement) Nodes
-- Source: prd.md
CREATE (:FR {
  id: "FR8",
  name: "Pricing Strategy Management",
  description: "Manage tiered pricing models for B2B/B2C",
  phase: "MVP",
  tier: "Pro",
  epic_id: "E1",
  portal_list: "admin,webstore,sales-web,sales-app",
  updated_at: timestamp()
})

-- Epic Nodes
-- Source: epics.md
CREATE (:Epic {
  id: "E1",
  name: "Product Catalog & Pricing",
  phase: "MVP",
  status: "in-progress",
  story_count: 10
})

-- Story Nodes
-- Source: story files (_bmad-output/stories/)
CREATE (:Story {
  id: "S1.7",
  name: "Pricing Strategy Setup",
  epic_id: "E1",
  status: "done",
  fr_ids: "FR7,FR8",
  ac_count: 5
})

-- Portal Nodes
-- Source: feature-hierarchy.md
CREATE (:Portal {
  name: "admin",
  display_name: "Admin Portal",
  tech_stack: "Next.js",
  primary_users: "Business Owner, Staff, Manager"
})

-- DataEntity Nodes
-- Source: schema.prisma / data-architecture
CREATE (:DataEntity {
  name: "PricingStrategy",
  prisma_model: "PricingStrategy",
  key_fields: "id,name,type,levels,effectiveDate"
})

-- SharedConcept Nodes
-- Source: Derived from FR groupings
CREATE (:SharedConcept {
  name: "pricing",
  description: "Everything related to product pricing",
  fr_ids: "FR7,FR8,FR9,FR12,FR85"
})

-- =================== RELATIONSHIPS ==========================

-- FR belongs_to Epic
MATCH (fr:FR {id: "FR8"}), (e:Epic {id: "E1"})
CREATE (fr)-[:BELONGS_TO]->(e)

-- FR implemented_by Story
MATCH (fr:FR {id: "FR8"}), (s:Story {id: "S1.7"})
CREATE (fr)-[:IMPLEMENTED_BY]->(s)

-- FR displayed_on Portal
MATCH (fr:FR {id: "FR8"}), (p:Portal {name: "admin"})
CREATE (fr)-[:DISPLAYED_ON {context: "Config pricing levels"}]->(p)

-- FR uses_entity DataEntity
MATCH (fr:FR {id: "FR8"}), (e:DataEntity {name: "PricingStrategy"})
CREATE (fr)-[:USES_ENTITY]->(e)

-- FR impacts FR (CRITICAL — directional)
-- Direction: "If FR8 changes, FR9 is affected"
MATCH (fr1:FR {id: "FR8"}), (fr2:FR {id: "FR9"})
CREATE (fr1)-[:IMPACTS {
  reason: "Dynamic Pricing depends on base pricing model",
  confidence: 1.0,
  source: "prd"
}]->(fr2)

-- FR shared_with FR (bidirectional concept)
MATCH (fr1:FR {id: "FR8"}), (fr2:FR {id: "FR9"})
CREATE (fr1)-[:SHARED_WITH {
  shared_entities: "PricingStrategy,PriceLevel"
}]->(fr2)

-- FR part_of SharedConcept
MATCH (fr:FR {id: "FR8"}), (c:SharedConcept {name: "pricing"})
CREATE (fr)-[:PART_OF]->(c)

-- Story depends_on Story
MATCH (s1:Story {id: "S1.7"}), (s2:Story {id: "S1.3"})
CREATE (s1)-[:DEPENDS_ON {reason: "Product CRUD must exist before pricing"}]->(s2)

-- =================== EVENT NODES (ADR-002) ===================
-- Source: [FLOW-OUT:] and [FLOW-IN:] Tier 1 tags from stories
-- Supports ALL-IN graph migration for data flow tracking

CREATE (:Event {
  name: "order.invoice.created",
  type: "domain_event",
  producer_story: "S3.2",
  consumer_stories: "S5.1,S5.3",
  updated_at: timestamp()
})

-- Story PRODUCES Event
MATCH (s:Story {id: "S3.2"}), (e:Event {name: "order.invoice.created"})
CREATE (s)-[:PRODUCES]->(e)

-- Story CONSUMES Event
MATCH (s:Story {id: "S5.1"}), (e:Event {name: "order.invoice.created"})
CREATE (s)-[:CONSUMES]->(e)

-- =================== SEED DATA NODES (ADR-002) ===============
-- Source: [SEED:] Tier 1 tags from stories
-- Tracks required seed/reference data per model

CREATE (:SeedData {
  model: "OrderStatus",
  values: "REFUNDED,PARTIALLY_REFUNDED",
  source_story: "S3.4",
  updated_at: timestamp()
})

-- DataEntity HAS_SEED SeedData
MATCH (de:DataEntity {name: "OrderStatus"}), (sd:SeedData {model: "OrderStatus"})
CREATE (de)-[:HAS_SEED]->(sd)

-- =================== INDEXES ================================

CREATE INDEX FOR (fr:FR) ON (fr.id)
CREATE INDEX FOR (e:Epic) ON (e.id)
CREATE INDEX FOR (s:Story) ON (s.id)
CREATE INDEX FOR (p:Portal) ON (p.name)
CREATE INDEX FOR (d:DataEntity) ON (d.name)
CREATE INDEX FOR (c:SharedConcept) ON (c.name)
CREATE INDEX FOR (ev:Event) ON (ev.name)
CREATE INDEX FOR (sd:SeedData) ON (sd.model)
