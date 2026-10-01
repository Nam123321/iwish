# Module: Multi-Agent Graphs (Knowledge Graphs)

## Purpose
Provides guidelines for designing complex, multi-agent systems using graph topologies, transitioning from prompt/context manipulation to harness/graph engineering. The Graph Layer (Layer 5) acts as the system's World Model and shared memory.

## Core Principles
1. Transition from prompt/context manipulation to harness/graph engineering.
2. The Graph Layer (Layer 5) acts as the system's World Model and shared memory.
3. Graph traversal solves multi-hop query context bloat.
4. Provenance-carrying edges ensure traceability and prevent hallucinations.
5. Tradeoff: High static compute cost for index building is exchanged for perfect retrieval accuracy on complex reasoning tasks.

## Mental Models & Frameworks
- **Anthropic Workflow Patterns Matrix**: Graph has 5 roles: Retrieval Source, Gate Signal, Classifier Input, Shared Surface, and Shared Memory.
- **GraphRAG Architectures**: Entity-Relation Graph (SPO Triples), Global Summarization Graph (RAPTOR/Louvain Style), Local Subgraph Retrieval.
- **Development Roadmap**: Foundation (Zero Graph) -> Extension (Local Entity Graph) -> Consolidation (Global Federated Multi-Agent Graph).
- **The Agentic Pyramid (L0-L3)**: Progressive disclosure of agent skills to reduce token bloat.

## Decision Trees
- If querying multi-hop -> Traverse graph instead of vector search.
- If agent generates facts -> Gate Signal compares against immutable graph.
- If node degree is high -> Route to high-priority/frontier LLM.
- If query is global summary -> Retrieve Louvain clustering summary.
- If query is specific detail -> Use Cosine Similarity + Graph Walk.

## Anti-patterns
````text
[Anti-Pattern] Entity Resolution Failure
- Consequence: Duplication of identical physical entities with different names -> Broken semantic traversal chains.
- Solution: SLM + cosine similarity for Entity Registry.

[Anti-Pattern] Infinite Graph Traversal Loops
- Consequence: Timeout and token explosion.
- Solution: Depth-Limited Search and Edge Weight Decay.

[Anti-Pattern] Loss of Provenance
- Consequence: Agent hallucination without citations.
- Solution: Provenance-carrying edges with strict JSON schemas.
````

## Reusable Patterns
````text
[Pattern] SPO_Graph_Extraction_Schema
Strict JSON Schema for entities and relations with provenance.

[Pattern] EnterpriseGraphController
Python logic for deduplication and edge provenance attachment.

[Pattern] SemanticGraphRetriever
Cosine Similarity anchor search + Breadth-First Search subgraph walk.
````

## References
- Source playbook references stored in .

## References
- Source playbook references stored in lineage.jsonl.
