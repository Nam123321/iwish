# Capability Spec: pii-scrubber-presidio

## Type: SKILL
## Status: Draft
## Created: 2026-08-07

### Problem Statement
When curating data for model fine-tuning, PII (Personally Identifiable Information) must be scrubbed to prevent data leakage and ensure compliance with privacy laws. Microsoft Presidio offers a robust way to detect and anonymize this data, but it needs to be integrated into an automated curation pipeline with a dedicated capability.

### Adversarial Spec Review
1. **The "Why Not" Test:** Presidio is a heavyweight dependency that relies on NLP models (like spaCy), which might slow down data processing pipelines compared to regex-based scrubbing. It might also require additional deployment resources.
2. **Failure Analysis:** If the skill fails, it might be due to Presidio's underlying NER model failing to detect edge-case PII (e.g. non-standard phone numbers or obfuscated emails), leaking PII into the fine-tuning dataset, OR over-redacting important domain-specific tokens, degrading the fine-tuned model's quality.
3. **Redundancy Check:** Although `data-privacy-compliance-skill` exists (SOI 29.73%), it is a general compliance check. `pii-scrubber-presidio` is a specialized, active scrubbing capability focused on data curation for LLM fine-tuning pipelines.

### Knowledge Sources
- Source 1: User Request — "Automated PII scrubbing capability to securely curate data for fine-tuning using Presidio."

### Core Concepts
1. **PII Detection Pipeline:** Uses Presidio Analyzer to identify entities (PERSON, PHONE_NUMBER, EMAIL_ADDRESS, CREDIT_CARD, etc.) in text.
2. **PII Anonymization:** Uses Presidio Anonymizer to replace detected entities with placeholders (e.g. `<PERSON>`, `<EMAIL>`) or synthetic data.
3. **Fine-Tuning Dataset Compatibility:** Ensures the output format remains valid for fine-tuning (e.g. JSONL) without breaking syntax.
4. **Custom Recognizers:** Ability to add custom regex or deny-lists for domain-specific PII.
5. **Confidence Thresholds:** Setting minimum confidence scores to balance recall and precision during scrubbing.

### Anti-Patterns
- ❌ Do not run PII scrubbing *after* fine-tuning data is finalized; it must be the first stage of the curation pipeline.
- ❌ Do not rely solely on regex for PII; context-aware NLP (spaCy/Transformers) must be used.
- ❌ Do not discard the mapping of anonymized entities if reversible anonymization is required for auditing.

### Best Practices  
- ✅ Always use standard placeholder tags (e.g. `[EMAIL]`) that the model can learn to ignore or treat as generic entities during fine-tuning.
- ✅ Implement custom recognizers for internal company data (e.g. employee IDs, internal project codenames).
- ✅ Validate the output JSONL after anonymization to ensure quotes or brackets haven't corrupted the dataset structure.

### Domain & Trigger Registration Planning
- **Domain:** Data & Analytics, AI Engineering
- **Triggers:** "scrub PII", "anonymize data", "clean fine-tuning dataset", "presidio"
- *This skill MUST be registered in `.agent/config/domain-skill-registry.yaml` during the Forge/Validate phase.*

### Deliverables
- [ ] File 1: `.agent/skills/pii-scrubber-presidio/SKILL.md`
- [ ] File 2: `.agent/skills/pii-scrubber-presidio/scripts/scrub_dataset.py` (optional reference implementation)
