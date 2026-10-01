# Capability Spec: security-classifier-gate-builder

## Type: SKILL
## Status: Draft
## Created: 2026-07-30

### Problem Statement
Dynamic AI workflows are vulnerable to adversarial prompt poisoning and pattern poisoning attempts. There is a need for a foundational/supportive skill that acts as a security gate to evaluate and filter malicious contexts dynamically before passing them to execution layers.

### Knowledge Sources
- Source 1: User Request — FIX-46-01 from recent retrospective.

### Core Concepts
1. **Prompt Poisoning Detection**: Identifying adversarial instructions embedded in user inputs.
2. **Pattern Poisoning Recognition**: Detecting repetitive structural anomalies designed to confuse the model.
3. **Dynamic Filtering Gate**: A blocking mechanism that halts execution if the input context fails validation.
4. **Clean-Room Evaluation**: Using an isolated LLM evaluation context to test the safety of an input prompt before execution.

### Anti-Patterns
- ❌ Do NOT execute the potentially poisoned prompt during the evaluation phase.
- ❌ Do NOT rely solely on simple regex/keyword filtering; employ semantic checks.
- ❌ Do NOT silently drop poisoned prompts without logging the attempt for telemetry.

### Best Practices  
- ✅ Fail closed: If the classifier is uncertain, default to blocking the prompt.
- ✅ Log all filtered attempts with the corresponding threat score for auditability.
- ✅ Isolate the gate context from the main operational context.

### Deliverables
- [ ] File 1: `SKILL.md`
- [ ] File 2: `metadata.yaml`
- [ ] File 3: `lineage.jsonl`
- [ ] File 4: `promotion-plan.md`
