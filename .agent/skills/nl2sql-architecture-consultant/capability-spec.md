# Capability Spec: nl2sql-architecture-consultant

## Type: SKILL
## Status: Draft
## Created: 2026-08-20

### Problem Statement
Building Text-to-SQL (NL2SQL) systems using LLMs introduces complex architectural challenges: context window limits for large schemas, schema linking inaccuracies, multi-database query generation, and execution safety. Development teams often struggle to balance token costs, latency, and accuracy, or fail to foresee semantic errors in the generated SQL. This skill acts as a specialized architect and consultant to review, diagnose, and optimize NL2SQL system architectures based on state-of-the-art frameworks.

### Knowledge Sources
- Source 1: `TKDE Survey on NL2SQL with LLMs` — Extracted the 3-stage lifecycle (Pre-processing, Translation, Post-processing), the unified two-level error taxonomy (semantic vs. syntactic), and evaluation metrics (EX, EM, VES).
- Source 2: `VLDB Tutorial on NL2SQL` — Extracted practical system design patterns, modularized NL2SQL architectures, multi-agent frameworks (e.g., planning-centric agents using MCTS), and cost-effective deployment strategies.

### Core Concepts
1. **The 3-Stage NL2SQL Lifecycle Pipeline:**
   - *Pre-processing (Schema Linking):* Mapping natural language intent to database schema components safely within token limits.
   - *Translation:* Utilizing prompt engineering (Chain-of-Thought, decomposition) and Intermediate Representations (IR) like SemQL.
   - *Post-processing:* Execution-guided self-correction, voting mechanisms, and N-best reranking.
2. **Unified Error Taxonomy:** Distinguishing between linguistic ambiguity, schema mismatch, structural errors, and logical execution failures.
3. **Multi-Agent Architectures for NL2SQL:** Decomposing the generation process into sub-agents (e.g., Schema Linker, SQL Generator, Execution Validator).
4. **Context & Resource Constraints:** Balancing inference costs (token budgeting), latency, and data privacy when selecting modules for an NL2SQL pipeline.

### Anti-Patterns
- ❌ **Blind Schema Dumping:** Injecting entire raw database schemas into the LLM context window without prior Schema Linking or filtering, leading to token blowouts and hallucination.
- ❌ **Lack of Execution Validation:** Trusting the first generated SQL without an execution-guided feedback loop or self-correction mechanism.
- ❌ **Ignoring Semantic Errors:** Only checking for syntactic correctness (whether the SQL compiles) without verifying if it matches the original natural language intent.

### Best Practices  
- ✅ **Implement Modular Schema Linking:** Always use a lightweight retriever or heuristic to filter relevant tables/columns before prompting the main SQL generator.
- ✅ **Use Intermediate Representations (IR):** Where possible, generate an IR (like NatSQL) before translating to dialect-specific SQL to reduce schema dependencies.
- ✅ **Execution-Guided Decoding:** Incorporate a validation agent that runs the SQL on a dummy/read-only database and feeds execution errors back to the generator.
- ✅ **Contextual Awareness:** The consultant must read the project's Architecture Decision Records (ADR), Technical Decision Records (TDR), and Epic/Story context to align recommendations with business constraints.

### Deliverables
- [ ] File 1: `.agent/skills/nl2sql-architecture-consultant/SKILL.md`

### Domain & Trigger Registration
- **Domain:** AI Engineering, System Architecture, Database Design
- **Triggers:** `nl2sql`, `text-to-sql`, `database-agent`, `sql-generation`, `nl2sql-architecture`
- **Action:** The skill must be registered in `.agent/config/domain-skill-registry.yaml` during the Forge phase.
