---
name: llmops-finetuning-serving-skill
description: Layer 1 Gateway for LLMOps, PEFT, Quantization, and Serving. Directs agents to specialized modules for fine-tuning, deployment, and industry use cases.
version: 1.0.0
---

# LLMOps & Serving Skill (Layer 1 Gateway)

This skill provides comprehensive capabilities for LLMOps, covering model fine-tuning (PEFT/QLoRA), serverless serving architectures (vLLM/LoRAX), and domain-specific RAG configurations. 

**[DOMAIN ROUTING GATE]**
This skill belongs to the `AI Engineering / LLMOps` domain.

## ⚠️ MANDATORY: Project Architecture Research Gate

**CRITICAL RULE (EC-P1-001):** You **MUST NEVER** hallucinate or blindly recommend a generic fine-tuning framework or serving engine without evaluating the current project architecture.
Before loading any module below, you **MUST**:
1. Scan the project's `project-context.md`, `architecture.md`, and infrastructure configs.
2. Evaluate the deployment environment (e.g., Kubernetes, serverless GPU, edge).
3. Tailor your framework and infrastructure proposals strictly based on the project's existing constraints and compute availability.

---

## Instructions

Based on your current task, use `view_file` to read the **specific module(s)** you need. Do NOT attempt to read all modules at once to avoid context overflow.

1. **Fine-Tuning & Quantization (PEFT, QLoRA, LoRA)**: If you need to design a fine-tuning pipeline, configure PEFT/LoRA adapters, handle dataset formatting, or implement quantization (NF4, 8-bit), load:
   `view_file .agent/skills/llmops-finetuning-serving-skill/modules/module-finetuning.md`

2. **Serving & Multi-Tenant Deployment (vLLM, LoRAX)**: If you need to design inference engines, configure serverless GPU deployments, handle multi-adapter serving (LoRAX), or optimize memory (PagedAttention), load:
   `view_file .agent/skills/llmops-finetuning-serving-skill/modules/module-serving.md`

3. **Industry Reference Examples (Use Cases)**: If you need architectural inspiration or want to refer to the 15 production use cases (Healthcare, BFSI, Legal, DevOps, etc.) for system design context, load:
   `view_file .agent/skills/llmops-finetuning-serving-skill/modules/module-use-cases.md`

After loading the relevant module, follow its specific authoritative constraints (Category A Rules) to implement your solution safely.

## Gate Classification (Eliminated Phantom Gates — Fully Enforced)

| Gate ID | Name | Category | Enforcement Mechanism |
|---------|------|----------|-----------------------|
| EC-P1-001 | Architecture Scan | **A (Deterministic)** | `validate-skill-execution-evidence.py` verifies physical `view_file` on `architecture.md` |
| FT-001 | VRAM Validation | **A (Deterministic)** | Tool Output parsing required |
| FT-002 | Unsloth Target Modules | **A (Deterministic)** | Code AST scanner ensures linear layers are configured |
| SV-001 | Multi-LoRA Enforcer | **A (Upgraded)** | `validate-skill-execution-evidence.py` verifies `module-serving.md` loaded |

## 🔒 Zero-Trust Physical Evidence Gate (Category A)
Sau khi hoàn thành tác vụ, Agent BẮT BUỘC phải:
1. Đọc ít nhất 1 module (`modules/module-*.md`) VÀ `2.5. architecture.md`.
2. Chạy validator:
   ```bash
   python3 .agent/scripts/validate-skill-execution-evidence.py \
     --conversation-id "<CONVERSATION_ID>" \
     --skill-name "llmops-finetuning-serving-skill" \
     --evidence-file "_iwish-output/adhoc-workspace/scratch/{uuid}-llmops-evidence.json"
   ```
