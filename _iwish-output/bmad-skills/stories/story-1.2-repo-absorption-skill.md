---
story_id: "STORY-RAP-1.2"
epic_id: "EPIC-RAP-01"
title: "Repo Absorption Skill — 5-Phase Deep Learning Engine (Dual-Indexer + Graph-Directed)"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
phase: "forge"

---
# Story RAP-1.2: Repo Absorption Skill (Ingest → Index → Map → Dissect → Document)

## 1. Mục tiêu (Objective)

Tạo skill `repo-absorption` — engine chính thực hiện 5 phases deep learning: **INGEST** (pack repo bằng Repomix), **INDEX** (Dual-Indexer với Hybrid Resolution Algorithm), **MAP** (Graph-Directed architecture mapping), **DISSECT** (Dual-Layer: Tech + Behavioral deep reading), và **DOCUMENT** (tạo `repo-dna.md` với Symlink). Skill này biến một repo "lạ" thành kiến thức có cấu trúc bao gồm CẢ mã nguồn VÀ các hành vi AI (prompts, workflows, personas).

**User Value:** Agent không còn "chỉ có hình dáng mà thiếu bộ não" — mỗi repo được absorb sẽ có một "hồ sơ DNA" ghi lại đầy đủ logic cốt lõi, architecture, design decisions, reusable patterns, VÀ behavioral intelligence (prompts, personas, decision logic) — đảm bảo không bỏ sót "linh hồn" của các AI repos.

---

## 2. Target Users & Personas

- **Whis (Capability Manager):** Execute skill trong `/absorb-repo` workflow để deep-learn repos.
- **Piccolo (Architect):** Review architecture map (Phase 2 output) và validate core logic extraction (Phase 3).
- **Vegeta (Developer):** Consume `repo-dna.md` output khi implement integration/upgrade.

---

## 3. Scope & Phạm vi Triển khai

### 3.1 Tạo file mới

| File | Path | Mô tả |
|------|------|--------|
| `SKILL.md` | `.agent/skills/repo-absorption/SKILL.md` | Core skill definition |

### 3.2 Phase 1: INGEST — Pack repo thành AI-friendly format

**Tool chính:** Repomix (CLI)

**Execution Flow:**
```
Input: Local clone tại ${IWISH_HOME}/sandbox/{repo-name}/
    ↓
Step 1: Detect repo type (check package.json, requirements.txt, go.mod, etc.)
    ↓
Step 2: Generate .repomixignore (nếu chưa có)
    - Ignore: node_modules, dist, build, .next, coverage, *.min.js,
              __pycache__, .venv, vendor, .git, *.lock
    ↓
Step 3: Run Repomix
    npx repomix --output ${IWISH_HOME}/sandbox/{repo-name}-context.md \
      --style markdown \
      ${IWISH_HOME}/sandbox/{repo-name}/
    ↓
Step 4: Validate output
    - File exists
    - File size > 1KB (not empty/broken)
    - File size < 5MB (token limit warning if > 2MB)
    ↓
Output: {repo-name}-context.md
```

**Edge Cases:**
- Monorepo detected (has `packages/`, `apps/`, `workspace`) → ask user which sub-package to target
- Repo > 10MB packed → apply aggressive filtering, keep only `src/` core
- Binary-heavy repo (images, fonts) → exclude via `.repomixignore`

### 3.3 Phase 1.5: INDEX — Dual-Indexer + Hybrid Resolution (MỚI)

**Goal:** Xây dựng Knowledge Graph thống nhất liên kết code VÀ behavioral assets.

**Execution Flow:**
```
Input: Local clone tại ${IWISH_HOME}/sandbox/{repo-name}/
    ↓
Step 1: Tech Graph (CGC)
    - Chạy /analyze-codebase để tạo CodeGraphContext via AST/Tree-sitter
    - Output: Module Boundaries, Entry Points, Hub Nodes, Dependency Edges
    ↓
Step 2: AST-to-Asset Tracing
    - CGC quét AST tìm các lệnh File-System Read (readFile, open, load...)
    - Tạo Edge: [source.ts] -READS-> [prompt.md]
    ↓
Step 3: Hybrid Resolution Algorithm (3 Layers)
    - Layer 1 (Static Tracing): AST link cứng → Nhãn [P0.5 - Linked Behavioral Asset]
    - Layer 2 (Fuzzy Tracing): grep basename → Nhãn [P1.5 - Dynamically Linked Asset]
      * Path-based Heuristics: Chọn file có Directory Distance ngắn nhất nếu trùng tên
    - Layer 3 (Orphan Isolation): Không liên kết → Nhãn [P4 - Orphan Asset]
    ↓
Step 4: Token Overflow Guard
    - Nếu > 50 file behavioral: Giữ P0.5 + P1.5, lọc P4 (chỉ giữ > 500 bytes)
    ↓
Fallback (CGC lỗi): Heuristic Scan
    - tree -L 3, quét package.json scripts, tìm thư mục prompts/agents/workflows/
    - Gắn tất cả .md trong thư mục behavioral → [P0.5]
    ↓
Output: {repo-name}-asset-inventory.md
```

### 3.4 Phase 2: MAP — Graph-Directed Architecture Mapping (NÂNG CẤP)

**Execution Flow:**
```
Input: Knowledge Graph (từ Phase 1.5) + Local clone
    ↓
Nếu CGC thành công (Graph-Directed Mode):
    - Query Graph: Entry Points (high in-degree nodes)
    - Query Graph: Module Boundaries (connected components)
    - Query Graph: Hub Nodes (top 10 connectivity)
    - Compound Detection: ≥ 3 disconnected clusters → Compound Repo
    ↓
Nếu CGC thất bại (Heuristic Mode):
    - Dùng tree output từ Phase 1.5 fallback
    - Entry point ID thủ công
    - Dependency graph từ package.json
    ↓
Cả 2 mode:
    - Behavioral Layer Overlay: Merge Asset Inventory vào architecture map
    - Generate Mermaid diagram (Tech + Behavioral modules, ≥ 3 nodes)
    - Classify repo type: agent-framework | prompt-collection |
      workflow-engine | hybrid-agent | ui-library | backend-api |
      full-stack | monorepo | cli-tool
    ↓
Output: Architecture section of repo-dna.md
```

### 3.5 Phase 3: DISSECT — Dual-Layer Graph-Directed Deep Reading (NÂNG CẤP)

**Dual-Layer Architecture:**

#### Tech Layer (Code Reading)
Nếu CGC available: Đọc theo Hub Node rank (connectivity cao nhất trước).
Nếu CGC unavailable: Đọc theo priority tĩnh:

| Priority | Category | Target Files | Why Read |
|----------|----------|-------------|----------|
| P0 | **Core Logic** | Business rules, algorithms, state machines, resolvers, controllers | The "brain" — what makes this repo unique |
| P1 | **Integration Points** | API routes, event handlers, middleware, plugin hooks | How it connects to outside world |
| P2 | **Configuration** | Config files, env setup, constants, feature flags | Design decisions encoded in config |
| P3 | **Tests** | `*.test.ts`, `*_test.go`, `test_*.py`, `__tests__/` | Expected behavior + edge cases |
| P5 | **Build/Deploy** | Dockerfile, CI/CD, Makefile, scripts/ | Operational context |

#### Behavioral Layer (Prompt & Workflow Extraction — MỚI)
Đọc theo nhãn từ Hybrid Resolution:

| Priority | Category | Action |
|----------|----------|--------|
| P0.5 | **Linked Behavioral Assets** | Đọc TOÀN BỘ — đây là "linh hồn" của repo |
| P1.5 | **Dynamically Linked Assets** | Đọc TOÀN BỘ — có khả năng quan trọng |
| P4 | **Orphan Assets** | Đọc 50 dòng đầu. Bỏ qua nếu là CHANGELOG, LICENSE, CONTRIBUTING |

**Behavioral Extraction Requirements:**
Với mỗi Behavioral Asset, trích xuất:
- **Role/Persona:** Identity của prompt/workflow
- **System Prompt:** Tập lệnh cốt lõi
- **Tool Usage Pattern:** Các tool/API được gọi
- **Workflow Steps:** Logic thực thi tuần tự
- **Decision Logic:** Branching, routing, conditional behavior
- **Guard Rails:** Ràng buộc an toàn, giới hạn

**Reading Strategy per File:**
1. **Small files (< 100 lines):** Read entirely
2. **Medium files (100-500 lines):** Read entirely, extract key patterns
3. **Large files (> 500 lines):** Use `grep_search` to find key symbols first, then read targeted sections
4. **Very large files (> 1000 lines):** MUST NOT read entirely. Structural search only

**Mandatory Anti-Patterns:**
- ❌ KHÔNG đọc `dist/`, `build/`, `.next/`, `.min.js`, compiled output
- ❌ KHÔNG đọc `node_modules/`, `vendor/`, `__pycache__/`
- ❌ KHÔNG đọc binary files, lockfiles (`package-lock.json`, `yarn.lock`)
- ❌ KHÔNG đọc auto-generated files (`*.schema.json`, `*codegen*`, `*.generated.*`)
- ✅ ĐỌC test files — chúng là "documentation by example"
- ✅ ĐỌC `.env.example` — reveal required environment config

**Output:** Core Logic Patterns + Behavioral Patterns sections of `repo-dna.md`

### 3.6 Phase 4: DOCUMENT — Generate `repo-dna.md` (NÂNG CẤP — Symlink)

- Sử dụng template từ `STORY-RAP-1.3` (`repo-dna-template.md`)
- PHẢI address TẤT CẢ 11 sections
- Nếu section không applicable cho loại repo (VD: "Database Schema" cho prompt-only repo), ghi: `N/A — [Lý do]. Repo classified as [{repo-type}].`
- Section 10 (Reusable Patterns) BẮT BUỘC phải bao gồm Behavioral Patterns (Prompts, Personas, Workflows) nếu có
- **Single Source of Truth (Symlink Strategy):**
  - File CANONICAL lưu tại: `_iwish-output/repo-dna/{repo-name}-dna.md`
  - Tạo Symlink trong sandbox: `ln -sf $(pwd)/_iwish-output/repo-dna/{repo-name}-dna.md ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md`
  - ⚠️ **KHÔNG BAO GIỜ** tạo bản copy thứ 2 — sandbox path PHẢI là symlink

---

## 4. Acceptance Criteria

### AC1: Repomix Integration (Phase 1)
- **GIVEN** A repo has been cloned to `${IWISH_HOME}/sandbox/{repo-name}/`.
- **WHEN** The INGEST phase executes.
- **THEN** The skill MUST run `npx repomix` with markdown output.
- **AND** Validate the output file exists and size is between 1KB and 5MB.
- **AND** If output > 2MB → emit WARNING: "Large context — may exceed token limits."
- **AND** If monorepo detected → prompt user to select target sub-package.

### AC1.5: Dual-Indexer + Hybrid Resolution (Phase 1.5 — MỚI)
- **GIVEN** Phase 1 INGEST has completed.
- **WHEN** Phase 1.5 INDEX executes.
- **THEN** The skill MUST attempt to run `/analyze-codebase` (CGC) first.
- **AND** Execute AST-to-Asset Tracing to discover file `.md`/`.prompt` được gọi bởi code.
- **AND** Apply Hybrid Resolution Algorithm (3 layers: Static → Fuzzy → Orphan).
- **AND** When Fuzzy Tracing encounters multiple files with same basename, apply Path-based Heuristics (shortest Directory Distance).
- **AND** If total Behavioral Assets > 50 files, apply Token Overflow Guard (keep P0.5 + P1.5, triage P4).
- **AND** If CGC fails → Fallback to Heuristic Scan (tree + behavioral directory detection).
- **AND** Output Asset Inventory file with labels (P0.5, P1.5, P4) to `{repo-name}-asset-inventory.md`.

### AC2: Graph-Directed Architecture Mapping (Phase 2 — NÂNG CẤP)
- **GIVEN** Knowledge Graph (or Heuristic fallback) is available from Phase 1.5.
- **WHEN** The MAP phase executes.
- **THEN** If CGC available: The skill MUST query the graph for Entry Points, Module Boundaries, and Hub Nodes.
- **AND** If CGC unavailable: Fallback to directory scan + manual entry point identification.
- **AND** Merge Asset Inventory (P0.5, P1.5 files) into architecture map as Behavioral Module layer.
- **AND** Generate a Mermaid diagram with BOTH Tech + Behavioral modules (≥ 3 nodes).
- **AND** Classify repo type (now includes: `prompt-collection`, `workflow-engine`, `hybrid-agent`).
- **AND** If ≥ 3 disconnected clusters detected → classify as Compound Repo.

### AC3: Dual-Layer Deep Reading (Phase 3 — NÂNG CẤP)
- **GIVEN** Architecture map is complete.
- **WHEN** The DISSECT phase executes.
- **THEN** Tech Layer: Read files ordered by Hub Node rank (or static P0→P5 if no graph).
- **AND** Behavioral Layer: Read ALL P0.5 files entirely, ALL P1.5 files entirely, P4 files first 50 lines only.
- **AND** For each Behavioral Asset, extract: Role/Persona, System Prompt, Tool Usage Pattern, Workflow Steps, Decision Logic, Guard Rails.
- **AND** Document ≥ 5 core patterns total across BOTH layers.
- **AND** Never read auto-generated files (`*.schema.json`, `*codegen*`).

### AC4: repo-dna.md Generation with Symlink (Phase 4 — NÂNG CẤP)
- **GIVEN** All previous phases are complete.
- **WHEN** The DOCUMENT phase executes.
- **THEN** The skill MUST generate `repo-dna.md` using the standardized template.
- **AND** All 11 sections MUST be addressed (use "N/A — [Reason]. Repo classified as [{type}]." if genuinely N/A).
- **AND** Section 10 MUST include Behavioral Patterns if extracted in Phase 3.
- **AND** Save CANONICAL file to `_iwish-output/repo-dna/{repo-name}-dna.md`.
- **AND** Create symlink in sandbox: `ln -sf ... ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md`.
- **AND** Verify symlink with `ls -la`. MUST NOT create a second independent copy.

### AC5: Repomix Fallback
- **GIVEN** Repomix is not installed or fails.
- **WHEN** Phase 1 encounters an error.
- **THEN** The skill MUST fallback to `github-deep-research` 3-Layer methodology.
- **AND** Emit WARNING: "Repomix unavailable — using fallback. Results may be less comprehensive."

---

## 5. Technical Constraints & Design Considerations

- **Repomix phải được install:** `npm install -g repomix` hoặc dùng `npx repomix` (auto-download).
- **Token budget:** Repomix output có thể rất lớn. Skill phải có strategy để handle repos > 2MB packed context.
- **Language support:** Phase 3 reading patterns phải support ít nhất: TypeScript, JavaScript, Python, Go. Các ngôn ngữ khác → best-effort.
- **Idempotent:** Chạy lại Phase 1-4 trên cùng repo phải produce consistent results (overwrite existing output).
- **Timeout:** Mỗi phase có soft timeout 5 phút. Nếu exceed → emit WARNING, không ABORT.

---

## 6. Definition of Done (DoD)

- [x] File `.agent/skills/repo-absorption/SKILL.md` đã tạo với đầy đủ 5-phase specification (bao gồm Phase 1.5 INDEX).
- [x] Phase 1: Repomix chạy thành công trên 1 real repo → output file > 1KB.
- [x] Phase 1.5: Dual-Indexer tạo Asset Inventory với labels (P0.5, P1.5, P4). Hybrid Resolution hoạt động.
- [x] Phase 2: Graph-Directed architecture map generated → ≥ 3 modules + Behavioral overlay, Mermaid diagram valid.
- [x] Phase 3: Dual-Layer extraction cho 1 real repo → ≥ 5 patterns across Tech + Behavioral layers.
- [x] Phase 4: `repo-dna.md` generated với Symlink strategy → all 11 sections addressed, no duplicate copy.
- [x] Fallback mechanism hoạt động khi CGC hoặc Repomix unavailable.
- [x] Token Overflow Guard hoạt động khi > 50 behavioral files.
- [x] Path-based Heuristics giải quyết trùng tên file.
