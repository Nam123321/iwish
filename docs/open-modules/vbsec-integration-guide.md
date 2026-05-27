# Adoption Review Pack: vbsec Integration Guide

This guide details the integration strategy for absorbing `vbsec` security rules and L1-L4 reasoning logic into the I-Wish ecosystem.

---

## 1. Classification & Placement
*   **Shape:** Skill Attachment (Generic & Language Specific Rules).
*   **Role:** Supportive (Security Auditing & Taint Analysis).
*   **Framework Placement:** Core validation pipelines (`review-agent`, `qa-agent`).
*   **Routing Command:** Triggered under `/security-guardian-patch` and standard PR reviews.

---

## 2. Core Use Cases
*   **AI-Generated Code Verification:** Automatically scan user-facing code modifications for common RCE, XSS, and SQLi vulnerabilities.
*   **False Positive Mitigation:** Use L1-L4 Data Flow taint analysis to filter out safe, statically matched parameters.

---

## 3. Scope & Constraints
*   **No Global Install:** Discard installer and symlinking scripts that write outside the workspace to satisfy directory isolation.
*   **Deduplication Required:** Do not adopt duplicate rule files under Codex/Claude Code platforms. Only adopt unique canonical rules.

---

## 4. Coordination & Routing Hints
*   **Agent Coordination:** `review-agent` utilizes the L1-L4 reasoning steps to analyze potential vulnerabilities. If confirmed, `qa-agent` runs isolated exploit validation tests.
*   **Orch Routing:** When a user initiates a PR or requests `/security-guardian-patch`, route execution to include the newly merged language-specific rules.

---

## 5. Review Questions for the User
1. Do you approve merging these rules directly into `skill-pack-white-hacker` (Lựa chọn khuyến nghị: SYSTEM_SKILL)?
2. Do you want to keep the Go/PHP specializations active immediately, or review their rules individually first?
