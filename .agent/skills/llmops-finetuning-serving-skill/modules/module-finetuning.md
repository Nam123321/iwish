# LLMOps - Fine-Tuning & Quantization Module

This module provides constraints and standards for PEFT, LoRA, QLoRA, and Dataset formatting.

## ⚠️ Core Architectural Constraints

**CRITICAL RULE (FT-001):** You **MUST** ensure the target GPU architecture has sufficient VRAM before recommending full fine-tuning. For edge or constrained environments, you **MUST** default to QLoRA (Quantized LoRA) using NF4 (NormalFloat 4-bit) data types.

**CRITICAL RULE (FT-002):** When using Unsloth for QLoRA fine-tuning, you **MUST** configure the PEFT adapter with `target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]` to ensure all linear layers are targeted, maximizing model performance.

**CRITICAL RULE (FT-003):** You **MUST NOT** save the full model weights after PEFT training unless explicitly instructed. Always save ONLY the LoRA adapter weights (using `model.save_pretrained`) to reduce storage costs and enable dynamic multi-adapter serving.

## Dataset Formatting Standards

**CRITICAL RULE (FT-004):** Instruction tuning datasets **MUST** adhere to a strict prompt template (e.g., ChatML, Alpaca). The template **MUST** define clear boundaries between system, user, and assistant turns to prevent format collapse during inference.

## Memory & Optimizer Guidelines

- Use **Paged Optimizers** (e.g., `paged_adamw_8bit`) when training on long contexts or large batches to prevent CUDA Out-Of-Memory (OOM) errors during the backward pass.
- Gradient Accumulation **MUST** be used if the logical batch size exceeds available VRAM. (Physical Batch Size * Gradient Accumulation Steps = Logical Batch Size).
