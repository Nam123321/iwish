---
name: white-hacker
description: The main entry point and index for the White-Hacker security validation skill pack, which contains playbooks for vulnerability testing, SAST audits, and security toolings.
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
- **Custom Audits** (`custom/`): Source-Aware SAST Playbook.
- **Framework Audits** (`frameworks/`): FastAPI, NestJS, NextJS.
- **Protocols & Technologies** (`protocols/`, `technologies/`): GraphQL, Supabase, Firebase Firestore.
- **Taint Analysis & Rules** (`rules/generic/`, `rules/languages/`, `references/`): 21 generic vulnerability rules, language overlays (Python, Go, PHP, TS, .NET), and L1-L4 data flow classification.

## 🛠️ Usage
When executing a security validation step, load the corresponding sub-skill file to guide prompt and command construction in the isolated sandbox.
