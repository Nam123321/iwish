---
story_id: "STORY-RAP-1.4"
epic_id: "EPIC-RAP-01"
title: "/absorb-repo Orchestrator Workflow — 9-Phase Pipeline (Dual-Indexer + Graph-Directed)"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
phase: "forge"

---
# Story RAP-1.4: `/absorb-repo` Orchestrator Workflow

## 1. Mục tiêu (Objective)

Tạo workflow `/absorb-repo` — orchestrator chính điều phối toàn bộ **9 phases** của Repo Absorption Protocol. Workflow kết nối `security-guardian` skill, `repo-absorption` skill (5-phase engine bao gồm Phase 1.5 INDEX với Dual-Indexer), và `repo-dna-template` (Symlink-based), đồng thời thêm 3 phases cuối: **COMPARE**, **INTEGRATE**, và **VALIDATE**.

**User Value:** Một lệnh duy nhất `/absorb-repo {url}` để deep-learn bất kỳ repo nào — từ security check đến knowledge extraction đến integration planning — tất cả trong một pipeline có kiểm soát, có quality gates, và có human-in-the-loop.

---

## 2. Target Users & Personas

- **User (Human):** Trigger `/absorb-repo {url}`, review security report, approve integration suggestions, sign-off final validation.
- **Whis (Capability Manager):** Primary executor — runs phases, generates artifacts, manages pipeline state.
- **Piccolo (Architect):** Phase 2 (MAP) + Phase 5 (COMPARE) — architecture analysis and gap identification.
- **Hit (Edge Case Guardian):** Phase 0 (SECURITY) + Phase 7 (VALIDATE) — security gate and understanding verification.
- **Vegeta (Developer):** Phase 6 (INTEGRATE) — implement approved changes.

---

## 3. Scope & Phạm vi Triển khai

### 3.1 Tạo file mới

| File | Path | Mô tả |
|------|------|--------|
| `absorb-repo.md` | `.agent/workflows/absorb-repo.md` | Orchestrator workflow definition |

### 3.2 9-Phase Pipeline Specification

```
┌─────────────────────────────────────────────────────────────┐
│  USER INPUT: /absorb-repo https://github.com/owner/repo    │
└─────────┬───────────────────────────────────────────────────┘
          ↓
  Phase 0: SECURITY GUARDIAN (Hit | security-guardian)
  → L1 Trust Signal → L2-L4 post-clone
  🚫 GATE: BLOCK if fail (user override available)
          ↓ PASS
  Phase 0.5: CLONE TO SANDBOX
  → git clone --depth=1 {url} ${IWISH_HOME}/sandbox/{repo-name}/
          ↓
  Phase 1: INGEST (Whis | repo-absorption)
  → Repomix pack → validate output
  📋 Output: {repo-name}-context.md
          ↓
  Phase 1.5: INDEX — Dual-Indexer + Hybrid Resolution (MỚI)
  → Tech Graph (CGC/AST) + Behavioral Indexer
  → AST-to-Asset Tracing → Hybrid Resolution (3 layers)
  → Token Overflow Guard (max 50 behavioral files)
  → CGC Fallback: Heuristic Scan nếu FalkorDB lỗi
  📋 Output: {repo-name}-asset-inventory.md
          ↓
  Phase 2: MAP — Graph-Directed (Piccolo | repo-absorption)
  → Query Graph: Entry Points, Module Boundaries, Hub Nodes
  → Behavioral Layer Overlay (merge Asset Inventory)
  → Compound Detection (≥ 3 disconnected clusters)
  ✅ GATE: ≥ 3 modules (Tech + Behavioral)
  📋 Output: Architecture section of repo-dna.md
          ↓
  Phase 3: DISSECT — Dual-Layer (Whis | repo-absorption)
  → Tech Layer: Hub Node rank (or P0→P5 static)
  → Behavioral Layer: P0.5 → P1.5 → P4 (full/partial read)
  → Extract: Role, System Prompt, Tool Usage, Decision Logic
  ✅ GATE: ≥ 5 patterns across BOTH layers
  📋 Output: Core Logic + Behavioral Patterns of repo-dna.md
          ↓
  Phase 4: DOCUMENT (Whis | repo-dna-template + Symlink)
  → Fill all 11 sections (N/A with reason if not applicable)
  → Section 10 MUST include Behavioral Patterns
  → CANONICAL save: _iwish-output/repo-dna/{repo-name}-dna.md
  → Symlink: ln -sf ... sandbox/repo-dna.md
  ✅ GATE: All sections addressed, symlink verified
          ↓
  Phase 5: COMPARE (Piccolo)
  → Gap analysis: ADOPT | MERGE | REPLACE | SKIP
  👤 HUMAN CHECKPOINT: Review suggestions
  📋 Output: gap-analysis.md
          ↓ APPROVED
  Phase 6: INTEGRATE (Whis → Vegeta)
  → Classification: SKILL | WORKFLOW | PERSONA | COMPOUND
  → Trigger Injection into I-Wish ecosystem
  👤 HUMAN CHECKPOINT: Approve each change
          ↓
  Phase 7: VALIDATE (Hit)
  → 5-Question Understanding Test (human verified)
  ✅ GATE: ≥ 4 PASS
  👤 HUMAN CHECKPOINT: Final sign-off
```

### 3.3 Phase 5: COMPARE — Gap Analysis (New Logic)

**Input:**
- `repo-dna.md` (từ Phase 4)
- Existing I-Wish assets: `.agent/skills/`, `.agent/workflows/`, `.agent/agents/`

**Process:**
1. Load `repo-dna.md` Section 10 ("Reusable Patterns for I-Wish")
2. Scan existing I-Wish skills/workflows cho overlapping functionality
3. For each reusable pattern, decide:
   - **ADOPT:** Pattern mới, I-Wish chưa có → tạo mới
   - **MERGE:** I-Wish có tương tự nhưng repo có improvements → combine
   - **REPLACE:** Repo implementation tốt hơn rõ rệt → thay thế
   - **SKIP:** Không phù hợp với I-Wish context → bỏ qua

**Output format (gap-analysis.md):**
```markdown
# Gap Analysis: {repo-name} vs I-Wish

## Summary
- Total patterns found: X
- ADOPT: Y | MERGE: Z | REPLACE: W | SKIP: V

## Detailed Suggestions

### Suggestion 1: {pattern-name}
- **Decision:** ADOPT
- **From repo:** {file paths}
- **Description:** {what it does}
- **I-Wish impact:** {what changes in I-Wish}
- **Effort:** LOW / MEDIUM / HIGH
- **Risk:** LOW / MEDIUM / HIGH

### Suggestion 2: ...
```

### 3.4 Phase 7: VALIDATE — Understanding Gate (New Logic)

**5 câu hỏi agent phải trả lời:**

| # | Question | Validates |
|---|----------|-----------|
| 1 | Repo này giải quyết vấn đề gì? | Phase 4 Section 1 (Identity) |
| 2 | Logic cốt lõi hoạt động thế nào? Mô tả execution flow | Phase 4 Section 3 (Core Logic) |
| 3 | State management pattern là gì? Data flow ra sao? | Phase 4 Section 4 (State Management) |
| 4 | Có những edge cases nào? Repo handle chúng thế nào? | Phase 4 Section 6 (Error Handling) |
| 5 | Tại sao tác giả chọn approach này? Trade-offs là gì? | Phase 4 Section 8 (Dependencies & Trade-offs) |

**Scoring:**
- Mỗi câu: PASS (correct) / PARTIAL (incomplete) / FAIL (wrong/missing)
- ≥ 4 PASS + ≤ 1 PARTIAL → Overall PASS
- Else → FAIL → quay lại Phase 3 (re-dissect)

---

## 4. Acceptance Criteria

### AC1: Workflow Trigger
- **GIVEN** An agent (or user) invokes `/absorb-repo {github-url}`.
- **WHEN** The workflow starts.
- **THEN** It MUST validate the URL format (github.com/owner/repo).
- **AND** Extract `{repo-name}` from the URL.
- **AND** Create sandbox directory `${IWISH_HOME}/sandbox/{repo-name}/` if not exists.
- **AND** Begin Phase 0 (Security Guardian).

### AC2: Sequential Phase Execution
- **GIVEN** The workflow is running.
- **WHEN** Each phase completes.
- **THEN** The workflow MUST check the phase gate before proceeding.
- **AND** If gate fails → HALT + report reason + offer remediation.
- **AND** Each phase's output MUST be saved before the next phase begins.

### AC3: Human Review Checkpoints
- **GIVEN** Phase 5 (COMPARE) completes with suggestions.
- **WHEN** Suggestions are presented to the user.
- **THEN** The workflow MUST STOP and WAIT for user response.
- **AND** User can: [Approve All] | [Edit specific suggestions] | [Reject All] | [Abort Pipeline]
- **AND** Only approved suggestions proceed to Phase 6.

### AC4: Phase 6 Granular Approval
- **GIVEN** Phase 6 (INTEGRATE) has approved suggestions.
- **WHEN** Implementing each suggestion.
- **THEN** Each implementation change MUST be presented to user for individual approval.
- **AND** User can approve or skip each change independently.

### AC5: Understanding Gate (Phase 7)
- **GIVEN** All integrations are complete.
- **WHEN** Phase 7 executes.
- **THEN** The agent MUST answer all 5 understanding questions.
- **AND** Answers are presented to user for verification.
- **AND** If ≥ 4 PASS → Pipeline complete.
- **AND** If < 4 PASS → Loop back to Phase 3 with specific gaps identified.

### AC6: Pipeline State Recovery
- **GIVEN** The pipeline is interrupted (timeout, crash, user pause).
- **WHEN** `/absorb-repo` is re-invoked with the same repo URL.
- **THEN** The workflow SHOULD detect existing artifacts in sandbox.
- **AND** Offer to resume from the last completed phase.

---

## 5. Technical Constraints & Design Considerations

- **Workflow format:** Follow existing I-Wish workflow convention (`.md` file in `.agent/workflows/`).
- **Phase isolation:** Each phase's output MUST be self-contained — pipeline can resume from any phase.
- **Artifact naming:** All outputs follow pattern: `{repo-name}-{artifact-type}.md` (e.g., `repomix-security-report.md`).
- **Human-in-the-loop:** 4 explicit WAIT points. Agent MUST NOT auto-proceed past human checkpoints.
- **Sandbox cleanup:** Pipeline does NOT auto-cleanup sandbox. User runs cleanup manually or via `/cleanup-sandbox` command.

---

## 6. Definition of Done (DoD)

- [x] File `.agent/workflows/absorb-repo.md` đã tạo với đầy đủ 9-phase specification (bao gồm Phase 1.5 INDEX).
- [x] Phase 1.5 Dual-Indexer + Hybrid Resolution integrated vào pipeline.
- [x] Phase 2 & 3 upgraded to Graph-Directed + Dual-Layer.
- [x] Phase 4 uses Symlink strategy (Single Source of Truth).
- [x] Phase 0 Security Guardian integrated và gating correctly.
- [x] Phase 5 COMPARE generates meaningful suggestions cho 1 real repo.
- [x] Phase 7 Understanding Gate asks 5 questions và scores correctly.
- [x] All 4 human checkpoints trigger và wait as expected.
- [x] CGC Fallback mechanism hoạt động khi FalkorDB unavailable.
- [x] Token Overflow Guard hoạt động khi > 50 behavioral files.
- [x] All artifacts saved to correct paths with Symlink verification.
