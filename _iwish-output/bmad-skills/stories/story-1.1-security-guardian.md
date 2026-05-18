---
story_id: "STORY-RAP-1.1"
epic_id: "EPIC-RAP-01"
title: "Security Guardian Skill — 4-Layer Repo Trust Assessment"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: []
phase: "forge"

---
# Story RAP-1.1: Security Guardian Skill

## 1. Mục tiêu (Objective)

Tạo skill `security-guardian` — một "cổng bảo vệ" bắt buộc chạy **trước** mọi phân tích repo. Skill này đánh giá 4 tầng an toàn: Trust Signal (remote), Secret Scan (Gitleaks), Dependency Audit (npm/pip audit), và Behavioral Analysis (suspicious patterns). Kết quả quyết định repo có đủ an toàn để absorb hay không.

**User Value:** Ngăn chặn việc clone và tích hợp repos chứa mã độc, secrets bị lộ, hoặc dependencies có lỗ hổng bảo mật đã biết vào hệ sinh thái I-Wish.

---

## 2. Target Users & Personas

- **Whis (Capability Manager):** Invoke Security Guardian khi chạy `/absorb-repo` workflow, nhận report và quyết định proceed/abort.
- **Hit (Edge Case Guardian):** Review kết quả scan, đặc biệt L4 behavioral analysis findings.
- **User (Human):** Nhận security report, confirm/reject tại các WARNING gates.

---

## 3. Scope & Phạm vi Triển khai

### 3.1 Tạo file mới

| File | Path | Mô tả |
|------|------|--------|
| `SKILL.md` | `.agent/skills/security-guardian/SKILL.md` | Core skill definition |

### 3.2 4-Layer Security Architecture

#### Layer 1: Trust Signal (Remote — trước khi clone)
- **Input:** Repo URL
- **Check via GitHub MCP API:**
  - Stars count, forks count, open issues
  - Number of contributors
  - Last commit date (stale > 1 year = warning)
  - License type (no license = warning)
  - Organization verified status
  - README quality (exists, length > 500 chars)
- **Output:** Trust Score: `HIGH` (≥3 criteria pass) | `MEDIUM` (2) | `LOW` (≤1)
- **Gate:** LOW trust → WARNING → user must confirm to proceed

#### Layer 2: Secret Scan (Local — sau khi clone)
- **Tool:** Gitleaks CLI
- **Command:**
  ```bash
  gitleaks detect --source ${IWISH_HOME}/sandbox/{repo-name} \
    --report-format json \
    --report-path ${IWISH_HOME}/sandbox/{repo-name}-gitleaks.json
  ```
- **Check:** API keys, tokens, passwords, private keys trong source code
- **Gate:** Findings > 0 → BLOCK → show findings → user must explicitly acknowledge risks

#### Layer 3: Dependency Audit (Local — sau khi clone)
- **Tools (conditional):**
  - `package.json` exists → `npm audit --json`
  - `requirements.txt` exists → `pip audit --format json` (nếu có pip-audit)
  - `go.mod` exists → `govulncheck ./...`
  - `Cargo.toml` exists → `cargo audit`
- **Check:** Known CVEs trong dependency tree
- **Gate:**
  - Critical/High severity → WARNING → show CVEs → user decide
  - Moderate/Low → LOG only → auto-proceed

#### Layer 4: Behavioral Analysis (Local — pattern matching)
- **Method:** Grep/AST scan for suspicious patterns
- **Patterns to detect:**
  ```
  # Install script abuse
  "postinstall": ".*curl.*|.*wget.*|.*eval.*"
  
  # Obfuscated code
  eval(atob(...)
  Buffer.from(..., 'base64')
  
  # Crypto mining indicators
  stratum+tcp://
  CryptoNight
  
  # Data exfiltration
  process.env → fetch/axios/http.request (in same file)
  fs.readFile('/etc/passwd')
  
  # Dynamic code execution
  new Function(...)
  require(variable) (non-literal requires)
  ```
- **Gate:** Pattern matches > 0 → BLOCK → show evidence with file paths → user must approve

---

## 4. Acceptance Criteria

### AC1: L1 Trust Signal via GitHub MCP
- **GIVEN** A repo URL is provided to the Security Guardian.
- **WHEN** Phase 0 begins.
- **THEN** The skill MUST query GitHub MCP API for: stars, forks, contributors count, last commit date, license.
- **AND** Calculate Trust Score based on defined criteria.
- **AND** If GitHub API limits are reached or authentication fails → gracefully degrade by asking the user to manually input the trust score or override the L1 check.
- **AND** If Trust Score = LOW → display WARNING with details → WAIT for user confirmation.

### AC2: L2 Gitleaks Integration
- **GIVEN** The repo has been cloned to sandbox.
- **WHEN** L2 scan executes.
- **THEN** The skill MUST run `gitleaks detect` against the local clone.
- **AND** Parse JSON output to extract: rule, secret (masked), file, line number.
- **AND** If any secrets found → BLOCK with detailed findings table → WAIT for user acknowledgement.

### AC3: L3 Dependency Audit (Multi-ecosystem)
- **GIVEN** The repo clone contains dependency manifest files.
- **WHEN** L3 scan executes.
- **THEN** The skill MUST detect the package manager type and run appropriate audit tool.
- **AND** Parse results to extract: package name, severity, CVE ID, description.
- **AND** If Critical/High found → WARNING with CVE table → WAIT for user decision.

### AC4: L4 Behavioral Pattern Matching
- **GIVEN** The repo clone is available locally.
- **WHEN** L4 scan executes.
- **THEN** The skill MUST grep/scan for all defined suspicious patterns.
- **AND** For each match → report: pattern type, file path, line number, code snippet.
- **AND** If matches found → BLOCK with evidence → WAIT for user approval.

### AC5: Security Report Output
- **GIVEN** All 4 layers have completed.
- **THEN** The skill MUST generate a structured security report containing:
  - Overall verdict: `PASS` | `WARNING` | `BLOCK`
  - Per-layer results with details
  - Timestamp and repo metadata
- **AND** Save report to `${IWISH_HOME}/sandbox/{repo-name}-security-report.md`

### AC6: User Override Mechanism
- **GIVEN** A WARNING or BLOCK verdict.
- **WHEN** User explicitly confirms to proceed.
- **THEN** The skill MUST log the override decision with timestamp.
- **AND** Proceed to next phase with security status = `WARNING_OVERRIDDEN`.

---

## 5. Technical Constraints & Design Considerations

- **Gitleaks phải được install trước:** `brew install gitleaks` (macOS). Skill phải check `which gitleaks` và hướng dẫn install nếu chưa có.
- **npm audit** chỉ chạy nếu có `package-lock.json` (không chỉ `package.json`).
- **L4 patterns** là heuristic-based — có thể false positive. Luôn show context để user judge.
- **Sandbox path:** `${IWISH_HOME}/sandbox/` — tạo nếu chưa tồn tại, không ảnh hưởng project chính.
- **Repomix Secretlint:** Repomix có built-in Secretlint — có thể dùng bổ sung cho L2 nhưng KHÔNG thay thế Gitleaks (Gitleaks check git history, Secretlint chỉ check current files).

---

## 6. Definition of Done (DoD)

- [x] File `.agent/skills/security-guardian/SKILL.md` đã tạo với đầy đủ 4-Layer specification.
- [x] L1 Trust Signal chạy được qua GitHub MCP tools (verify với 1 real repo).
- [x] L2 Gitleaks scan chạy được trên local clone (verify với gstack repo).
- [x] L3 npm audit chạy được khi có `package-lock.json` (verify với repo có known CVE).
- [x] L4 Behavioral patterns detect được suspicious patterns trong test file.
- [x] Security report output format đúng spec.
- [x] User override flow hoạt động cho cả WARNING và BLOCK.

---

## ⚖️ QA SIMULATION GATE (Round 2/3)
**Domain:** 11 (Automation/Workflow) | **UX relevance:** 4/5 - REQUIRED

### Scorecard (The 6 Core Axes)
| # | Axis | Score | Brief Note |
|---|------|-------|------------|
| 1 | Completeness | 9.5/10 | Covers all 4 security layers and explicitly defines checks and output format. Error handling gracefully degrades. |
| 2 | Clarity | 9.0/10 | GIVEN/WHEN/THEN format makes acceptance criteria unmistakable. |
| 3 | Edge Cases (8-Pillars) | 9.5/10 | Handles absent dependencies (no lockfile), user overrides, false positives in heuristics, and API rate limits. |
| 4 | Efficiency | 9.0/10 | L1 remote check prevents expensive downloads. Fast tools (gitleaks) chosen. |
| 5 | Scalability | 9.0/10 | Generalizes across Node, Python, Go, and Rust. |
| 6 | Output Quality | 9.0/10 | Directly actionable by the developer agent (Vegeta). |
| 7 | REAL-USER Empathy | 9.5/10 | Gracefully falls back on errors instead of blocking the user unexpectedly. |

**TOTAL AVERAGE: 9.2 / 10**

### 🔄 Delta Tracker (Guardrail Enforcement)
| Metric | Value |
|--------|-------|
| Previous Round Score | 8.9 |
| Current Round Score | 9.2 |
| **Delta** | **+0.3** |
| Delta Lock Triggered? | No: Continue |

### 🔴 Bugs & Gaps
*No significant bugs or gaps identified. Story is ready for implementation.*

### 💡 Verdict
- PASS
