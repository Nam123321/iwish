# Module: Autonomous Loops & Tool Calling

## Purpose
Defines architectures for agentic loops (ReAct, Plan-and-Solve) and tool execution. Moves from single-shot inference to stateful, iterative problem solving.

## Core Principles
1. Autonomous behavior emerges from the iterative loop, not the model.
2. The model reasons (Brain) and the harness acts (Hands).
3. Maximize observability of the loop state.
4. Graceful degradation: The loop must handle tool failure and hallucination.
5. Provide narrow, specific tools rather than broad, generic ones.

## Mental Models & Frameworks
- **The Agent Loop**: Observe -> Think -> Act -> Observe.
- **Reasoning Architectures**: ReAct (Reason + Act), Plan-and-Solve, Reflection (Self-Correction), Tree of Thoughts.
- **Tool Use Lifecycle**: Discovery, Schema Validation, Execution, Error Handling, Feedback.

## Decision Trees
- If task is simple & deterministic -> Single-shot generation.
- If task requires external data -> ReAct loop with Retrieval tool.
- If task is complex & multi-step -> Plan-and-Solve architecture.
- If tool fails -> Provide exact error to LLM and prompt to self-correct (max 3 retries).
- If looping indefinitely -> Enforce hard token/iteration limits (Loop Breaker).

## Anti-patterns
````text
[Anti-Pattern] Infinite ReAct Loops
- Consequence: Massive token cost and system lockup.
- Solution: Implement a Loop Breaker (max iterations threshold).

[Anti-Pattern] Broad "Do Anything" Tools
- Consequence: LLM hallucinates arguments or misuses the tool.
- Solution: Atomic, single-purpose tools with strict JSON schemas.

[Anti-Pattern] Swallowing Tool Errors
- Consequence: Agent hallucinates success and proceeds with false context.
- Solution: Inject raw stderr/stdout back into the prompt for reflection.
````

## Reusable Patterns
````text
[Pattern] ToolSchemaDefinition
OpenAI/Anthropic compatible JSON Schema for tool definition.

[Pattern] ReActLoopController
Python while-loop implementation of ReAct with iteration limits.

[Pattern] ErrorReflectionPrompt
Standardized prompt for asking the LLM to fix a broken tool call.
````

## References
- Source playbook references stored in .

## References
- Source playbook references stored in lineage.jsonl.
