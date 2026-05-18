---
story_id: "STORY-RAP-1.3"
epic_id: "EPIC-RAP-01"
title: "Repo DNA Template — Symlink-Based Standardized Knowledge Artifact"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: []
phase: "forge"

---
# Story RAP-1.3: Repo DNA Template

## 1. Mục tiêu (Objective)

Tạo template chuẩn `repo-dna-template.md` — định dạng output bắt buộc khi absorb bất kỳ repo nào. Template này đảm bảo mọi repo được phân tích đều có cùng format, dễ so sánh, dễ reference, và cover tất cả các khía cạnh cần thiết (từ identity, architecture, core logic, đến security assessment).

**User Value:** Mọi kiến thức từ external repos đều được chuẩn hóa thành "hồ sơ DNA" — agent và user có thể nhanh chóng tra cứu bất kỳ repo nào đã absorb, so sánh giữa các repos, và lấy ra patterns cần tích hợp.

---

## 2. Target Users & Personas

- **Whis (Capability Manager):** Dùng template để generate `repo-dna.md` trong Phase 4 của `/absorb-repo`.
- **Piccolo (Architect):** Review architecture sections, sử dụng module maps khi design integration.
- **Vegeta (Developer):** Reference core logic patterns khi implement integration.
- **King-Kai (PM):** Review "Reusable Patterns for I-Wish" section để inform roadmap.

---

## 3. Scope & Phạm vi Triển khai

### 3.1 Tạo file mới

| File | Path | Mô tả |
|------|------|--------|
| `repo-dna-template.md` | `.agent/templates/repo-dna-template.md` | Standardized output template |

### 3.2 Template Structure (11 Sections)

| # | Section | Purpose | Mandatory |
|---|---------|---------|-----------|
| 1 | **Identity Card** | What is this repo? Purpose, maturity, license, tech stack | ✅ Yes |
| 2 | **Architecture Blueprint** | How is it structured? Pattern, entry points, module map (Tech + Behavioral layers) | ✅ Yes |
| 3 | **Core Logic Patterns** | The "brain" — repeatable patterns with where/what/how/why | ✅ Yes |
| 4 | **State Management** | How data/state flows through the system | ✅ Yes |
| 5 | **Integration Points** | APIs, events, hooks, plugin system | ✅ Yes |
| 6 | **Error Handling & Resilience** | Error patterns, retry logic, fallbacks | ✅ Yes |
| 7 | **Configuration & Environment** | Config files, env vars, feature flags | ✅ Yes |
| 8 | **Dependencies & Trade-offs** | Critical deps, why chosen, trade-offs | ✅ Yes |
| 9 | **Test Strategy** | Test types, coverage, patterns | ⚠️ Flexible |
| 10 | **Reusable Patterns for I-Wish** | Tech + **Behavioral** patterns: prompts, personas, workflows, decision logic | ✅ Yes |
| 11 | **Security Assessment** | Gitleaks, CVEs, behavioral, trust score | ✅ Yes |

> **Note on Section Flexibility:** For repos classified as `prompt-collection` or `workflow-engine`, sections 4/5/6 may be "N/A — Repo classified as [{type}]." This is acceptable. Section 10 MUST always include Behavioral Patterns if they exist.

### 3.3 Template Variables

```
{repo-name}       — Tên repo (e.g., "repomix")
{repo-url}        — GitHub URL
{date}            — Ngày generate
{security-status} — PASS / WARNING / WARNING_OVERRIDDEN
{repo-type}       — agent-framework / ui-library / backend-api / etc.
```

### 3.4 Output Storage Convention (SYMLINK — NÂNG CẤP)

```
# CANONICAL location (persistent, single source of truth)
_iwish-output/repo-dna/{repo-name}-dna.md

# Sandbox location (SYMLINK only, NEVER a copy)
ln -sf $(pwd)/_iwish-output/repo-dna/{repo-name}-dna.md \
       ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md
```

> ⚠️ **CRITICAL:** Tất cả các đường dẫn khác PHẢI là symlink trỏ về file canonical. KHÔNG BAO GIỜ tạo bản copy độc lập — điều này gây Split Brain.

---

## 4. Acceptance Criteria

### AC1: Template File Exists
- **GIVEN** The I-Wish project is set up.
- **WHEN** Any agent or workflow needs to generate a repo-dna.
- **THEN** The template MUST exist at `.agent/templates/repo-dna-template.md`.
- **AND** It MUST contain all 11 sections as defined.

### AC2: Section Completeness Enforcement
- **GIVEN** An agent is filling the template.
- **WHEN** Any section has no applicable content.
- **THEN** The section MUST NOT be left empty.
- **AND** It MUST contain "N/A — {specific reason}" explaining why it's not applicable.

### AC3: Core Logic Pattern Format
- **GIVEN** Section 3 (Core Logic Patterns) is being filled.
- **WHEN** Each pattern is documented.
- **THEN** Each pattern MUST include all 5 fields: **Where** (file paths), **What** (description), **How** (execution flow), **Why** (design decision), **Edge Cases** (error handling).

### AC4: Mermaid Diagram Requirement
- **GIVEN** Section 2 (Architecture Blueprint) is being filled.
- **THEN** It MUST include at least 1 valid Mermaid diagram (module map or data flow).

### AC5: Output Path Convention (SYMLINK — NÂNG CẤP)
- **GIVEN** A `repo-dna.md` is generated.
- **THEN** The CANONICAL file MUST be saved to `_iwish-output/repo-dna/{repo-name}-dna.md`.
- **AND** A SYMLINK (not copy) MUST exist at `${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md`.
- **AND** Running `ls -la ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md` MUST show it points to the canonical file.

### AC6: Behavioral Pattern Inclusion (MỚI)
- **GIVEN** Section 10 (Reusable Patterns for I-Wish) is being filled.
- **WHEN** The repo contains Behavioral Assets (detected in Phase 1.5 INDEX).
- **THEN** Section 10 MUST include a "Behavioral Patterns" subsection documenting:
  - Extracted Prompts/Personas with summary
  - Workflow logic and decision trees
  - Guard Rails and constraints
  - Classification recommendation: `ADOPT` / `MERGE` / `REPLACE` / `SKIP`.

---

## 5. Technical Constraints & Design Considerations

- **Language:** Template content MUST be bilingual-ready (section headers in English, descriptions can be in Vietnamese per `config.yaml` communication_language).
- **Mermaid compatibility:** Diagrams MUST use standard Mermaid syntax supported by GitHub markdown rendering.
- **File naming:** `{repo-name}` MUST be slugified (lowercase, hyphens, no special chars).
- **Size target:** A well-filled repo-dna.md should be 2000-5000 words (comprehensive but not verbose).
- **Section 10 is PRIMARY for integration decisions** — this is what Phase 5 (COMPARE) reads.

---

## 6. Definition of Done (DoD)

- [x] File `.agent/templates/repo-dna-template.md` đã tạo với 11 sections.
- [x] Template variables documentation clear.
- [x] Output directory convention updated to Symlink strategy (`ln -sf`).
- [x] Behavioral Pattern subsection in Section 10 documented.
- [x] Template tested: manually fill cho 1 repo → all sections make sense.
