---
name: security-guardian-patch
description: Dedicated security validation workflow that runs static scans
  (semgrep/gitleaks) and dynamic PoC tests in a sandbox, then handles automated
  patching.
---

# 🛡️ `/security-guardian-patch` Security Validation & Patching Workflow

## 📌 OVERVIEW
This workflow implements an automated security auditing, verification, and remediation cycle in an isolated sandbox. It orchestrates a multi-agent routing loop between `review-agent` (auditing), `qa-agent` (exploit validation), and `dev-agent` (patching).

**Usage:** `/security-guardian-patch <target-directory-or-repo>`

---

## 🚦 INITIALIZATION & ENVIRONMENT DETECTION

The system must dynamically detect the execution environment using `PLATFORM_MODE` to choose between native sandbox execution and Docker containerization fallback:

```bash
# Check platform mode
if [ "${PLATFORM_MODE}" = "AG_MAO" ]; then
    echo "[INFO] Running on Google Antigravity (AG_MAO). Utilizing native sandboxed CLI execution."
    export USE_DOCKER_SANDBOX=false
else
    echo "[INFO] Running in standard workspace. Falling back to Docker-based sandbox execution."
    export USE_DOCKER_SANDBOX=true
fi
```

---

## 🛠️ THE 4-PHASE ORCHESTRATION PIPELINE

### Phase 1: Security Audit & Scan 🔍 (Agent: `review-agent`)
1. **Static Analysis:**
   - Under `USE_DOCKER_SANDBOX=false`: Execute `semgrep` and `gitleaks` directly in the native sandbox.
   - Under `USE_DOCKER_SANDBOX=true`: Spin up a lightweight Docker container, mount the repository, and run:
     ```bash
     docker run --rm -v $(pwd):/src returntocorp/semgrep semgrep scan --config=auto /src
     docker run --rm -v $(pwd):/src zricethezav/gitleaks:latest detect --source=/src --verbose
     ```
2. **Collect Vulnerability Candidates:** Log all findings in a temporary audit report: `${IWISH_HOME:-~/.iwish}/sandbox/audit-findings.json`.

---

### Phase 2: Sandbox Exploit Verification 🧪 (Agent: `qa-agent`)
1. For each high/critical vulnerability candidate, the `qa-agent` generates or loads a Proof-of-Concept (PoC) exploit script (e.g., `poc_exploit.py` or `test-exploit.js`).
2. Run the PoC script inside the selected sandbox environment.
3. **Exploit Decision Gate:**
   - **Vulnerability Confirmed (Exploit Reproducible):**
     - **Then:** Mark vulnerability as `CONFIRMED`.
     - **Route to:** Phase 3 (Automated Patching & Re-Verification).
   - **Vulnerability Refuted (Exploit Non-Reproducible / False Positive):**
     - **Then:** Mark vulnerability as `FALSE-POSITIVE`.
     - **Action:** Report the false positive, log the justification, and skip Phase 3. Proceed directly to Phase 4.

---

### Phase 3: Automated Patching & Re-Verification 🩹 (Agent: `dev-agent`)
1. **Patch Generation:** Route the confirmed vulnerability metadata and the PoC script to `dev-agent`.
2. **Implementation:** `dev-agent` designs and applies code fixes directly targeting the root cause.
3. **Compiler Gate:** Compile the project to ensure no syntax/type regressions:
   ```bash
   npm run build
   ```
4. **Verification:** Re-run the PoC script in the sandbox:
   - If the PoC exploit now fails to run or report success (i.e. the vulnerability is mitigated), the patch is verified.
   - If the PoC exploit still succeeds, return to step 1 of Phase 3 (maximum 3 attempts).

---

### Phase 4: Output Security Validation Report 📝 (Orchestrator)
1. Consolidate findings, exploit logs, and patch results.
2. Write the final report to `_iwish-output/security-reports/security-validation-report.md`.
3. If any patches were applied, run consistency checks:
   ```bash
   node .agent/scripts/check-registry-consistency.js
   ```
4. Write exit diagnostics to `.agent/memory/turn-exits.jsonl`.
