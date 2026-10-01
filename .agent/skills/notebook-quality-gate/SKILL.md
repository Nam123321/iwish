---
name: notebook-quality-gate
description: Validates Push requests before sending to NotebookLM - 5-gate validation for specificity, dimensions, anti-patterns
inputs: ['draft_push_request', 'target_notebook_id']
outputs: ['pass_or_fail', 'improvement_suggestions']
mcp_tools_required: []
subagent_triggers: []
---

# Notebook Quality Gate

## 🎯 Purpose
The Notebook Quality Gate is an OPERATIONS skill that acts as a strict firewall between the agent's intent and NotebookLM. It prevents vague, low-value, or poorly constructed queries from wasting compute and polluting context. Every Push request (query or research start) MUST pass a strict 5-Gate validation process.

## 📋 Prerequisites
- A formulated draft request intended for NotebookLM.
- Access to the target notebook ID and context.

## 🚪 The 5-Gate Validation Protocol

### Gate 1: Specificity (Score ≥ 3/5)
Requests must be highly specific.
- **1/5**: "Tell me about X."
- **3/5**: "Summarize the architectural constraints of X based on the PRD."
- **5/5**: "Extract the specific error handling codes for X and map them to the edge case matrix, ignoring UI layer concerns."
- **Action**: Reject if score < 3. Provide prompt rewriting suggestions.

### Gate 2: Dimensions (Count ≥ 4)
A deep-dive research request must probe multiple facets.
- Must ask for analysis across multiple dimensions (e.g., Security, Performance, UX, Edge Cases, Data Model).
- **Action**: Reject if < 4 dimensions are explicitly requested in the prompt.

### Gate 3: Anti-Patterns Avoidance
The prompt must explicitly define boundaries (what NOT to do).
- A valid request MUST include negative constraints (e.g., "Do not include legacy API endpoints", "Ignore CSS styling").
- **Action**: Reject if no negative constraints or exclusion criteria are provided.

### Gate 4: Research Mode Justification
The agent must declare the intent and scale.
- Fast Query (`notebook_query`): Quick, synchronous lookup.
- Deep Research (`research_start`): Asynchronous, multi-source synthesis.
- **Action**: Reject if a fast query is used for a multi-document synthesis task, or if deep research is invoked for a simple definition. Must include a rationale.

### Gate 5: Target Resolution
No ad-hoc or guessed notebook targeting.
- The target notebook MUST be resolved via a lookup from the `notebook-registry-manager`.
- **Action**: Reject if the notebook ID is hardcoded, hallucinated, or not present in the current registry.

## ✅ Example PASS Scenario
**Prompt**: "Analyze the authentication flow in `auth-spec.md` and `oauth-config.json`. Focus on token refresh lifecycles, error states, security vulnerabilities, and state management. Do NOT include user UI workflows or frontend component code. (Target: Core-Auth-Notebook, Mode: Deep Research)."
**Result**: PASS. Highly specific (5/5), 4 dimensions (lifecycle, errors, security, state), clear anti-pattern (no UI), correct mode, resolved target.

## ❌ Example FAIL Scenario
**Prompt**: "Give me a summary of the authentication system."
**Result**: FAIL. Fails Gate 1 (vagueness), Gate 2 (no dimensions), Gate 3 (no anti-patterns).

## 👣 Step-by-step Instructions
1. **Intercept**: Receive the drafted `notebook_query` or `research_start` request.
2. **Draft**: Write the draft request into a temporary text file (e.g., `_iwish-output/adhoc-workspace/scratch/draft_prompt.txt`).
3. **Execute Physical Gate**: Run the validation script:
   `python3 .agent/scripts/validate_notebook_quality.py _iwish-output/adhoc-workspace/scratch/draft_prompt.txt`
4. **Enforce**: 
   - If the script outputs PASS (exit code 0), you may proceed to call the NotebookLM MCP.
   - If the script outputs FAIL (exit code 1), you MUST rewrite the prompt to fix the failed gates and run the script again. Do NOT call the MCP until the physical script passes.

## 🚨 Error Handling
- Do NOT simulate or mock the output of the validation script. It MUST be executed physically.
- If validation logic fails due to missing context, default to FAIL to enforce strict quality control.

## 🔗 Integration Points
- This skill acts as a pre-execution hook/subagent trigger for the `notebook-request-engineer`. It must be passed before the engineer can call MCP.
