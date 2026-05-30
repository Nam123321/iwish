# Story 1.1: Semble CLI Wrapper Skill

**Epic:** Epic 1: Semble Retrieval Skill & Story Reading
**Story Title:** Semble CLI Wrapper Skill
**Goal:** Create a system skill `semble-search` under `.agent/skills/` that wraps the `semble` CLI for hybrid semantic+lexical code search, with graceful fallback to `uvx` when not globally installed and to `grep_search` when Python/uv is entirely missing.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story represents a complete vertical slice:
1. **Skill Layer**: SKILL.md with full frontmatter, usage guidelines, and agent instructions.
2. **Script Layer**: `semble-wrapper.sh` shell script handling CLI detection, uvx fallback, and JSON output parsing.
3. **Python Bridge**: `semble-search.py` providing programmatic access for downstream stories (1.2, 2.1, 2.2).
4. **Fallback Layer**: Graceful degradation to `grep_search` when no Python runtime is available.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** the agent invokes `semble-search`, **When** `semble` CLI is installed globally, **Then** it executes `semble search "<query>" <path> --top-k <k>` and returns parsed JSON chunks containing `file_path`, `start_line`, `end_line`, `content`, and `score`.
- **AC2:** **Given** `semble` is NOT installed globally, **When** `uvx` is available, **Then** it falls back to `uvx --from semble semble search "<query>" <path> --top-k <k>` and returns identical JSON output.
- **AC3:** **Given** neither `semble` nor `uvx`/Python is available, **When** the skill is invoked, **Then** it falls back to `grep_search` and returns results in a compatible format with a WARNING that semantic search is unavailable.
- **AC4:** **Given** any invocation mode, **When** `find_related` is called with a file path and line number, **Then** it executes `semble find-related <file> <line> <path>` and returns related code chunks.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 0 (JSON passthrough, no new models) → 0
3. **UI Surface:** 0 (CLI/script only, no UI) → 0
4. **Cross-Domain:** 0 (Self-contained skill) → 0
5. **Flow Complexity:** 1 (3-tier fallback chain) → 0
6. **Test Burden:** 1 (CLI availability detection, JSON parsing) → 0
**Complexity Score (CS):** 0 (✅ OK — Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | CLI Direct Execution | Task 1: Create `scripts/semble-wrapper.sh` with `semble` CLI detection and JSON output. | ✅ Mapped |
| AC2 | uvx Fallback | Task 2: Add uvx fallback logic in `semble-wrapper.sh` when `semble` not found. | ✅ Mapped |
| AC3 | grep_search Fallback | Task 3: Implement grep_search degradation path in `scripts/semble-search.py`. | ✅ Mapped |
| AC4 | find_related Support | Task 4: Add `find-related` subcommand handling in wrapper and Python bridge. | ✅ Mapped |
| ALL | Skill Registration | Task 5: Create/update `.agent/skills/semble-search/SKILL.md` with full frontmatter. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Tool Selection**: Semble's hybrid search (Model2Vec + BM25 + RRF) provides significantly better code recall than pure lexical grep, especially for natural-language queries about intent.
- **Fallback Strategy**: 3-tier cascade ensures the skill NEVER blocks agent execution. Even without Python, agents can still search code via grep_search.
- **Output Contract**: All tiers return a unified JSON schema `{query, results: [{file_path, start_line, end_line, content, score}]}` so downstream consumers (Stories 1.2, 2.1, 2.2) don't need to handle format variations.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | 3-tier fallback with unified JSON output contract; all CLI args mapped from semble source. |
| Data Integrity & State | 9 | Stateless per-invocation; semble handles its own cache internally. |
| Security & Validation | 9 | No network calls; all operations are local filesystem. Query input is shell-escaped. |
| Performance & Scalability | 8 | First-run indexing takes ~2-5s for medium repos; subsequent runs use cache. |
| Error Handling & Recovery | 10 | Graceful 3-tier degradation; never blocks agent flow. |
| Architectural Depth & Leverage | 10 | Foundation skill enabling 3 downstream stories; clean interface contract. |
| UX Empathy | 9 | Transparent to agents — they just call the skill and get results regardless of runtime. |

**TOTAL AVERAGE: 9.14/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (SKILL.md → shell wrapper → Python bridge → fallback).
- [x] **Deletion Testable?** Yes (removing scripts causes downstream story failures).
- [x] **Interface vs Implementation?** Yes (agents see SKILL.md, implementation is in scripts/).

---

**Status:** `DONE`
