---
name: dependency-resilience-analyzer
description: Analyzes architecture dependency graphs and evaluates systemic cascading failure risk.
---

# dependency-resilience-analyzer

## Objective
Analyze architecture dependency graphs, map connections between microservices/components, and evaluate the risk of cascading failures across the system. 

## Inputs
- Architecture specification or code graph representation.
- Dependency mappings (internal and external).

## Outputs
- Cascading Failure Risk Assessment Report.
- Mitigation recommendations.

## Anti-Fabrication Gates
### Gate 1: Source Validation [Category A - Deterministic]
MUST parse valid JSON/YAML dependency graphs or code-graph output. Fails immediately if the graph is malformed.

### Gate 2: Depth-First Risk Traversal [Category A - Deterministic]
MUST apply standard graph traversal algorithms to identify critical nodes and single points of failure.

### Gate 3: Blast Radius Calculation [Category B - Trust-Based]
SHOULD estimate the impact of a node failure based on downstream consumers and retry/fallback logic presence.

## Instructions
1. Ingest architecture graph data.
2. Identify nodes with high centrality and out-degree dependencies.
3. Simulate node failure and trace downstream impact (cascading failure).
4. Evaluate existing resilience patterns (circuit breakers, retries, fallbacks).
5. Generate the risk report and highlight single points of failure.
