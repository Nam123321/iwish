# Zero-Trust Capability Standard

> **Purpose:** Enforce a "Policy-in-Code" standard for all High-Stakes capabilities generated or enhanced by I-Wish agents.

## 1. Classification (Tier 1 vs Tier 2)

Before designing a capability, classify its risk:
- **Tier 1 (High-Stakes / Physical Execution):** Skills that interact with the file system, network, database, deployment, or run automated tests. 
  - *Requirement:* MUST strictly adhere to the Zero-Trust Architecture. Requires both a Markdown `SKILL.md` and a physical Python script (`runner.py`).
- **Tier 2 (Cognitive / Prompt-Only):** Skills that only format text, synthesize ideas, or evaluate architecture.
  - *Requirement:* Can be pure Markdown. Does not require a runner script.

## 2. Separation of Concerns (Tier 1 Skills)

If a Skill is Tier 1, it MUST split responsibility:
- **The Markdown (`SKILL.md`):** Acts as the API Contract. It documents WHEN to use the skill and provides the exact bash command to run the Python script. The Markdown MUST explicitly forbid the agent from running raw bash commands (e.g., `npx playwright` or `sed`) directly.
- **The Script (`runner.py`):** Acts as the Execution Core. It handles all deterministic, mechanical execution (linting, compiling, test running) safely.

## 3. The Core SDK Mandate

Agents MUST NOT generate massive, boilerplate Python scripts from scratch for Tier 1 Skills.
Instead, they MUST import and use the I-Wish Core SDK (`.agent/scripts/iwish_runner_core.py`).

**Example implementation for a generated skill script:**
```python
import argparse
import sys
import os
# Ensure .agent/scripts is in PYTHONPATH if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../.agent/scripts')))
from iwish_runner_core import ZeroTrustRunner

def my_validation_logic(target_file):
    # Agent writes specific business logic here
    if not os.path.exists(target_file):
        return {"status": "FAIL", "error": f"File {target_file} not found. element timeout."}
    return {"status": "PASS"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    
    runner = ZeroTrustRunner(name="my_skill", validator_func=lambda: my_validation_logic(args.file))
    runner.execute()
```

## 4. Pipeline Requirements
When authoring a Tier 1 Skill via `/create-skill`:
- **Research:** Industry Standards MUST be reviewed (via `step-w-02a-research`) to avoid reinventing the wheel.
- **Risk Analysis:** An FMEA scan via `/edge-case-guardian` MUST be conducted (via `step-w-02b-edge-case`) to identify Type 1 vs Type 2 failures. Output of this scan informs the `classify_failure` overrides in the generated script.
