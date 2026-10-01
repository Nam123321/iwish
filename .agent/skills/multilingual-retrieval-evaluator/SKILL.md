---
name: "multilingual-retrieval-evaluator"
description: "Use when evaluating normalized multilingual search or retrieval results against language-specific truth sets."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# Multilingual Retrieval Evaluator

## When to Use This Skill
Use this skill when you need to evaluate the performance (precision, recall, nDCG, MRR) of multilingual retrieval systems, and specifically when comparing normalized search results against ground truth sets that are separated by language.

## Core Rules
1. Compare results only after applying Unicode normalization and language-specific tokenization.
2. Ensure the baseline truth set matches the language of the query or the target document.
3. Fail explicitly if language tags are missing in the input retrieval results.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I can just use exact string match across all languages", STOP. This is a Silent Bypass rationalization. You must use language-appropriate normalizers.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll skip normalizing the Unicode." | Multilingual results will fail exact match comparisons. |
| "I'll evaluate all languages together." | Obscures language-specific performance degradation. |

## Anti-Patterns
- ❌ NEVER evaluate raw un-normalized text.
- ❌ NEVER mix ground truth sets across different query languages without explicit mapping.

## Best Practices
- ✅ ALWAYS ensure language tags are preserved.
- ✅ ALWAYS group metrics by query language.

## Version Notes
- Initial draft created via automated headless workflow.
