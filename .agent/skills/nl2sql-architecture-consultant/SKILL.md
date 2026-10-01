---
name: "nl2sql-architecture-consultant"
description: "Layer 1 Gateway for NL2SQL Architecture Consulting. Directs agents to specialized modules for Schema Linking, Translation/Prompting, and Execution/Reranking."
version: 2.0.0
tags:
  - nl2sql
  - text-to-sql
  - architecture
  - multi-agent
---

# NL2SQL Architecture Consultant (Layer 1 Gateway)

This skill provides comprehensive capabilities for analyzing, designing, and troubleshooting Text-to-SQL (NL2SQL) systems, based on state-of-the-art frameworks (TKDE Survey & VLDB Tutorial).

**[DOMAIN ROUTING GATE]**
This skill belongs to the `AI Engineering` and `System Architecture` domains.

## ⚠️ MANDATORY: Cross-Layer Dependency Map

Before working on or loading any module, you **MUST ALWAYS** first read the Cross-Layer Dependency Map (CLDM):
```bash
view_file ~/.iwish/generated-skills/nl2sql-architecture-consultant/references/cross-layer-dependency-map.md
```
**CRITICAL RULE:** NL2SQL is a tightly coupled 3-stage pipeline. Changing one module (e.g., Schema Linking) drastically affects the others (e.g., Token Budget in Translation).

---

## Instructions

Do NOT attempt to read all modules at once (Progressive Disclosure). Based on your current task, use `view_file` to read the **specific module(s)** you need, PLUS the Cross-Layer Dependency Map:

1. **Pre-processing / Schema Linking**: If you need to filter schemas, link natural language to tables/columns, or implement RAG over databases, load:
   `view_file ~/.iwish/generated-skills/nl2sql-architecture-consultant/modules/module-schema-linking.md`

2. **Translation & Prompting**: If you need to design the core LLM generator, use Chain-of-Thought, or implement Intermediate Representations (IR like SemQL), load:
   `view_file ~/.iwish/generated-skills/nl2sql-architecture-consultant/modules/module-translation-prompting.md`

3. **Post-processing & Execution Validation**: If you need to implement execution-guided self-correction, voting mechanisms, or evaluate SQL accuracy (EX, EM, VES), load:
   `view_file ~/.iwish/generated-skills/nl2sql-architecture-consultant/modules/module-execution-reranking.md`

---

## 🛡️ Layer 1 Firewall Hooks (MANDATORY AUTOMATION)

To prevent Hallucination and Token Exhaustion, any agent utilizing this skill **MUST** automatically trigger the following validation scripts upon task completion or during architecture design:

1. **Context Compliance Auditor** (Category A Gate):
   Ensures the agent actually read the project's ADR/TDR before consulting.
   `python3 ~/.iwish/generated-skills/nl2sql-architecture-consultant/scripts/nl2sql-compliance-auditor.py --transcript-path <path_to_transcript>`

2. **Token Budget Calculator** (Category A Gate):
   Ensures raw schemas do not exceed token limits (Anti "Dump DDL" pattern).
   `python3 ~/.iwish/generated-skills/nl2sql-architecture-consultant/scripts/token-budget-calculator.py --schema-file <path_to_ddl> --model-context-limit 128000`
