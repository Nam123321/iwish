# Cross-Layer Dependency Map (CLDM)

This document maps the explicitly defined dependencies between the 5 core modules of the `llm-engineering-skill`. 
**CRITICAL RULE (EC-P4-001):** If any module in `llm-engineering-skill` is modified, this CLDM MUST be reviewed and updated to prevent context drift and hallucinated dependencies.

## Dependency Matrix

| Module | Consumes From | Provides To | Primary Interaction / Payload |
|---|---|---|---|
| **Graph (`module-graph`)** | Loop, RAG | Loop, Routing | Defines the structural state machine (nodes, edges). Feeds topology to the `Loop` for execution. |
| **Loop (`module-loop`)** | Graph | Harness | Executes the nodes defined by `Graph`. Handles while-loops, max-iterations, and outputs final result or yields trace events to `Harness`. |
| **Harness (`module-harness`)** | Loop, Routing | Evaluators (External) | Captures telemetry, spans, and traces from the `Loop` and `Routing` layer to fuel observability and evaluations. |
| **Routing (`module-routing`)** | RAG | Harness, Graph | Uses payload metadata from `RAG` to decide economics/model tiers. Routes execution into `Graph` entrypoints. |
| **RAG (`module-rag`)** | External DB | Routing, Graph | Ingests and retrieves context. Must compact payloads (e.g. Contextual Retrieval) before passing to `Routing` to save token economics. |

## Inter-Layer Data Contracts

1. **Routing → Graph:** The `Routing` layer must output a standardized `IntentPayload` before invoking a `Graph` entrypoint.
2. **Graph ↔ Loop:** The `Graph` defines the topology, but the `Loop` manages the underlying `State` object mutations.
3. **Trace ↔ Harness:** The `Harness` acts as the observability sink. All layers (Graph, Loop, Routing, RAG) must emit structured trace spans (e.g. via LangSmith/Langfuse) to the Harness for monitoring.
