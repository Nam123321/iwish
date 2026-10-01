# Capability Spec: cognitive-debias-guardian

## Type: SKILL
## Status: Draft
## Created: 2026-08-23

### Problem Statement
Architectural decisions, tool selections, and PR reviews often suffer from confirmation bias, sunk-cost fallacy, and echo-chamber thinking. This capability acts as a forcing function for balanced Socratic debate to mitigate these biases.

### Core Concepts
1. **Socratic Questioning:** Always challenging the status quo and assumptions.
2. **Falsifiability:** Identifying what evidence would prove the decision wrong.
3. **Devil's Advocate:** Explicitly arguing for the discarded alternative.
4. **Base Rate Awareness:** Relying on industry base rates over exceptionalism.

### Anti-Patterns
- ❌ Accepting "It just feels right" without empirical evidence.
- ❌ Trusting a decision simply because a senior engineer or user proposed it.
- ❌ Failing to analyze the hidden costs or operational burden of a chosen path.

### Best Practices  
- ✅ Conduct a "pre-mortem" for major architectural shifts.
- ✅ Require explicit documentation of "Considered Alternatives" in ADRs.
- ✅ Validate evidence trails instead of trusting self-reported metrics.

### Deliverables
- [x] File 1: `SKILL.md`
- [x] File 2: `metadata.yaml`
- [x] File 3: `routing-profile.yaml`
