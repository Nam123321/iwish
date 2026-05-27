-- ============================================================
-- Instinct Graph Schema Extension for FeatureGraph
-- Part of I-Wish Capability Management (capability-agent)
-- ============================================================
-- IMPORTANT: All queries MUST use: GRAPH.QUERY featuregraph "..."
-- This schema extends the existing FeatureGraph with learning nodes.
-- ============================================================

-- ===================== INSTINCT NODES ========================
-- Source: .agent/memory/instincts.jsonl
-- Created by: Any agent after fix-bug, code-review, ad-hoc chat
-- Consumed by: capability-agent during /enhance-skill evolution cycles

CREATE (:Instinct {
  id: "inst_001",
  ctx: "nestjs,prisma",
  bad: "findMany() no limit",
  good: "findMany({take:50})",
  sev: 5,
  ts: "2026-04-07",
  src: "fix-bug",
  file: "order.service.ts",
  resolved: false
})

-- ===================== SKILL NODES ===========================
-- Represents a distilled SKILL.md file in .agent/skills/
-- Created when capability-agent clusters instincts into a permanent capability

CREATE (:Skill {
  name: "prisma-best-practices",
  file_path: ".agent/skills/prisma-best-practices/SKILL.md",
  created_at: "2026-04-07",
  instinct_count: 5,
  last_evolved: "2026-04-07"
})

-- =================== RELATIONSHIPS ==========================

-- Instinct AFFECTS Feature (links bug to the feature area)
MATCH (i:Instinct {id: "inst_001"}), (f:FR {id: "FR8"})
CREATE (i)-[:AFFECTS {
  reason: "Query performance bug in pricing feature",
  discovered_at: "2026-04-07"
}]->(f)

-- Instinct AFFECTS Component (links bug to file/module)
MATCH (i:Instinct {id: "inst_001"}), (de:DataEntity {name: "PricingStrategy"})
CREATE (i)-[:AFFECTS]->(de)

-- Instinct RESOLVED_IN Skill (after capability-agent clusters and evolves)
MATCH (i:Instinct {id: "inst_001"}), (sk:Skill {name: "prisma-best-practices"})
CREATE (i)-[:RESOLVED_IN {
  resolved_at: "2026-04-07",
  rule_added: "Always use take/limit in findMany()"
}]->(sk)

-- Skill ENHANCES Agent (tracks which agent persona benefits)
-- Optional: for telemetry and evolution tracking
MATCH (sk:Skill {name: "prisma-best-practices"})
CREATE (sk)-[:ENHANCES {target_agent: "dev-agent", target_file: ".agent/agents/dev-agent.md"}]->(:AgentRef {name: "dev-agent"})

-- =================== QUERY TEMPLATES =========================

-- Q1: Get all unresolved instincts (for capability-agent evolution cycle)
-- GRAPH.QUERY featuregraph "MATCH (i:Instinct) WHERE i.resolved = false RETURN i ORDER BY i.sev DESC"

-- Q2: Get instinct hotspots (most affected features)
-- GRAPH.QUERY featuregraph "MATCH (i:Instinct)-[:AFFECTS]->(f:FR) WHERE i.resolved = false RETURN f.id, f.name, COUNT(i) AS bug_count ORDER BY bug_count DESC LIMIT 10"

-- Q3: Get instincts related to a specific file being edited
-- GRAPH.QUERY featuregraph "MATCH (i:Instinct) WHERE i.file CONTAINS 'order.service' AND i.resolved = false RETURN i"

-- Q4: Get evolution history of a skill
-- GRAPH.QUERY featuregraph "MATCH (i:Instinct)-[:RESOLVED_IN]->(sk:Skill {name: 'prisma-best-practices'}) RETURN i ORDER BY i.ts"

-- Q5: Get all instincts by context tag (for clustering)
-- GRAPH.QUERY featuregraph "MATCH (i:Instinct) WHERE i.ctx CONTAINS 'prisma' AND i.resolved = false RETURN i"

-- =================== INDEXES ================================

CREATE INDEX FOR (i:Instinct) ON (i.id)
CREATE INDEX FOR (i:Instinct) ON (i.ctx)
CREATE INDEX FOR (i:Instinct) ON (i.resolved)
CREATE INDEX FOR (sk:Skill) ON (sk.name)
