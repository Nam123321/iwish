# Integration Guide: strix

This integration guide defines the adoption review pack for the absorbed `strix` security validation skill pack.

---

## 1. What is it
*   **Name:** `strix`
*   **Source:** [usestrix/strix](https://github.com/usestrix/strix)
*   **Current Registration State:** `absorbed` (pending trigger registration)
*   **Shape Classification:** `skill-pack`
*   **Role Classification:** `security-validation`

---

## 2. Why it exists
*   **Job it Solves:** Automates the structured discovery, verification, and validation of application security vulnerabilities (OWASP Top 10) by providing high-quality checklists, vulnerability methodologies, and tool invocation guidelines.
*   **Why I-Wish Wants It:** It equips the I-Wish ecosystem with specialized security intelligence to execute automated security audits, run mock exploit checks (PoC), and verify security patches.
*   **Gap it Fills:** Currently, I-Wish lacks dedicated, structured testing guidelines and checklists for web application vulnerabilities (like IDOR, SQLi, SSRF, and JWT flaws).

---

## 3. Delivery Framework Placement
*   **Phase:** `validate` (primary focus), `solution` (reviewing threat models), and `operate-learn` (production telemetry validation).
*   **Stage:** `intent-triage` (for classifying security-related requests) and `orchestration` (for spawning testing subagents).
*   **Placement Type:** `supportive` (assists `dev-agent` and `qa-agent` during code reviews and testing).

---

## 4. Input -> Process -> Output
*   **Expected Inputs:**
    *   `target_url` (for dynamic scanning)
    *   `local_code_path` (for static/whitebox audits)
    *   `vulnerability_type` (e.g., `sqli`, `idor`, `jwt`)
*   **Process Flow:**
    1.  The orchestrator identifies a security task.
    2.  The target skill checklist (e.g., `idor.md`) is dynamically loaded into the agent's context.
    3.  The agent runs static checks (semgrep, grep) or dynamic probes (curl, python scripts) against the codebase/target following the methodology.
*   **Expected Outputs:**
    *   `vulnerability_report` (detailing findings, evidence, and CVSS severity)
    *   `poc_exploit` (proof-of-concept payload or execution steps)
    *   `remediation_patch` (recommended code fixes)

---

## 5. Use Cases
*   **Core Use Cases:**
    *   Automated pre-deployment API vulnerability scans (checking for IDOR or JWT bypasses).
    *   Vulnerability patch verification (writing a test to prove a security issue is fixed).
    *   SAST result verification (running dynamic checks to filter out semgrep false positives).
*   **Adjacent Use Cases:**
    *   Framework-specific configuration auditing (e.g., verifying Firebase security rules or NestJS CORS setup).
    *   Docker/Kubernetes configuration audits (scanning manifest files for privilege escalation).
*   **Do-Not-Use Cases:**
    *   General code refactoring or styling.
    *   Unsanctioned scanning of external hostnames or third-party APIs outside the verified target scope.

---

## 6. Edge Cases / Stress Cases / Constraints
*   **Edge Cases:**
    *   **WAF Interference:** Active Web Application Firewalls (WAF) blocking standard testing payloads, resulting in false negatives. Requires switching to obfuscated/advanced payloads.
    *   **Authentication Expiration:** Scanner sessions expiring during multi-step auth checks, requiring automatic token re-issuance.
*   **Stress Cases:**
    *   **Concurrency limits:** Multi-threaded fuzzing (e.g., ffuf sprays) causing target server resource exhaustion or denial-of-service (DoS).
*   **Operational Constraints:**
    *   Must run within isolated runtime containers when executing dynamic scripts.
    *   No dynamic scanning is allowed without verified target verification (`user_instructions` cannot override target scope limits).

---

## 7. Agent / Workflow / Skill Coordination
*   **Primary Agent:** `review-agent` (for SAST/secrets auditing) and `qa-agent` (for writing dynamic validations).
*   **Workflows Called By:** `/code-review` (triggers static scans) and `/security-guardian-patch` (new dedicated workflow).
*   **Supportive Skills:** Pairs well with `canary` deployments (verifying safety during rollouts) and `a11y-debugging` (for web structure).

---

## 8. Orch Routing Hints
*   **Trigger Phrases:** `audit security`, `vulnerability scan`, `check SQL injection`, `pentest api`, `validate authentication bypass`, `audit JWT config`.
*   **Anti-Triggers:** `fix spacing`, `deploy static assets`, `refactor layout`.
*   **Routing Stage:** `validate`.
*   **Proposal Mode:** Propose automatically on pull requests touching authentication code or changing external routing configurations.

---

## 9. Review Questions for the User
1.  **Authorization:** Do you authorize the automated execution of dynamic security validation checks against local development servers during the `/code-review` workflow?
2.  **Safety Boundaries:** Should high-severity exploits (e.g., SSRF or RCE validation scripts) require explicit user approval before execution, or run autonomously in the sandbox?
3.  **Scope Verification:** Do you want to restrict the active scanning target scope to a predefined JSON configuration file, or allow ad-hoc URL overrides in the CLI?

---

## 10. Example Scenarios

### Scenario 1: Pre-commit Security Audit
*   **User Prompt:** `Run a security scan on my NestJS endpoints before I merge this PR.`
*   **Orch Action:** Routes to `review-agent` with `strix/skills/frameworks/nestjs.md` loaded to check CORS, authorization guards, and query parameters.

### Scenario 2: IDOR Verification
*   **User Prompt:** `Verify if our database fetching functions are vulnerable to IDOR.`
*   **Orch Action:** Routes to `qa-agent` with `strix/skills/vulnerabilities/idor.md` loaded to analyze if user session IDs are matched against retrieved record ownership.
