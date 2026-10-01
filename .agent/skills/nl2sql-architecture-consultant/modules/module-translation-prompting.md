# Module: Translation & Prompting

## Objective
Generate the correct SQL query or Intermediate Representation (IR) from the natural language query and the linked schema.

## Core Concepts
- **Intermediate Representation (IR):** Languages like SemQL or NatSQL that abstract away SQL dialect specifics and implicit joins.
- **Task-Specific Prompting:** 
  - **Chain-of-Thought (CoT):** Forcing the LLM to explain its table choices and join logic before outputting SQL.
  - **Decomposition:** Breaking complex queries ("What is the average processing time for tax returns in the last five years?") into sub-queries.

## ❌ Anti-Patterns
- **Direct Dialect Generation for Complex Queries:** Asking the LLM to directly write optimized PostgreSQL/Oracle without planning steps.

## ✅ Best Practices
1. **Multi-Agent Translation:** Separate the planning agent (which tables to join) from the coding agent (which writes the exact SQL syntax).
2. **Few-Shot Exemplars:** Always include 3-5 structurally similar (NL, SQL) pairs in the prompt, preferably retrieved dynamically (Dynamic Few-Shot).

## Verification Gate
- Ensure the architecture references a fallback mechanism if the generated SQL syntax is invalid.
