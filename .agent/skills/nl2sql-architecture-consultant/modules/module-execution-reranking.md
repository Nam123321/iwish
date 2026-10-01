# Module: Post-processing & Execution Validation

## Objective
Validate, refine, and select the best SQL candidate from the Translation module.

## Core Concepts
- **Execution-Guided Decoding:** Running the generated SQL against a replica/dummy database. If it crashes (Syntax Error) or returns an empty set when data is expected, feed the error back to the LLM.
- **Voting Architectures:** Generating N candidates using different LLMs or temperatures, and selecting the most common valid structure.
- **Unified Error Taxonomy:**
  - *Syntactic Errors:* Bad SQL syntax, non-existent columns.
  - *Semantic Errors:* Runs perfectly but answers the wrong question (e.g., using `AND` instead of `OR`).

## ❌ Anti-Patterns
- **Trusting the First Output:** Returning unverified SQL to a user application, exposing the system to SQL injection or application crashes.
- **Testing on Production DBs:** Running generated validation queries on the live master database without readonly restrictions or sandboxing.

## ✅ Best Practices
1. **Self-Correction Loop:** Implement a loop where the LLM sees the execution error and its previous attempt, and is asked to fix it (max 3-5 retries).
2. **Semantic Verification:** Have an independent LLM "read" the generated SQL and explain what it does in natural language, comparing it to the user's original query to detect Semantic Errors.
