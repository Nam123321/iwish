# ⚔️ `/run-reverse-skill` - Isolated Security Auditor

## 📌 OVERVIEW
This workflow invokes the **Isolated Reverse-Skill Executor**, allowing you to run comprehensive penetration testing, security auditing, and reverse engineering playbooks from the `reverse-skill-pack` plugin.

**Usage:** `/run-reverse-skill [target_url_or_scope]`

## 🚦 PHASE 1: INITIALIZATION
1. Determine the target scope from the user's prompt (e.g., a specific URL, an API endpoint, or an APK file).
2. Invoke the `reverse-skill-executor` skill.

## 🧠 PHASE 2: ROUTING & PLANNING
1. Read `.agent/plugins/reverse-skill-pack/repo/RULES.md` to identify the most appropriate domain module for the user's target (e.g., `pentest-tools`, `apk-reverse`, `blockchain-web3`).
2. Read the `SKILL.md` inside that specific domain module to understand the playbook.
3. Present the intended **Audit Plan** to the user and wait for confirmation before executing active tests.

## 🛡️ PHASE 3: ISOLATED EXECUTION
1. Follow the playbook instructions step-by-step.
2. If the playbook references specific payloads (e.g., XSS vectors in `src-hunter/references/`), retrieve them and apply them to the target.
3. **MANDATORY SANDBOX RULE:** If the playbook requires a tool that is not installed on the system (e.g., `nmap`, `sqlmap`), you MUST STOP and explicitly ask the User for permission to install it. Do NOT execute any `bootstrap-reverse.ps1` or `.sh` script automatically.

## 📝 PHASE 4: REPORTING
1. Synthesize the findings into a structured security report based on the templates provided in `.agent/plugins/reverse-skill-pack/repo/RULES.md`.
2. Ensure no malicious payloads or artifacts leak outside of the conversation context or the designated report file.
