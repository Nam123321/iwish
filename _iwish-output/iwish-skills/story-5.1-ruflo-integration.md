# Story 5.1: Compliance Self-Check Gates (Security & Magic Numbers Scan)

**Epic:** Epic 5: Compliance Self-Check Refinement
**Story Title:** Tích hợp Cổng quét Tự động (Security & Magic Numbers Scan)
**Goal:** Add automated security scanning gates into I-Wish's self-check workflow step. Integrate secret detection (gitleaks-style) and magic number detection to block stories from being marked DONE if security issues exist.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story implements the compliance scanning slice:
1. **Secret Detection Layer**: Regex-based scanning for API keys, tokens, passwords, private keys, AWS credentials, and JWTs.
2. **Magic Number Detection Layer**: Identifies hardcoded ports, IPs, URLs with credentials, and suspicious numeric literals.
3. **Gate Decision Layer**: Evaluates scan results and determines whether a story may transition to DONE status.
4. **CLI Layer**: Exposes scanning capabilities via a command-line interface for integration into workflows.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a set of file paths, **When** `scanSecrets()` is invoked, **Then** it detects API keys (sk-, pk-, api_key, token, secret, password), AWS access keys (AKIA...), private key markers (BEGIN RSA/EC/DSA/OPENSSH PRIVATE KEY), and JWT tokens (eyJ...) — returning structured findings with file, line, severity, and description.
- **AC2:** **Given** a set of file paths, **When** `scanMagicNumbers()` is invoked, **Then** it detects hardcoded port numbers (excluding 80, 443, 3000, 8080), hardcoded IP addresses, URLs with embedded credentials, and numeric literals > 100 in business logic — flagging them for review.
- **AC3:** **Given** a scan report from `runFullScan()`, **When** `shouldBlockDone()` evaluates it, **Then** it returns `true` if any finding has severity `critical`, preventing the story status transition to DONE.
- **AC4:** **[EDGE-CASE]** **Given** file paths that include non-existent files, **When** scanning, **Then** the scanner logs a warning and continues scanning remaining files without throwing.
- **AC5:** **[EDGE-CASE]** **Given** file paths that include binary or empty files, **When** scanning, **Then** the scanner gracefully skips them without false positives.
- **AC6:** **[EDGE-CASE]** **Given** a file containing secret-like patterns inside comments or test fixtures, **When** scanning, **Then** the scanner still flags them (defense-in-depth — no false negative policy).

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 6 (≤ 8) → 0
2. **Data Model Spread:** 1 (Finding object shape) → 0
3. **UI Surface:** 0 (CLI only) → 0
4. **Cross-Domain:** 0 (Pure Node.js) → 0
5. **Flow Complexity:** 2 (Regex matching + severity classification + gate logic) → 0
6. **Test Burden:** 3 (Multiple secret patterns, magic number edge cases, gate logic) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Secret detection | Task 1: Implement `scanSecrets(filePaths)` with regex patterns for API keys, AWS keys, private keys, JWTs | ✅ Mapped |
| AC2 | Magic number detection | Task 2: Implement `scanMagicNumbers(filePaths)` for ports, IPs, credential URLs, numeric literals | ✅ Mapped |
| AC3 | Gate decision | Task 3: Implement `runFullScan()` combining both scans and `shouldBlockDone()` evaluating critical severity | ✅ Mapped |
| AC4 | Missing files | Task 4: Add file existence check with warning in scan methods | ✅ Mapped |
| AC5 | Binary/empty files | Task 4: Add binary/empty file detection and graceful skip | ✅ Mapped |
| AC6 | Comments/test fixtures | Task 1-2: No exclusion logic — all pattern matches are flagged (defense-in-depth) | ✅ Mapped |

---

## 🧪 5. Test Plan
- **Test 1:** `scanSecrets` detects API key patterns (`api_key = "sk-abc123..."`)
- **Test 2:** `scanSecrets` detects AWS access key patterns (`AKIA1234567890ABCDEF`)
- **Test 3:** `scanSecrets` detects private key markers (`-----BEGIN RSA PRIVATE KEY-----`)
- **Test 4:** `scanSecrets` detects JWT tokens (`eyJhbGci...eyJzdWIi...`)
- **Test 5:** `scanMagicNumbers` detects hardcoded port numbers (e.g., port 5432)
- **Test 6:** `scanMagicNumbers` allows common ports (80, 443, 3000, 8080)
- **Test 7:** `scanMagicNumbers` detects hardcoded IP addresses
- **Test 8:** `scanMagicNumbers` detects URLs with embedded credentials
- **Test 9:** `scanMagicNumbers` detects large numeric literals > 100
- **Test 10:** `runFullScan` returns combined findings from both scanners
- **Test 11:** `shouldBlockDone` returns `true` when critical findings exist
- **Test 12:** `shouldBlockDone` returns `false` when only warnings/info exist
- **Test 13:** Scanner handles non-existent files gracefully
- **Test 14:** Scanner handles empty files gracefully

---

## 💬 6. Socratic Review Synthesis Summary
- **Defense-in-Depth:** The scanner intentionally flags patterns in comments and test fixtures. It is cheaper to dismiss a false positive than to miss a real secret leak.
- **Severity Triage:** `critical` = secrets (API keys, AWS keys, private keys, JWTs); `warning` = credential URLs, unusual ports; `info` = large numeric literals (review-only).
- **No External Dependencies:** All detection uses Node.js built-in `fs` and regex — no gitleaks binary required. This keeps the scanner portable and CI-friendly.
- **Gate Semantics:** Only `critical` severity blocks DONE transition. Warnings and info findings are surfaced for human review but do not block.

---

## 🛡️ 7. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9.5 | Comprehensive regex coverage for common secret patterns with structured output. |
| Data Integrity & State | 10 | Read-only scanner — no file mutations or side effects. |
| Security & Validation | 9.5 | Defense-in-depth approach; no false-negative policy for comments/fixtures. |
| Performance & Scalability | 9.0 | Line-by-line scanning is O(n) per file; adequate for project-scale codebases. |
| Error Handling & Recovery | 9.5 | Graceful skip for missing/binary/empty files with warnings logged. |
| Architectural Depth & Leverage | 9.0 | Clean API surface enables integration into any workflow step or CI pipeline. |
| UX Empathy | 9.5 | Structured findings with file/line/description enable one-click navigation to issues. |

**TOTAL AVERAGE: 9.43/10 (PASS)**

---

**Status:** `DONE`
