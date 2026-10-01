---
name: "cognitive-debias-guardian"
description: "Use when evaluating architectural decisions, conducting ADR reviews, assessing tool selections, or whenever the user/agent might be falling into confirmation bias or echo-chamber thinking."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# Cognitive Debias Guardian

## When to Use This Skill
- During Architecture Decision Record (ADR) reviews.
- When an agent or user strongly favors a specific tool/framework without sufficient comparison.
- When evaluating vendor products or open-source solutions.
- When a decision seems one-sided or lacks a "devil's advocate" perspective.

## Core Rules
1. **Socratic Questioning:** Always ask "What if the opposite were true?" or "What are the hidden costs of this approach?"
2. **Devil's Advocate:** Explicitly argue for the alternatives that were discarded.
3. **Falsifiability Check:** Ask what evidence would prove the proposed decision wrong. If no such evidence exists, the decision is based on belief, not engineering.
4. **Base Rate Fallacy Check:** Check if the decision relies on exceptionalism ("Our use case is unique") rather than industry base rates.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| CDG-01 | Falsifiability Test | Category B (Trust-Based) | Agent self-assessment | Agent logs of questions asked |
| CDG-02 | Alternative Cost Analysis | Category B (Trust-Based) | Review of alternative options | Explicit mention of alternative costs |

## Red Flags — STOP and Reconsider
- "Everyone is doing it." (Bandwagon effect)
- "We already invested too much time in this." (Sunk cost fallacy)
- "It just feels right." (Affect heuristic)
- "I've always used X in the past." (Availability heuristic)
- If you find yourself thinking "This is obviously the best choice without needing proof," STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The user already decided, I should just agree." | The user is relying on us to challenge them and ensure rigor. |
| "Writing out the pros and cons takes too long." | Missing a fatal flaw takes longer to fix in production. |

## Industry Standards & Best Practices
- **ADR Format:** Use standard ADR structures that explicitly require "Considered Alternatives."
- **Pre-mortems:** Conduct a pre-mortem by assuming the decision failed in 6 months and working backward to explain why.
