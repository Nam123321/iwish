---
name: "stratified-data-sampler"
description: "Use when sampling datasets, handling class imbalance, preventing data bias, or selecting subsets by language and intent."
inputs:
  - "input_csv: Path to input dataset"
  - "output_csv: Path to output subset"
  - "fraction: Sampling fraction (default 0.1)"
outputs:
  - "sampled dataset"
  - "distribution shift report"
mcp_tools_required: []
subagent_triggers: []
---

# Stratified Data Sampler

## When to Use This Skill
Use this skill when you need to downsample a dataset or evaluate model performance and must ensure that minority classes (specifically `language` and `intent`) are proportionally represented. 

## Core Rules
1. **Multi-dimensional Stratification:** You MUST stratify the dataset by both `language` and `intent` to guarantee proportional representation.
2. **Class Imbalance Handling:** You MUST ensure low-resource classes are not dropped entirely.
3. **Reproducibility:** You MUST use deterministic seeds (e.g., `random_state=42`) when randomizing within strata.
4. **Data Isolation:** This skill should operate on data post-masking. Do NOT merge privacy/compliance logic into the statistical sampler.

## Execution Guide
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 ${IWISH_HOME:-~/.iwish}/generated-skills/stratified-data-sampler/scripts/runner.py --input <input_csv> --output <output_csv> --frac 0.1`

## Red Flags — STOP and Reconsider
- If you find yourself thinking "The dataset is large enough that random sampling will naturally preserve the distribution", STOP. This is a Silent Bypass rationalization. Minority classes (low-resource languages) will be wiped out or underrepresented. Strict groupby(['language', 'intent']) is mandatory.
- If you find yourself thinking "I'll just drop rows with missing language/intent to make stratification easier", STOP. Dropping rows silently alters the dataset bias. You must either impute an "unknown" category or flag it for manual review.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "Random sampling is fine because of the Law of Large Numbers on this 1M row dataset." | The Law of Large Numbers does not protect long-tail distributions. Strict stratification is always required. |
| "I will just drop null values so pandas `groupby` doesn't crash." | Silently dropping nulls alters data representation. Missing keys must be handled explicitly (e.g., `fillna('unknown')`). |

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-SAM-01 | Missing Keys Validation | Category A (Deterministic) | Runner script exits with error if nulls are found and unhandled | Script standard output/exit code |
| G-SAM-02 | Proportional Representation Check | Category A (Deterministic) | Runner script calculates KL Divergence before/after sampling and fails if > threshold | Script standard output/exit code |
| G-SAM-03 | Code Isolation Check | Category B (Trust-Based) | Agent visually confirms sampling logic does not contain GDPR/masking logic | Agent written confirmation |
