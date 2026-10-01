# Cross-Layer Dependency Map (CLDM)

This map is **MANDATORY reading** before working on any single layer. It defines which other layers have hard dependencies that MUST be checked to prevent architectural blind spots.

## Dependency Matrix

| When working on... | MUST also check | Reason |
|---|---|---|
| **Layer 1** (UI & Interface) | Layer 2 (Security), Layer 3 (Orchestration) | UI Sandboxing (CSP, XSS prevention) lives in L2. AG-UI State Sync requires L3 StateGraph + PostgresSaver. |
| **Layer 2** (Security & Gateway) | Layer 1 (UI), Layer 4 (Data) | CSP headers affect Generative UI rendering in L1. PII masking in guardrails must align with L4 tenant isolation in Vector DBs. |
| **Layer 3 & Layer 5** (Orchestration & Graph) | Layer 2 (Security), Layer 4 (Data), Layer 6 (LLMOps) | Guardrails filter before orchestrator receives queries. Memory/Context persistence (L4) feeds StateGraph. Trace harvesting (L6) depends on L3 execution format. |
| **Layer 4** (Data & Context) | Layer 2 (Security), Layer 3 (Orchestration) | Single-collection tenant partitioning must enforce L2 access control. Three-Tier Memory feeds into L3 StateGraph checkpointing. |
| **Layer 6** (LLMOps & Co-Evolution) | Layer 2 (Security), Layer 3 (Orchestration), Layer 5 (Inference) | FinOps token budgets (L2) constrain training economics. Trace harvesting format must match L3 checkpoint schema. LoRA adapter routing uses L2 semantic router. |

## How to Use

1. Read this map FIRST.
2. Identify your primary layer.
3. Load your primary module.
4. Check the "MUST also check" column → Load those modules too.
5. When making architectural decisions, verify constraints from ALL loaded modules.

## Critical Cross-Layer Invariants

These rules apply ACROSS layers and must never be violated:

1. **Tenant Isolation is Universal**: Every layer (UI state, guardrails, orchestrator context, vector DB, LoRA adapters) MUST enforce `tenant_id` isolation. A breach in any single layer breaks the entire stack.
2. **Token Budget is End-to-End**: The FinOps circuit breaker in L2 must account for tokens consumed across L1 (UI generation), L3 (orchestration reasoning), L4 (RAG retrieval context), and L6 (eval/training).
3. **State Schema Consistency**: The checkpoint format in L3, the memory format in L4, and the trace format in L6 must share a compatible schema to enable Time-Travel debugging and Trace Harvesting.
4. **Security is Defense-in-Depth**: L1 sanitizes UI output, L2 filters input, L3 validates tool calls, L4 partitions data access. Removing any single layer creates an exploitable gap.
5. **Model Selection Cascades**: Modelmaxxing decisions in L1 (UI SLM) affect L2 (routing thresholds), L3 (orchestrator flagship vs SLM), and L6 (which base model to fine-tune).
