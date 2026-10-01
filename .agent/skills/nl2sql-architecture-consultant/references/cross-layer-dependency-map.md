# Cross-Layer Dependency Map: NL2SQL Architecture

NL2SQL pipelines are highly interdependent. You MUST consult this map when modifying or designing any stage of the system.

## The 3-Stage Pipeline Dependencies

### 1. Schema Linking ↔ Translation Prompting
- **Dependency:** The output of Schema Linking determines the payload size (Token Budget) for the Translation module.
- **Rule:** If Schema Linking uses a weak retriever (yielding too many tables), you MUST verify that the Translation module uses a large-context LLM (e.g., Gemini 1.5 Pro) or implement a Strict Token Budget Gate.
- **Rule:** If you switch to an Intermediate Representation (IR) in Translation, the Schema Linking module must output metadata compatible with that IR.

### 2. Translation Prompting ↔ Execution Reranking
- **Dependency:** Execution-guided strategies require the Translation module to generate **multiple candidates** (N-best) or expose iterative feedback loops.
- **Rule:** If you add Execution Reranking, you MUST update the Translation module to use `temperature > 0.0` or diverse prompting (e.g., Self-Consistency) to generate a variety of candidates.

### 3. Execution Reranking ↔ Schema Linking
- **Dependency:** When execution fails due to a missing table/column, the error must feed back not just to Translation, but potentially trigger a re-run of Schema Linking.
- **Rule:** A robust multi-agent architecture must allow the Execution Validator to send feedback explicitly to the Schema Linker.
