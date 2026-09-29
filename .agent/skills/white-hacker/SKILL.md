---
name: white-hacker
description: Trigger this skill when needing to evaluate security vulnerabilities, parse infrastructure configurations for WAF, rate limiting, or origin IP lockdown, or execute SAST and dynamic security toolings.
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# 🕵️‍♂️ White-Hacker Security Validation Skill Pack

## 📌 Overview
This skill pack provides the I-Wish ecosystem with specialized security validation checklists, vulnerability testing playbooks, and security tool usage guidelines (OWASP Top 10, Cloud, Protocols, and Toolings).

It contains the following resources:
- **Vulnerability Testing Playbooks** (`vulnerabilities/`): CSRF, IDOR, RCE, SSRF, SQL Injection, JWT, NoSQL Injection, and more.
- **Security Tool Playbooks** (`tooling/`): Nmap, Nuclei, Katana, Ffuf, Naabu, Httpx, Semgrep, Sqlmap, Subfinder.
- **Infrastructure Audits** (`infrastructure/`): Evaluates WAF configuration, rate limiting, origin IP lockdown matrices, and infrastructure-as-code parsing.
- **Custom Audits** (`custom/`): Source-Aware SAST Playbook.
- **Framework Audits** (`frameworks/`): FastAPI, NestJS, NextJS.
- **Protocols & Technologies** (`protocols/`, `technologies/`): GraphQL, Supabase, Firebase Firestore.
- **Taint Analysis & Rules** (`rules/generic/`, `rules/languages/`, `references/`): 21 generic vulnerability rules, language overlays (Python, Go, PHP, TS, .NET), and L1-L4 data flow classification.

## 🛠️ Usage
When executing a security validation step, load the corresponding sub-skill file to guide prompt and command construction in the isolated sandbox.

## 🛡️ Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-1 | WAF Rule Evaluation | A (Deterministic) | grep/rg on infrastructure configs | Tool output |
| G-2 | Rate Limiting Matrix Parsing | A (Deterministic) | JSON/YAML parsing script | Script stdout |
| G-3 | Origin IP Lockdown Validation | A (Deterministic) | Network config grep | Raw tool output |
| G-4 | Vulnerability Scenario Execution | B (Trust-Based) | Agent review of execution | Transcript audit |
| G-5 | SAST Audit Review | B (Trust-Based) | Agent manual review of Semgrep | Tool output + prose |

**Enforcement Maturity Ratio**: 60% (3 Category A gates / 5 Total gates)
