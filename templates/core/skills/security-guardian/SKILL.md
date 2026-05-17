---
name: security-guardian
description: The obligatory Phase 0 security checkpoint for the Repo Absorption Protocol. Analyzes remote and local context across 4 layers (Trust Signal, Secret Scan, Dependency Audit, Behavioral Analysis) to determine if a repository is safe to absorb.
---

# 🛡️ Security Guardian (Phase 0)

## 📌 OVERVIEW & AGENT INSTRUCTIONS
This skill acts as the mandatory 4-layer security gate before any external open-source repository can be fully integrated or analyzed by the BMAD ecosystem. You are the **Security Guardian**. Your job is to strictly enforce these checks and generate a comprehensive security report.

You MUST execute the 4 layers in order. If any layer triggers a `BLOCK` or `WARNING`, you MUST halt and request explicit User approval before proceeding to the next layer or completing the phase.

### Target Sandbox
Always clone the target repository to: `${BMAD_HOME}/sandbox/{repo-name}`
Use `BMAD_HOME=${BMAD_HOME:-~/.bmad-dragonball}` when the environment variable is not already set.
*(If the directory does not exist, create it. This isolates the repo from the main BMAD project).*

---

## 🛠️ THE 4-LAYER ASSESSMENT PIPELINE

### Layer 1: Trust Signal (Remote Check)
Execute this BEFORE cloning the repository to save compute and avoid immediate risks.
1. Use the **GitHub MCP API** to fetch the repository metadata.
2. Evaluate the following criteria:
   - **Stars:** > 100
   - **Forks:** > 10
   - **Contributors:** > 2
   - **Last Commit Date:** Within the last 1 year (stale > 1 year = fail)
   - **License:** Must exist and be a recognized open-source license (no license = fail)
   - **Organization/Author:** Check if verified or well-known
   - **README:** Must exist and be > 500 characters
3. **Calculate Trust Score:**
   - `HIGH`: Meets ≥ 3 criteria (Pass)
   - `MEDIUM`: Meets exactly 2 criteria (Pass)
   - `LOW`: Meets ≤ 1 criteria -> **WARNING**
4. **Error Handling:** If GitHub API limits are reached or authentication fails, gracefully degrade by asking the User to manually input the trust score or override the L1 check.
5. **Gate:** If `LOW` trust or error fallback, display WARNING and wait for User confirmation to proceed to clone.

### Layer 2: Secret Scan (Local Check)
Execute this AFTER cloning the repository to the sandbox.
1. Check if `gitleaks` is installed (`which gitleaks`). If not, instruct the user to run `brew install gitleaks` (or equivalent) and wait.
2. Run the Gitleaks scan:
   ```bash
   gitleaks detect --source ${BMAD_HOME}/sandbox/{repo-name} --report-format json --report-path ${BMAD_HOME}/absorbed-repos/{repo-name}/gitleaks.json
   ```
3. Parse the output JSON to extract: `rule`, `secret` (MUST MASK IT before displaying), `file`, and `line number`.
4. **Gate:** If ANY secrets are found -> **BLOCK**. Display a detailed findings table and WAIT for User acknowledgement to proceed.

### Layer 3: Dependency Audit (Local Check)
Check for known vulnerabilities (CVEs) in the dependency tree.
1. Detect package manager manifests in the repo root:
   - If `package-lock.json` exists -> run `npm audit --json`
   - If `requirements.txt` exists -> run `pip audit --format json` (if available)
   - If `go.mod` exists -> run `govulncheck ./...`
   - If `Cargo.toml` exists -> run `cargo audit`
2. Parse the results to extract: `package name`, `severity`, `CVE ID`, and `description`.
3. **Gate:** 
   - If **Critical/High** vulnerabilities are found -> **WARNING**. Show CVE table and WAIT for User decision.
   - If only Moderate/Low -> LOG only, auto-proceed.

### Layer 4: Behavioral Analysis (Local Check)
Use grep or AST scanning tools to detect suspicious code patterns.
1. Scan the codebase for the following heuristic patterns:
   - **Install script abuse:** `"postinstall": ".*curl.*|.*wget.*|.*eval.*"` (in `package.json`)
   - **Obfuscated code:** `eval(atob(...)`, `Buffer.from(..., 'base64')`
   - **Crypto mining indicators:** `stratum+tcp://`, `CryptoNight`
   - **Data exfiltration:** Look for `process.env` immediately followed by `fetch/axios/http.request` in the same file. Also look for `fs.readFile('/etc/passwd')` or similar credential targeting.
   - **Dynamic code execution:** `new Function(...)`, `require(variable)` (non-literal requires).
2. For each match, document the: `pattern type`, `file path`, `line number`, and `code snippet`.
3. **Gate:** If ANY matches are found -> **BLOCK**. Show the evidence with file paths and WAIT for explicit User approval.

---

## 📝 OUTPUT: SECURITY REPORT
Upon completion of all 4 layers (or if forced to stop), generate a structured markdown report.

**File Path:** `${BMAD_HOME}/absorbed-repos/{repo-name}/security-report.md`

**Format:**
```markdown
# 🛡️ Repo Security Guardian Report: {repo-name}
**Date:** {timestamp}
**Target URL:** {repo-url}
**Final Verdict:** [PASS | WARNING | BLOCK | WARNING_OVERRIDDEN]

## Layer 1: Trust Signal (Remote)
- Score: {HIGH|MEDIUM|LOW}
- Criteria matched: {list of passed criteria}
- Notes: {errors or warnings}

## Layer 2: Secret Scan (Gitleaks)
- Status: [CLEAN | SECRETS_FOUND]
- Findings:
  | Rule | Masked Secret | File | Line |
  |---|---|---|---|

## Layer 3: Dependency Audit
- Status: [CLEAN | VULNERABLE]
- High/Critical CVEs:
  | Package | Severity | CVE | Description |
  |---|---|---|---|

## Layer 4: Behavioral Analysis
- Status: [CLEAN | SUSPICIOUS_PATTERNS_DETECTED]
- Evidence:
  | Pattern Type | File | Line | Snippet |
  |---|---|---|---|

## Audit Trail
- User Overrides: {Log of timestamps and user commands authorizing override of WARNING/BLOCK states}
```

### User Override Mechanism
If you reach a WARNING or BLOCK state, you MUST STOP and explicitly ask the User. 
If the User explicitly replies to confirm or override the state, log the decision with a timestamp in the Audit Trail, change the current phase status to `WARNING_OVERRIDDEN`, and proceed to the next step.
