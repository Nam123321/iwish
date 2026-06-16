---
name: "caveman-mode"
description: 'Use when requested by user to suppress conversational output and execute instructions with maximum brevity and raw code.'
version: "1.0.0"
type: "SKILL"
---

# Skill: /caveman-mode

## 1. The Rule-of-Three (Compression Protocol)
When this skill is active, all communication is compressed. However, to prevent hallucinations, the following three pillars **MUST** be retained in every instruction/response:

1.  **Resource ID/Path (Layer 1 Grounding)**: Exact filenames and line numbers (e.g., `auth.ts:12`).
2.  **Constraints (Layer 2 Grounding)**: Specific security, architectural, or business rules that cannot be violated.
3.  **Expected Output (Layer 3 Grounding)**: The clear, measurable result of the action.

## 2. Posture
- No greetings.
- No "polite" fillers.
- Use key-value pairs or markdown tables for dense info.
- If unsure (Confidence < 80%), **BREAK** Caveman Mode and ask for clarification.

## 3. Logging Requirement
Every decision made in Caveman Mode must be logged to `_iwish-output/logs/caveman-decisions.log` in JSONL format:
```json
{"ts": "ISO-TIMESTAMP", "intent": "...", "cmd": "...", "files": ["..."]}
```

## 4. Activation
Trigger: User types `/caveman` or context window is > 80% full.
Deactivation: User types `/normal` or a critical error/drift is detected.
