---
name: llm-engineering-skill
description: Layer 1 Gateway for LLM Engineering capability. Directs agents to specialized modules (Graph, Harness, Loop, Routing, RAG) based on task context.
version: 2.0.0
aliases:
  - module-evals.md: module-harness.md
---

# LLM Engineering Skill (Layer 1 Gateway)

This skill provides comprehensive capabilities for LLM Engineering tasks, organized into a 5-layer stack of specialized Layer 2 modules.

**[DOMAIN ROUTING GATE]**
This skill belongs to the `AI Engineering` domain. 

## ⚠️ MANDATORY: Cross-Layer Dependency Map

Before working on or loading any module, you **MUST ALWAYS** first read the Cross-Layer Dependency Map (CLDM):
```
view_file .agent/skills/llm-engineering-skill/references/cross-layer-dependency-map.md
```
**CRITICAL RULE (EC-P4-001):** If you modify any of the 5 engineering modules, you MUST also review and update the `cross-layer-dependency-map.md` to prevent context drift and hallucinated dependencies.

---

## Instructions

Do NOT attempt to read all modules at once. Based on your current task, use `view_file` to read the **specific module(s)** you need, PLUS the Cross-Layer Dependency Map:

1. **Test Harness & Evals** (Harness Engineering Playbook): If you need to build eval suites, mock LLM responses, or assert output quality (EDD), load:
   `view_file .agent/skills/llm-engineering-skill/modules/module-harness.md`
   *(Backward compatibility note: requests for module-evals.md should route here).*

2. **Semantic Routing & Gateways** (Routing Engineering Playbook): If you need to route requests based on intents, classify text, or build semantic caches, load:
   `view_file .agent/skills/llm-engineering-skill/modules/module-routing.md`

3. **RAG & Information Retrieval** (RAG Ultimate Developer Guide): If you need to build Retrieval-Augmented Generation pipelines, manage vector stores, chunk text, or implement Hybrid/RRF retrieval, load:
   `view_file .agent/skills/llm-engineering-skill/modules/module-rag.md`

4. **Autonomous Loops & Tool Calling** (Loop Engineering Playbook): If you need to build ReAct loops, Plan-and-Solve architectures, or handle tool failure recovery, load:
   `view_file .agent/skills/llm-engineering-skill/modules/module-loop.md`

5. **Multi-Agent Graphs** (Graph Engineering Playbook): If you need to design complex multi-agent reasoning paths, knowledge graphs (SPO), or graph traversal systems, load:
   `view_file .agent/skills/llm-engineering-skill/modules/module-graph.md`

After loading the relevant module, follow its specific instructions, patterns, and anti-patterns to implement your solution.

---

## 🔒 Zero-Trust Physical Evidence Gate (Category A)

Sau khi hoàn thành tác vụ với skill này, Agent BẮT BUỘC phải:
1. Đã đọc `references/cross-layer-dependency-map.md` và ít nhất một `modules/module-*.md`.
2. Chạy script thẩm định Physical Evidence:
   ```bash
   python3 .agent/scripts/validate-skill-execution-evidence.py \
     --conversation-id "<CONVERSATION_ID>" \
     --skill-name "llm-engineering-skill" \
     --evidence-file "_iwish-output/adhoc-workspace/scratch/{uuid}-llm-eng-evidence.json"
   ```
3. Nếu script trả về exit code `1` (FAIL), Agent bị coi là vi phạm Zero-Trust (chưa đọc module nghiệp vụ) và bị chặn tiến trình.

## Gate Classification (Updated)

| Gate ID | Name | Category | Enforcement |
|---------|------|----------|-------------|
| LLM-G1  | Cross-Layer Map Read | **A (Deterministic)** | `validate-skill-execution-evidence.py` verifies transcript_full.jsonl |
| LLM-G2  | Module Load | **A (Deterministic)** | `validate-skill-execution-evidence.py` verifies ≥1 module view_file |
