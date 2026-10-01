---
name: ai-native-architecture
description: "Comprehensive 6-Layer AI-Native Architecture reference skill. Covers Generative UI (L1), Security Gateway (L2), Orchestration & Multi-Agent Graph (L3+L5), Data & Context Engine (L4), and LLMOps Co-Evolution (L6). Uses Progressive Disclosure with Cross-Layer Dependency Map."
version: 1.0.0
tags:
  - ai-native
  - architecture
  - multi-agent
  - llm-engineering
  - security
  - orchestration
---

# AI-Native 6-Layer Architecture Skill (Gateway)

This skill encapsulates the complete AI-Native enterprise architecture across 6 functional layers. It serves as the definitive architectural reference for designing, reviewing, and implementing AI-Native systems.

**[DOMAIN ROUTING GATE]**
This skill belongs to the `AI Architecture` domain.

## ⚠️ MANDATORY: Cross-Layer Dependency Map

Before diving into any single module, you **MUST ALWAYS** first read the Cross-Layer Dependency Map:
```
view_file .agent/skills/ai-native-architecture/references/cross-layer-dependency-map.md
```
This map tells you which OTHER layers you must also load when working on a specific layer. **Never work on a layer in isolation.**

---

## Trigger Mechanism (When to Use)

**Dynamic Assembly Pattern:** Do not load all chunks arbitrarily. To prevent Semantic Cache Fragmentation (EC-P10-001), you must assemble context using one of the following fixed profiles based on your task intent:

- **Profile UI-Route (Front-End & Gateway):** Load `layer1-ui-interface.md` + `layer2-security-gateway.md` + `cross-layer-dependency-map.md`. Trigger when the task involves UI streaming, user interaction, security boundaries, or prompt injection.
- **Profile Brain (Logic & Data):** Load `layer3-orchestration.md` + `layer4-data-context.md` + `layer5-inference.md` + `cross-layer-dependency-map.md`. Trigger when the task involves multi-agent workflows, state graphs, RAG, memory, or context management.
- **Profile Eval-Ops (Backend & Ops):** Load `layer3-orchestration.md` + `layer5-inference.md` + `layer6-llmops.md` + `cross-layer-dependency-map.md`. Trigger when the task involves evaluators, LLMOps, fine-tuning, or execution traces.

If the task spans multiple profiles, load the minimum necessary profiles but avoid loading more than 3 layer files at once to respect context limits.

---

## Instructions

Do NOT attempt to read all modules at once. Based on your current task, use `view_file` to read the **specific module(s)** you need, PLUS any modules indicated by the Cross-Layer Dependency Map.

### 1. Layer 1 — Generative UI & Prompt Interface
If you need to design Agent-to-User Interfaces (A2UI), implement Generative UI streaming via MCP/RSC, configure AG-UI state synchronization, or select models for the UI layer (Modelmaxxing), load:
```
view_file .agent/skills/ai-native-architecture/modules/layer1-ui-interface.md
```

### 2. Layer 2 — Security & Routing Gateway
If you need to implement stateful sandboxing (gVisor/Firecracker), configure stacked guardrails (PII + Prompt Injection + OWASP), set up MCP security policies, design semantic routing tiers, or enforce FinOps token-budget circuit breakers, load:
```
view_file .agent/skills/ai-native-architecture/modules/layer2-security-gateway.md
```

### 3. Layer 3 — Orchestration & Harness
If you need to design StateGraph architectures, implement checkpointing/persistence, configure Human-in-the-Loop (HITL) with time-travel, set up A2A collaboration protocols, or implement Saga compensations, load:
```
view_file .agent/skills/ai-native-architecture/modules/layer3-orchestration.md
```

### 5. Layer 5 — AI Inference Engine & Graph
If you need to design multi-agent graph topologies (Sequential, Routing, Parallel, Orchestrator-Workers, Evaluator-Optimizer), manage context isolation across agents, or handle stateless multi-LoRA serving, load:
```
view_file .agent/skills/ai-native-architecture/modules/layer5-inference.md
```

### 4. Layer 4 — Data & Context Engine
If you need to implement Parent-Child chunking, Contextual Retrieval, Dynamic Context Pruning (DyCP/KadaneDial), Three-Tier Memory architecture, multi-tenant Vector DB partitioning, or Hybrid Search with Reciprocal Rank Fusion (RRF) and Cross-Encoder reranking, load:
```
view_file .agent/skills/ai-native-architecture/modules/layer4-data-context.md
```

### 5. Layer 6 — LLMOps & Co-Evolution Pipeline
If you need to harvest execution traces (ADP), implement Evol-Instruct data augmentation, configure serverless GPU fine-tuning (Modal + Unsloth), serve multi-LoRA adapters (vLLM + LoRAX), or set up automated promotion gates with DeepEval, load:
```
view_file .agent/skills/ai-native-architecture/modules/layer6-llmops.md
```

---

After loading the relevant module(s) AND checking the Cross-Layer Dependency Map, follow the specific instructions, patterns, decision trees, and anti-patterns to implement your solution.

---

## 🔒 Zero-Trust Physical Evidence Gate (Category A)

Sau khi hoàn thành tác vụ với skill này, Agent BẮT BUỘC phải:
1. Đã đọc `references/cross-layer-dependency-map.md` và ít nhất hai layers modules (`modules/layer*.md`).
2. Chạy script thẩm định Physical Evidence:
   ```bash
   python3 .agent/scripts/validate-skill-execution-evidence.py \
     --conversation-id "<CONVERSATION_ID>" \
     --skill-name "ai-native-architecture" \
     --evidence-file "_iwish-output/adhoc-workspace/scratch/{uuid}-ai-native-evidence.json"
   ```
3. Nếu thiếu layers hoặc chưa đọc Cross-Layer map, script sẽ exit(1) và chặn tiến trình.

## Gate Classification (Updated)

| Gate ID | Name | Category | Enforcement |
|---------|------|----------|-------------|
| AIN-G1  | Cross-Layer Map Read | **A (Deterministic)** | Transcript provenance in transcript_full.jsonl |
| AIN-G2  | Profile Assembly Compliance | **A (Deterministic)** | Transcript verifies ≥2 layer modules loaded per profile |
