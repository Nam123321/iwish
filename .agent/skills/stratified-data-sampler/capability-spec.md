# Capability Spec: stratified-data-sampler

## Type: SKILL
## Status: Draft
## Created: 2026-08-07

### Problem Statement
Provides data operations for strict stratified sampling per language and intent to prevent data bias in ML datasets or evaluations.

### Knowledge Sources
- Source 1: User Request — "Provides data operations for strict stratified sampling per language and intent to prevent data bias."
- Source 2: AI Council Debate — Decided to keep separate from data-privacy-compliance-skill to adhere to Single Responsibility Principle.

### Core Concepts
1. **Multi-dimensional Stratification:** Stratify dataset by both `language` and `intent` to guarantee proportional representation.
2. **Class Imbalance Handling:** Ensure low-resource classes are upsampled or protected during subset selection.
3. **Reproducibility:** Use deterministic seeds when randomizing within strata.
4. **Data Isolation:** This skill should operate on data post-masking, preventing any overlap with compliance rules.

### Anti-Patterns
- ❌ Using random sampling without stratification, leading to minority class exclusion.
- ❌ Merging privacy/compliance logic into the statistical sampler.
- ❌ Ignoring missing values in stratification keys (language/intent).

### Best Practices  
- ✅ Set explicit random seeds for reproducibility.
- ✅ Validate dataset schema before sampling (ensure `language` and `intent` columns exist).
- ✅ Output sampling reports detailing distribution shifts (if any) before and after sampling.

### Deliverables
- [ ] File 1: `.agent/skills/stratified-data-sampler/SKILL.md`

### Domain & Trigger Registration
- Domain: Data Engineering / ML Ops
- Trigger keywords: "stratified sampling", "prevent data bias", "sample by language and intent", "dataset stratification".
- Note: Must be registered in `.agent/config/domain-skill-registry.yaml` during the Forge/Validate phase.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "The dataset is large enough that random sampling will naturally preserve the distribution", STOP. This is a Silent Bypass rationalization. Minority classes (low-resource languages) will be wiped out or underrepresented. Strict groupby(['language', 'intent']) is mandatory.
- If you find yourself thinking "I'll just drop rows with missing language/intent to make stratification easier", STOP. Dropping rows silently alters the dataset bias. You must either impute an "unknown" category or flag it for manual review.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "Random sampling is fine because of the Law of Large Numbers on this 1M row dataset." | The Law of Large Numbers does not protect long-tail distributions. Strict stratification is always required. |
| "I will just drop null values so pandas `groupby` doesn't crash." | Silently dropping nulls alters data representation. Missing keys must be handled explicitly (e.g., `fillna('unknown')`). |
