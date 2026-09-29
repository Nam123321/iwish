---
name: skill
description: Universal Intake Gateway to route requests for creating, enhancing, or refactoring skills/workflows based on CWI and SOI metrics.
---

# `/skill` - Universal Intake Gateway

This workflow acts as a single Intake Gateway for tasks related to Capabilities (Skills & Workflows). The system will automatically scan your request, evaluate the Context Weight Index (CWI) and the Semantic Overlap Index (SOI) with the current system, and then route to the most appropriate workflow.

## 1. Payload Parsing & Fallback

**Automated/Headless Trigger:**
If `/skill` is invoked by another Agent, the DEFAULT input must be a JSON string:
```json
{
  "query": "Description of the capability to add...",
  "cwi_hint": 550,
  "headless": true
}
```
**Note (EC-P2-001):** If the payload is missing or malformed when `headless=true`, the system will return an error immediately and MUST NOT invoke `ask_question` to request user input, avoiding automated workflow hangs.

**Manual Trigger (User Input):**
If the user directly types `/skill [text]`, the text will be used as the `query`.

## 2. Intake Evaluation

The orchestrating agent will run the following script to obtain the SOI score:
```bash
python3 .agent/scripts/soi_scanner.py '{"query": "<your_query_here>"}'
```
*(This script is strictly limited to scanning within `.agent/skills/` and `.agent/workflows/` to prevent business code leakage - EC-P6-001, EC-P7-001).*

- **CWI (Context Weight Index):** The agent estimates the length/complexity of the request (e.g., lines of code or token estimate). Default is 100 for short requests.

## 3. Routing Rules

After obtaining the `SOI` and `CWI`, the Agent must sequentially apply the following rules:

1. **SOI <= 30% (Completely New):**
   - **Action:** Route to the `/create-skill` workflow.
   - **(EC-P8-001):** Even if `CWI > 500`, the system MUST prioritize SOI. It will route to `/create-skill` and carry the High CWI parameter for `/create-skill` to handle. It must not call `/refactor-skill` for a capability that does not exist.

2. **SOI >= 75% (Highly Overlapped):**
   - **Action:** High overlap with an existing capability. The system will pivot to the `/enhance-skill` workflow.

3. **30% < SOI < 75% (The Gray Zone):**
   - **Action:** Ambiguous state. Requires AI council intervention.
   - Invoke `/party-mode` with the Personas: `architect-agent-persona`, `capability-agent-persona`.
   - Discuss whether to separate into a new skill or merge into an existing one. After the AI council agrees, ask the User for the final decision.

4. **CWI > 500 & SOI > 30% (High Complexity Refactor):**
   - **Action:** If the overlap is significant (> 30%) but the requested change is highly complex or the current structure is too large (CWI > 500), the system will route to the `/refactor-skill` workflow.

## 4. Execution

Based on the routing result, the Agent automatically invokes the corresponding workflow and passes the payload/query to begin execution.

## 5. Anti-Fabrication Policy

> **Reference:** `.agent/fragments/anti-fabrication-watchmen-pattern.md`

When routing to `/create-skill` or `/enhance-skill`, the following policy applies:

1. **For new capabilities** (`/create-skill`): The forge phase (Step W-03) MUST classify all gates as Category A (Deterministic) or Category B (Trust-Based) and ensure Enforcement Maturity ≥ 30%.

2. **For existing capabilities** (`/enhance-skill`): The upgrade phase (Step E-03) MUST audit existing gates and propose hardening if Enforcement Maturity < 20%.

3. **For Gray Zone routing** (SOI 30-75%): When the AI council evaluates whether to create or enhance, they MUST also assess the Enforcement Maturity of any overlapping skill. Low maturity (< 30%) is an additional argument for enhancement (hardening the existing skill) rather than creating a new one.

4. **Enforcement Maturity Classification:**
   - **High Maturity (>70% Category A):** Skill has strong deterministic verification
   - **Medium Maturity (30-70% Category A):** Acceptable, monitor for improvement opportunities
   - **Low Maturity (<30% Category A):** Flag for hardening — skill may be "paper-only"
   - **Zero Maturity (0% Category A):** CRITICAL — skill has no machine-verified gates, all checks are trust-based and subject to fabrication
