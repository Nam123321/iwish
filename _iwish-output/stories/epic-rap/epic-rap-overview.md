---
epic_id: "EPIC-RAP-01"
title: "Repo Absorption Protocol — Deep Learning External Repositories"
status: "IN_PROGRESS"
owner: "Whis"
priority: "HIGH"
phase: "forge"

---
# EPIC-RAP-01: Repo Absorption Protocol (RAP)

## Overview

Xây dựng quy trình toàn diện để **đào sâu, phân tích, và tích hợp** các repo open-source bên ngoài vào hệ thống I-Wish-DragonBall. Giải quyết vấn đề cốt lõi: agent hiện tại chỉ đọc README rồi implement → kết quả chỉ có "hình dáng" mà thiếu "bộ não" của repo.

## Problem Statement

Khi agent research một repo GitHub:
1. Chỉ đọc README → miss core logic, architecture, design decisions
2. Không có context window strategy → mất liên kết giữa các files
3. Không có knowledge extraction phase → nhảy thẳng vào implement
4. Không có security check → risk khi clone repos chưa verify
5. Không có quality gate → không verify agent đã thực sự hiểu repo

## Solution: 9-Phase Pipeline

```
Phase 0: SECURITY GUARDIAN ─→ Phase 0.5: CLONE TO SANDBOX
    ↓
Phase 1: INGEST (Repomix) ─→ Phase 1.5: INDEX (Dual-Indexer + Hybrid Resolution)
    ↓
Phase 2: MAP (Graph-Directed) ─→ Phase 3: DISSECT (Dual-Layer: Tech + Behavioral)
    ↓
Phase 4: DOCUMENT (repo-dna.md via Symlink) ─→ Phase 5: COMPARE (Gap Analysis)
    ↓
Phase 6: INTEGRATE (Human Approve) ─→ Phase 7: VALIDATE (Understanding Gate)
```

## Scope — Repo Types Supported

| Type | Examples | Priority |
|------|----------|----------|
| Agent/AI Frameworks | I-Wish, AutoGen, CrewAI, LangGraph, gstack | P0 |
| Prompt/Workflow Collections | gstack sprint skills, AI role libraries | P0 |
| Backend APIs | NestJS boilerplates, Express patterns, FastAPI | P0 |
| UI Libraries | shadcn/ui, Radix, component systems | P1 |
| Full-Stack | T3 Stack, Next.js starters | P1 |
| DevOps/Infra | CI/CD patterns, Terraform modules | P2 |

## Epic Story Map

| Story | Title | Dependencies | Status |
|-------|-------|--------------|--------|
| RAP-1.1 | Security Guardian Skill | None | `DONE` |
| RAP-1.2 | Repo Absorption Skill (5-Phase: Ingest + Index + Map + Dissect + Document) | RAP-1.1 | `DONE` |
| RAP-1.3 | Repo DNA Template (Symlink + Flexible Sections) | None | `DONE` |
| RAP-1.4 | `/absorb-repo` Orchestrator Workflow (9-Phase Pipeline) | RAP-1.1, RAP-1.2, RAP-1.3 | `DONE` |
| RAP-1.5 | Dynamic Integration Routing & Global Triggers | RAP-1.4 | `DONE` |

## Key Design Decisions

1. **Local-first analysis** (clone to sandbox) — nhưng Remote L1 trust check trước khi clone
2. **Repomix** as primary packing tool — MCP integration via `codebase-mcp`
3. **Gitleaks** for secret scanning — complemented by `npm audit` for dependencies
4. **4 Human Checkpoints:** Phase 0 (security), Phase 5 (suggestions), Phase 6 (each change), Phase 7 (sign-off)
5. **repo-dna.md** as standardized knowledge artifact — consistent format for all repo types
6. **4-Level Classification Framework:** `SKILL`, `WORKFLOW`, `PERSONA`, `COMPOUND` to prevent context bloat.
7. **Global Intercept Triggers:** Đảm bảo Master Router tự động chặn và ép chạy `/absorb-repo` thay vì code chay.
8. **Dual-Indexer Strategy (Phase 1.5):** Kết hợp Tech Graph (CGC/AST) và Behavioral Indexer để không bỏ sót file `.md`/`.prompt` — linh hồn của AI repos.
9. **Hybrid Resolution Algorithm:** 3 lớp gắn nhãn (Static Tracing → Fuzzy Tracing → Orphan Isolation) với Path-based Heuristics để chống trùng tên file.
10. **Graph-Directed Analysis (Phase 2 & 3):** Ưu tiên dữ liệu từ Knowledge Graph thay vì quét thủ công `tree`/`grep`.
11. **Single Source of Truth (Symlink):** Chỉ lưu 1 file DNA canonical tại `_iwish-output/`, sandbox dùng `ln -s` để tránh Split Brain.
12. **Token Overflow Guard:** Giới hạn tối đa 50 file behavioral để tránh tràn context window.
13. **CGC Fallback:** Luôn có Heuristic Scan dự phòng nếu FalkorDB/Tree-sitter gặp lỗi.

## Success Metrics

- Agent absorb 1 repo và tạo repo-dna.md đầy đủ trong < 15 phút
- repo-dna.md capture ≥ 80% core logic patterns (human verified)
- Security Guardian catch 100% known vulnerabilities và leaked secrets
- Integration suggestions accuracy ≥ 70% (human agrees with ≥ 7/10 suggestions)
