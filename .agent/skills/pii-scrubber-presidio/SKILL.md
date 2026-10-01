---
name: "pii-scrubber-presidio"
description: "Use when curating data for model fine-tuning, anonymizing text data, scrubbing PII from datasets, or when the user mentions Presidio, anonymization, or data leakage prevention."
inputs: ["input_file", "output_file"]
outputs: ["scrubbed_dataset"]
mcp_tools_required: []
subagent_triggers: []
---

# pii-scrubber-presidio

## When to Use This Skill
- Preparing a dataset for LLM fine-tuning.
- Scrubbing sensitive user data (PII) before storage or sharing.
- Complying with data privacy requests involving unstructured text.

## Core Rules
1. **Never** train models on raw, unscrubbed production data.
2. Ensure the output format matches the input format exactly (e.g., valid JSONL) after redaction.
3. Use `<TAG>` format for redacted entities (e.g., `<PERSON>`).

## Execution Guide
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 ${IWISH_HOME}/generated-skills/pii-scrubber-presidio/scripts/runner.py --input <target> --output <output>`

## Red Flags — STOP and Reconsider
- If you find yourself thinking "The data is just internal, it doesn't need PII scrubbing", STOP. This is a Silent Bypass rationalization.
- If you find yourself thinking "I'll just use a simple regex instead of running the Presidio pipeline to save time", STOP. Regex misses contextual PII.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "This dataset is only for a quick test fine-tune." | Even test fine-tunes can leak data; all curation MUST be scrubbed. |
| "I'll write a python script with re.sub() for emails." | Regex is insufficient for PERSON or complex ORG names; Presidio is mandatory. |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1 | Check input file format | Category A | Script throws error if not JSONL | Exit code 0 |
| GATE-2 | Verify Presidio redaction output | Category A | Script counts redactions | stdout log |
| GATE-3 | Contextual over-redaction check | Category B | Agent reviews 5 samples | Agent thought log |

**Enforcement Maturity:** 66% (High Maturity)
