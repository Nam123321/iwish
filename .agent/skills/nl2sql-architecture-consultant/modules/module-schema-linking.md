# Module: Pre-processing & Schema Linking

## Objective
Filter the massive, noisy database schema into a condensed, highly relevant subset of tables and columns based on the user's natural language query.

## Core Concepts
- **Schema Linking:** The bridge between the user's intent (NL) and the database structure (DDL).
- **Retrieval-Augmented Schema:** Using Vector DBs to embed table definitions and retrieve only the top-K relevant tables.

## ❌ Anti-Patterns
- **The "Dump DDL" Fallacy:** Passing the entire database schema into the LLM prompt. This destroys latency, blows up the token budget, and causes extreme hallucination (especially resolving ambiguous column names across hundreds of tables).

## ✅ Best Practices
1. **Two-Pass Retrieval:** 
   - Pass 1: Retrieve relevant tables.
   - Pass 2: Retrieve relevant columns within those tables.
2. **Context Injection:** Append foreign key constraints and relevant sample values (e.g., categorical distinct values) for the selected columns to help the LLM format `WHERE` clauses correctly.

## Verification Gate
- Run `token-budget-calculator.py` to ensure the resulting injected schema fits comfortably within the target model's limits (usually < 50% of context to leave room for reasoning).
