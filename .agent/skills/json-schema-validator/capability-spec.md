# Capability Spec: json-schema-validator

## Type: SKILL
## Status: Draft
## Created: 2026-07-30

### Problem Statement
Provides deterministic JSON syntax validation and few-shot examples to auto-correct schema generation errors.

### Knowledge Sources
- Source 1: Headless Input — deterministic validation and few-shot correction

### Core Concepts
1. Deterministic syntax validation for JSON
2. Few-shot example driven schema auto-correction

### Anti-Patterns
- ❌ Relying purely on LLM instinct for JSON structure without deterministic parsing.
- ❌ Generating schemas without verifying they match the JSON specification.

### Best Practices  
- ✅ Always parse JSON deterministically before trusting LLM output.
- ✅ Use explicit few-shot examples to guide corrections of schema errors.

### Red Flags — STOP and Reconsider
- If you find yourself thinking "The LLM usually gets JSON right, I don't need to run a deterministic parser", STOP. This is a Silent Bypass rationalization.

### Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The LLM usually gets JSON right..." | JSON validation must be deterministic; syntax errors break downstream parsers. |

### Deliverables
- [ ] File 1: `.agent/skills/json-schema-validator/SKILL.md`
- [ ] File 2: `.agent/skills/json-schema-validator/scripts/runner.py`
