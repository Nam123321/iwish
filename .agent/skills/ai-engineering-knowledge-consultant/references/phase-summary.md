# AI Engineering Curriculum — Phase Summary Reference

Comprehensive mapping of all 20 phases (523 lessons) for the AI Engineering Knowledge Consultant NLU routing engine.

| Phase ID | Name | Lessons | Core Topics & Focus Areas | Key Keywords |
|----------|------|---------|---------------------------|--------------|
| **00** | setup-and-tooling | 12 | Dev environment, uv, pyenv, GPU drivers, Docker, devcontainers | setup, tooling, environment, gpu, docker, uv |
| **01** | math-foundations | 24 | Linear algebra, calculus, probability, statistics, optimization algorithms | math, linear algebra, calculus, gradient, probability |
| **02** | ml-fundamentals | 30 | Classical ML: regression, classification, clustering, trees, SVM, metrics | ml, regression, random forest, svm, clustering |
| **03** | deep-learning-core | 36 | Neural networks, backpropagation, PyTorch from scratch, CNNs, RNNs | deep learning, neural networks, pytorch, backprop, cnn |
| **04** | computer-vision | 28 | Vision transformers (ViT), object detection, segmentation, diffusion | vision, vit, object detection, segmentation, yolo |
| **05** | nlp-foundations-to-advanced | 32 | Tokenization (BPE/WordPiece), word2vec, seq2seq, attention mechanism | nlp, tokenization, embeddings, attention, seq2seq |
| **06** | speech-and-audio | 20 | Audio processing, Whisper, ASR, TTS, audio embeddings | audio, speech, whisper, asr, tts, voice |
| **07** | transformers-deep-dive | 34 | Multi-head attention, RoPE, KV cache, flash attention, transformer blocks | transformers, attention, kv cache, flash attention, rope |
| **08** | generative-ai | 30 | VAEs, GANs, Diffusion models from scratch, guidance, latent models | genai, diffusion, generative, vae, gan, stable diffusion |
| **09** | reinforcement-learning | 26 | MDPs, Q-learning, policy gradients, PPO, DPO, RLHF algorithms | rl, rlhf, ppo, dpo, policy gradient, reward model |
| **10** | llms-from-scratch | 38 | Pre-training, synthetic data, tokenizer training, pre-training loops | pretraining, train llm, scratch llm, tokenizer train |
| **11** | llm-engineering | 32 | Prompting, RAG, Advanced RAG, Fine-tuning LoRA, Function calling, LangGraph | rag, prompt engineering, lora, fine-tuning, function calling, langgraph |
| **12** | multimodal-ai | 24 | Vision-language models (CLIP, LLaVA), audio-LLM fusion, cross-attention | multimodal, clip, llava, vision language, cross-attention |
| **13** | tools-and-protocols | 26 | Model Context Protocol (MCP), tool calling, API abstractions, schema | mcp, protocols, tool use, json schema, context protocol |
| **14** | agent-engineering | 36 | ReAct loop, reflection, planning, memory architectures, tool routing | agent loop, react, reflection, agent memory, planning |
| **15** | autonomous-systems | 28 | Long-running workflows, guardrails (LlamaGuard), failure recovery | autonomous, guardrails, llama guard, self-healing, resilience |
| **16** | multi-agent-and-swarms | 24 | Orchestration, supervisor agents, consensus voting, swarm topologies | multi-agent, swarms, supervisor, agent teams, consensus |
| **17** | infrastructure-and-production | 36 | vLLM, TensorRT-LLM, quantization (AWQ/GPTQ), Triton server, latency | vllm, tensorrt, serving, quantization, awq, gptq, triton, latency |
| **18** | ethics-safety-alignment | 25 | Red teaming, jailbreaks, prompt injection defense, constitutional AI | safety, alignment, red teaming, jailbreak, prompt injection |
| **19** | capstone-projects | 18 | End-to-end production AI platforms, enterprise integration, benchmarks | capstone, production project, enterprise ai, benchmark |

## Routing Rule
1. **Keyword Match**: Scan user query against Phase Keywords.
2. **Phase Priority**:
   - Tier 1 (Deep): Phases 11, 13, 14, 16, 17, 18
   - Tier 2 (Core): Phases 07, 09, 10, 12, 15
   - Tier 3 (Foundational): Phases 00-06, 08, 19
