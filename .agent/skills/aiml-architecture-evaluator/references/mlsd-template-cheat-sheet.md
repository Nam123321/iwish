# MLSD Template Cheat Sheet

## 1. Fast Estimation Formula
- **GPU VRAM Estimation (Inference):**
  $$\text{VRAM}_{\text{weights}} = \text{Parameters (B)} \times \text{Bytes per param (2 for FP16, 1 for INT8, 0.5 for INT4)}$$
  $$\text{VRAM}_{\text{total}} \approx \text{VRAM}_{\text{weights}} \times 1.25 \text{ (KV Cache + Context Overhead)}$$
- **Throughput / Latency:**
  $$\text{Latency} = \text{Time-to-First-Token (TTFT)} + (\text{Output Tokens} \times \text{Inter-Token Latency (ITL)})$$

## 2. Common Design Archetypes
- **Search & Retrieval (RAG):** Bi-Encoder (Dense Retrieval) + Cross-Encoder (Reranker) + Vector Store + Metadata Filter.
- **Recommendation:** Two-Stage Pipeline (Retrieval via Two-Tower DNN / Annoy / HNSW) -> Ranking (Deep & Cross / LightGBM) -> Re-ranking / Diversity filter.
- **Agentic Workflow:** User Intent -> Router -> Specialist Subagent -> Multi-Step Tool Execution -> Evaluation & Guardrail -> User Response.
