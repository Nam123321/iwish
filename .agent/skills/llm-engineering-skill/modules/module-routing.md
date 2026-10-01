# Module: Semantic Routing & Gateways

## Purpose
Defines the architecture for routing user queries to the appropriate specialized model, tool, or prompt based on intent. Acts as the traffic controller for the LLM system.

## Core Principles
1. Routing reduces latency and cost by directing simple tasks to smaller models.
2. Semantic routers use embeddings to classify intent rapidly.
3. Security routing acts as a firewall against prompt injection and PII leakage.
4. Fallback routing ensures high availability during API outages.

## Mental Models & Frameworks
- **The Router Topology**: Input -> Intent Classification -> Destination (Agent/Model/Cache).
- **Router Types**: Logical (If/Else), Semantic (Vector Similarity), LLM-based (Zero-shot classification).
- **Semantic Caching**: Routing identical semantic queries to a pre-computed answer cache.

## Decision Trees
- If task requires complex reasoning -> Route to Frontier Model (e.g., GPT-4o, Claude 3.5 Sonnet).
- If task is simple formatting/extraction -> Route to Small/Local Model (e.g., Llama 3 8B, Haiku).
- If query matches semantic cache -> Return cached response (0 latency).
- If primary API fails -> Route to fallback provider automatically.
- If prompt injection detected -> Route to Security Block response.

## Anti-patterns
````text
[Anti-Pattern] LLM-based Routing for Everything
- Consequence: High latency and cost just to decide *what* to do.
- Solution: Use Semantic (Vector) Routers or Fast SLMs for classification.

[Anti-Pattern] Hardcoded Fallbacks
- Consequence: System downtime if the hardcoded fallback also fails.
- Solution: Dynamic load balancing and health-checked provider routing.

[Anti-Pattern] Unprotected Edge
- Consequence: Jailbreaks and data exfiltration.
- Solution: Dedicated Security Router/Filter at the ingress point.
````

## Reusable Patterns
````text
[Pattern] SemanticCacheRouter
Implementation of Redis/Vector DB cache for exact/semantic query matches.

[Pattern] TieredModelRouter
Routing logic based on query complexity score.

[Pattern] IntentClassificationMatrix
Vector index of user intents for fast cosine-similarity routing.
````

## References
- Source playbook references stored in .

## References
- Source playbook references stored in lineage.jsonl.
