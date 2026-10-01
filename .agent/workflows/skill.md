---
name: skill
description: Universal Intake Gateway to route requests for creating, enhancing, or refactoring skills/workflows based on CWI and SOI metrics.
---

# `/skill` - Universal Intake Gateway

This workflow acts as a single Intake Gateway for tasks related to Capabilities (Skills & Workflows). The system will automatically scan your request, evaluate the Context Weight Index (CWI) and the Semantic Overlap Index (SOI) with the current system, and then route to the most appropriate workflow.

## 0. Gateways & Initialization

**Concurrency Lock (Hard Gate):**
- **Action:** Sanitize the capability name using regex `^[a-zA-Z0-9_-]{1,64}$`.
- **Action:** Create an atomic lock directory: `mkdir .lock`. If it fails, check the timestamp. If older than 2 hours, prompt the user to override. If not, HALT and report that another pipeline is running.

**State Machine Checkpoint:**
- **Action:** Check for existing `state.json`. If found, prompt the user: "Checkpoint found. Resume or restart?"
- **Action:** If corrupted or unparseable, DO NOT DELETE. Rename to `state.corrupt.json`, HALT the pipeline, and escalate to the user for manual intervention.

## 1. Payload Parsing & Fallback

**Automated/Headless Trigger:**
If `/skill` is invoked by another Agent, the DEFAULT input must be a JSON payload passed as a physical file, not a raw string.
```json
{
  "query": "Description of the capability to add...",
  "cwi_hint": 550,
  "headless": true,
  "hybrid_rag_context": {
    "notebook_id": "...",
    "falkordb_graph": "..."
  }
}
```
**Zero-Trust Gate (Payload Validation):** The Agent MUST run the payload validator before proceeding:
`python3 .agent/scripts/validate-skill-payload.py --file "$PAYLOAD_FILE_PATH"`
If the script fails (invalid schema, missing `query`, or empty strings), the workflow HALTS immediately.

**Manual Trigger (User Input):**
If the user directly types `/skill [text]`, the text will be used as the `query`.

## 1.5. Pre-Computation Research (Knowledge Gathering)

**MANDATORY:** Before evaluating the query for overlap or complexity, the system MUST perform Pre-Computation Research to ensure sufficient context and knowledge.
- **Zero-Trust Anti-Hallucination Policy:** The agent MUST NOT hallucinate or guess the names of research files. The agent MUST physically verify the existence of files using tools (e.g., `list_dir` on `_iwish-output/research/` or `grep_search`) before attempting to read them.
- **Internal Documentation Evaluation:** The agent MUST evaluate the query to determine the most relevant internal documents and data sources to use based on the specific purpose.
- **Reference Core Specs:** The agent MUST proactively reference core architecture and database specifications such as `_iwish-output/2. Product Planning/2.5. architecture.md` and `_iwish-output/2. Product Planning/2.2. database-spec.md` using the `view_file` tool.
- **Reference Research Context:** The agent MUST use tools to list and reference existing research files in the `_iwish-output/1. Idea Discovery/1.4. research/` folder and the `_iwish-output/research/` folder (where `/nlm-research` reports are stored, e.g. `_iwish-output/research/llm-engineering-architecture-master-v3.md`), or other relevant folders based on the requirements.
- Invoke `/ae-notebook-orchestrator` or `/nlm pull` using keywords from the `query`.
- Extract any internal doctrines, similar capabilities, or related context from the Knowledge Graph.
- This ensures the agent is fully informed about the ecosystem before making a routing decision, preventing redundant or disjointed capability creation.

## 2. Intake Evaluation

The orchestrating agent will run the following script to obtain the SOI score:
```bash
python3 .agent/scripts/soi_scanner.py '{"query": "<your_query_here>"}'
```
*(This script is strictly limited to scanning within `.agent/skills/` and `.agent/workflows/` to prevent business code leakage - EC-P6-001, EC-P7-001).*

- **CWI (Context Weight Index):** The agent estimates the length/complexity of the request (e.g., lines of code or token estimate). Default is 100 for short requests.

## 2.5. Hotspot Detection & Watchmen Enforcement

After computing CWI and SOI, the Agent MUST analyze the `query` and proposed capability requirements to identify any **Hotspots** (high-risk operations that require strict Zero-Trust enforcement).

**Hotspot Criteria:**
- Modifying, dropping, or writing to the Database.
- Approving PRs, merging code, or deploying to production.
- Changing core architecture (`architecture.md`, `database-spec.md`).
- Executing arbitrary code (RCE) outside a secure sandbox.
- Accessing or manipulating API Keys, Secrets, or billing structures.

**Enforcement:**
- **Anti-Prompt-Injection Fallback:** The Agent MUST NOT rely solely on LLM reasoning to determine Hotspots. The Agent MUST run a Category A script utilizing an AST/SAST scanner (e.g., Semgrep) to evaluate the semantic intent of the query for high-risk operations (`db`, `drop`, `write`, `exec`, `api_key`). Simple Regex scanning is structurally forbidden as it can be bypassed via string concatenation or obfuscation. If the SAST script detects a hotspot but the LLM reasoning dismisses it, the script's verdict OVERRIDES the LLM, and the Hotspot MUST be enforced.
- If Hotspots are detected, the Agent MUST compile a list of `hotspot_gates` (e.g., `["db-write-validation", "pr-approval-check"]`).
- This list MUST be passed as a mandatory parameter to the downstream workflow (`/create-skill` or `/enhance-skill`).
- Downstream workflows are structurally **FORBIDDEN** from using Category B (Trust-Based) or standard Category A (local scripts) for these identified Hotspots. They MUST be designed as **Category A+** gates utilizing the `watchmen-mcp` `sign_capability_gate` tool to obtain Out-of-Band HMAC signatures.
- Non-hotspot steps should continue to use standard Category A or Category B gates to minimize execution friction.

## 2.8. Macro-Micro Conflict Assessment

Before finalizing any routing decision, the orchestrator MUST evaluate if the proposed skill/workflow conflicts with or necessitates an update to the system's macro-architecture.

**Assessment Mandate:**
- **Zero-Trust Gate (Stale Evidence Purge):** The Agent MUST extract `{uuid}` from the payload filename or inputs, and execute `rm -f _iwish-output/adhoc-workspace/scratch/{uuid}-intake-assessment.json` before starting.
- **Global Rules Check:** Scan `.agents/AGENTS.md` and the existing `.mdc` rule files in `.agents/rules/`.
- **Workflow & Pipeline Integration Check:** Scan existing core workflows (`.agent/workflows/`) and related skills (`.agent/skills/`) to ensure the new capability integrates cleanly without breaking established SDLC pipelines.
- **Conflict Detection:** Determine if the new capability requires overriding a global rule or disrupts an existing pipeline.
- **Resolution:** If a conflict or gap is detected, the Agent MUST include a mandatory requirement in the downstream `/create-skill` or `/enhance-skill` workflow to **UPDATE the global `.mdc` files AND the affected workflow files** alongside creating the skill.
- **Zero-Trust Gate (Evidence Generation):** The Agent MUST physically write the assessment results to `_iwish-output/adhoc-workspace/scratch/{uuid}-intake-assessment.json`.
- **Zero-Trust Gate (Enforcement):** The Agent MUST execute:
  `python3 .agent/scripts/pipeline-integrity-runner.py --target "{uuid}-intake-assessment" --type project --phase discovery`
  If the check fails or the file does not exist, the workflow HALTS and routing is forbidden.
- **Garbage Collection:** The Agent MUST execute `rm -f _iwish-output/adhoc-workspace/scratch/{uuid}-intake-assessment.json` after routing is confirmed.

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
> **Skill:** `.agent/skills/watchmen-skill/SKILL.md`

When routing to `/create-skill` or `/enhance-skill`, the following policy applies:

1. **For new capabilities** (`/create-skill`): The forge phase (Step W-03) MUST classify all gates as Category A (Deterministic) or Category B (Trust-Based). The validate phase (Step W-04) MUST run `validate-skill-gates.py --assess-injection` to measure Enforcement Maturity (must be ≥ 30%) and Watchmen Injection Score (WIS). Capabilities with WIS ≥ 6 MUST implement Layer 1 Firewall integration (e.g. `chmod 444`).

2. **For existing capabilities** (`/enhance-skill`): The upgrade phase (Step E-03) MUST audit existing gates via `validate-skill-gates.py` and propose hardening if Enforcement Maturity < 20% or if WIS ≥ 6 but lacks Firewall integration.

3. **For Gray Zone routing** (SOI 30-75%): When the AI council evaluates whether to create or enhance, they MUST also assess the Enforcement Maturity and WIS of any overlapping skill. Low maturity (< 30%) is an additional argument for enhancement (hardening the existing skill) rather than creating a new one.

4. **Session Compliance Auditor (Mode 3):**
   - After a capability finishes execution in any session, the system evaluates compliance via `.agent/scripts/session-compliance-auditor.py`. This script parses `transcript.jsonl` to verify all Category A gates were actually executed.
   - If the Session Compliance Score (SCS) < 70%, the orchestrator will recommend invoking `/skill` to harden the capability.

5. **Enforcement Maturity Classification:**
   - **High Maturity (>70% Category A):** Skill has strong deterministic verification
   - **Medium Maturity (30-70% Category A):** Acceptable, monitor for improvement opportunities
   - **Low Maturity (<30% Category A):** Flag for hardening — skill may be "paper-only"
   - **Zero Maturity (0% Category A):** CRITICAL — skill has no machine-verified gates, all checks are trust-based and subject to fabrication

## 6. Zero-Trust Watchmen Enforcement

> **Reference:** `implementation_plan.md` (Watchmen v4.0)

When routing to `/create-skill` or `/enhance-skill` for any capability that involves creating or modifying **Zero-Trust Category A scripts** (e.g. scripts inside `.agent/scripts/` used for validation or enforcement):

1. **Mandatory Injection:** The downstream workflow MUST structurally inject the following lines at the absolute top of the Python script:
   ```python
   import watchmen_core
   watchmen_core.verify_execution(__file__)
   ```
2. **Signature Registration:** The workflow MUST remind the Admin to run `watchmen_signer.py` (or execute it if permissions allow) to register the script's hash into `.agent/config/scripts-lock.sig`.
3. **Automated Compliance Check:** Before finalizing the skill creation/enhancement, the agent MUST run the compliance detector:
   ```bash
   python3 .agent/scripts/validate-watchmen-compliance.py --script <path_to_new_script>
   ```
   If this check fails, the workflow is BLOCKED and the agent must fix the script before ending the turn.
