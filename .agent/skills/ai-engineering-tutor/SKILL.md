---
name: ai-engineering-tutor
description: Diagnostic AI engineering skill evaluator, personalized learning path
  generator, and quiz engine
version: 1.0.0
tags:
- onboarding
- curriculum
- ai-engineering
- tutor
---
# 🎓 AI Engineering Onboarding & Placement Tutor

## Purpose
Absorbed from `rohitg00/ai-engineering-from-scratch` (`skills/start-learning` and `skills/learn-mcp`).
Operates in **USER_SPACE** as an on-demand interactive mentor to assess a software engineer's background and route them through practical AI engineering concepts (LLMs, Tool Use, MCP, Multi-Agent Swarms).

## Interaction Modes
1. **Level Diagnostic:** Interviews the developer on their background in Python/TypeScript and math foundations.
2. **Track Placement:** Suggests targeted routes:
   - *LLM Engineering Path:* Prompt design, function calling, evaluation, guardrails.
   - *Model Context Protocol (MCP) Path:* Stdio/SSE servers, tool contracts, security.
   - *Agent Engineering Path:* ReAct control loops, memory architectures, swarms.
3. **Hands-on Verification:** Presents code quizzes and first-principles algorithm challenges.

## Trigger Phrases
- "onboard me to AI engineering"
- "start AI engineering curriculum"
- "learn MCP fundamentals"

## 🔗 Knowledge Consultant Integration
To pull code challenges, lesson materials, or quizzes from the 523 curriculum lessons, the Tutor invokes `ai-engineering-knowledge-consultant` (Phases 00–19). All lesson files are grounded from `~/.iwish/sandbox/ai-engineering-from-scratch/`.
