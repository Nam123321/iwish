# LLMOps - Serving & Multi-Tenant Deployment Module

This module provides constraints for deploying LLMs at scale, particularly focusing on serverless environments, vLLM, and LoRAX (Multi-LoRA serving).

## ⚠️ Core Architectural Constraints

**CRITICAL RULE (SV-001):** When designing a multi-tenant application where different tenants require different fine-tuned behavior from the same base model, you **MUST NEVER** deploy separate full-model instances for each tenant. You **MUST** use a Multi-LoRA serving architecture (like LoRAX or vLLM with LoRA enabled) to route requests to tenant-specific adapters on a single base model.

**CRITICAL RULE (SV-002):** For high-throughput serving, you **MUST** configure the inference engine to utilize **PagedAttention** (native to vLLM). This minimizes memory fragmentation in the KV cache, significantly increasing the maximum batch size.

**CRITICAL RULE (SV-003):** When deploying on Serverless GPU platforms (e.g., Modal, RunPod), you **MUST** ensure the cold-start time is mitigated. Base model weights **MUST** be pre-baked into the container image or cached in a high-speed network volume, rather than downloaded from the HuggingFace Hub at runtime.

**[EDGE-CASE GUARDIAN] CRITICAL RULE (SV-005 - EC-P10-001):** To prevent Serverless Cost Burn (RPN: 48), you **MUST NOT** configure Serverless instances to `keep_warm: true` indefinitely without an explicit budget review. All serverless scaling configurations must include a strict idle timeout (e.g., 5-10 minutes) to prevent unbounded cloud bills.

## RAG & Vector Search Deployment

**CRITICAL RULE (SV-004):** When designing Vector Databases for RAG in multi-tenant SaaS, you **MUST** enforce logical payload isolation (tenant ID filtering in metadata) combined with Dense Vector Search (HNSW) to prevent cross-tenant data leakage.

**[EDGE-CASE GUARDIAN] CRITICAL RULE (SV-006 - EC-P6-001):** To prevent Cross-Tenant Adapter Leakage in Multi-LoRA setups (RPN: 60), API Gateways **MUST** strip client-provided `adapter_id` values and inject them securely at the backend based on the validated JWT Tenant ID. **NEVER** trust the client to specify which LoRA adapter to invoke.

## Reliability and Anti-Patterns

- **NEVER** expose the raw inference server (e.g., vLLM endpoint) directly to the public internet. You **MUST** place it behind an API Gateway that enforces rate limiting, token authentication, and payload sanitization.
- Beware of OOM (Out of Memory) during concurrent requests. You **MUST** define `max_num_batched_tokens` and `max_num_seqs` strictly based on available VRAM to prevent the server from crashing under load.
