# I-Wish Machine Memory Schema

> **⚠️ This file is for HUMAN reference only. Agents MUST read `instincts.jsonl` directly.**
>
> For agent-facing admission/routing rules, load `.agent/fragments/memory-admission-protocol.md`. For learning-log and background-review evidence contracts, load `.agent/fragments/background-review-learning-log-governance.md`.

## Memory Layers

I-Wish uses project-centered memory. Hermes-style user memory is useful, but I-Wish's unit of work is a product/project, so project constraints must dominate general user preferences.

| Layer | Suggested File | Scope | Owner | Use |
|---|---|---|---|---|
| User preference memory | `.agent/memory/USER.md` | Cross-project | Human/user | Stable preferences such as language, tone, collaboration style, review strictness, and risk tolerance. |
| Project memory | `.agent/memory/PROJECT.md` | Current project/product | Project owner + I-Wish maintainers | Product context, architecture decisions, terminology, constraints, stakeholders, active goals, and recurring project-specific lessons. |
| Workflow memory | Workflow-local notes or future `.agent/memory/workflows/*.md` | One workflow/capability | Workflow owner | Repeated workflow failures, scoring adjustments, known edge cases, and promotion/rollback notes. |
| Session / learning log | `.agent/memory/learning-log.jsonl` plus `.agent/memory/instincts.jsonl` for dense operational patterns | One run or observed pattern | Executing/reviewing agent | Concrete correction, failure, fix, source, severity, status, reviewer decision, and reference. |

## Storage Strategy

I-Wish should use a hybrid memory model instead of copying Hermes' flat 2.2K-character memory limit directly:

| Store | Role | Size Policy |
|---|---|---|
| Prompt memory (`PROJECT.md`, `USER.md`) | Small, always-relevant summaries that may be loaded into agent context. | Keep compact; use section-level summaries and avoid raw logs. A Hermes-style soft cap is useful as a lint target, not a hard architectural limit. |
| Learning log (`learning-log.jsonl`) | Append-only audit trail for session lessons and background-review evidence candidates. | Store compact JSONL rows using `.agent/fragments/background-review-learning-log-governance.md`; cite source artifacts instead of duplicating raw evidence. |
| Machine memory (`instincts.jsonl`) | Dense operational lessons and bad/good patterns for clustering and capability evolution. | Append-only until resolved/archived; keep entries compact and source-linked. |
| Memory graph / Knowledge Graph | Retrieval layer for relationships across projects, workflows, stories, defects, instincts, capabilities, and learnings. | Preferred for scalable long-term memory and impact traversal; load by query, not by dumping the graph into context. |
| Source artifacts | Full evidence such as bug reports, PRDs, architecture docs, RAP DNA, and validation reports. | Store full detail here; memory should cite these instead of duplicating them. |

Recommended default: keep prompt memory small and curated, but use graph-backed memory for scale. The graph should not replace `PROJECT.md`; it should help retrieve the right project/workflow/instinct entries just in time.

Repo-local approved memory remains distinct from `${IWISH_HOME}` runtime state. Use `.agent/memory/*` for canonical project memory and `${IWISH_HOME}/profiles/<profile-id>/projects/<project-slug>/` only for runtime-only mirrors, exports, generated drafts, and other non-canonical HSEA artifacts.

## Memory Precedence

When memory conflicts, agents must resolve it in this order:

1. System and safety rules.
2. Explicit project instructions and approved project artifacts.
3. Active workflow/story instructions.
4. Current user request.
5. `USER.md` preferences.
6. Historical session notes and instinct records.

`PROJECT.md` is the primary persistent memory for product development work. `USER.md` is preference context only and must not override project constraints, approved architecture, story acceptance criteria, safety policy, or current user instructions.

## Context Budget Rules

- Load `PROJECT.md` before product/story/review work when it exists, but select only sections relevant to the current task.
- Load `USER.md` only for collaboration preferences, not as technical authority.
- Summarize long memory sections before using them in prompts.
- Prefer fresh story/PR/project artifacts over stale memory.
- Never dump full historical memory into every turn by default.
- Prefer graph/query retrieval for long-term memory instead of growing prompt memory.

## Memory Admission Protocol

Agent-facing admission/routing rules live in `.agent/fragments/memory-admission-protocol.md`. This schema file records the memory data model; workflow and agent instructions should load the fragment when deciding whether to save, route, defer, or skip a newly discovered lesson.

## Background Review and Learning Logs

Learning-log and background-review governance lives in `.agent/fragments/background-review-learning-log-governance.md`. Use that fragment when a session, story, implementation pass, bug fix, code review, QA run, curator signal, user correction, or evolution trial produces a durable learning candidate. Authorized foreground workflows persist learning-log entries as append-only JSONL rows in `.agent/memory/learning-log.jsonl`; material changes append new rows with the same `id` rather than rewriting prior decisions. Background review is recommendation-only and must not mutate `PROJECT.md`, `USER.md`, canonical `.agent/` assets, `templates/`, KG/MemoryGraph nodes, `${IWISH_HOME}/generated-*` drafts, or `.agent/memory/learning-log.jsonl` unless an active workflow explicitly authorizes that action.

## Hermes Adaptation Note

Hermes is assistant-user oriented, so its memory design centers persistent assistant behavior around the human. I-Wish-DragonBall is project/process oriented, so it adapts the same idea into project-scoped memory. This prevents one user's broad preferences or unrelated session history from contaminating a specific project's delivery constraints.

---

## Instinct Record Format (Dense JSONL)

Each line in `instincts.jsonl` is a single JSON object with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ts` | string | ✅ | ISO date (YYYY-MM-DD) when the instinct was recorded |
| `src` | string | ✅ | Origin workflow: `fix-bug`, `code-review`, `audit-ux`, `self-check`, `ad-hoc` |
| `ctx` | string | ✅ | Comma-separated context tags (e.g., `nestjs,prisma,guard`) |
| `bad` | string | ✅ | The anti-pattern or mistake observed |
| `good` | string | ✅ | The correct pattern or fix applied |
| `sev` | number | ✅ | Severity 1-5 (1=minor style, 5=critical crash) |
| `file` | string | ❌ | File path where the issue was found (optional) |
| `ref` | string | ❌ | Reference link: Story ID, PR number, or doc link (optional) |

## Example Records

```jsonl
{"ts":"2026-04-07","src":"fix-bug","ctx":"nestjs,prisma","bad":"findMany() no limit","good":"findMany({take:50})","sev":5,"file":"order.service.ts"}
{"ts":"2026-04-07","src":"code-review","ctx":"react,nextjs","bad":"<a href>","good":"<Link href>","sev":3,"file":"nav.tsx"}
{"ts":"2026-04-06","src":"ad-hoc","ctx":"ui,modal","bad":"absolute center div","good":"use Drawer component from antd","sev":2}
{"ts":"2026-04-05","src":"audit-ux","ctx":"ui,bulk-action","bad":"floating cart on orders tab","good":"header action bar (consistent with products)","sev":4,"ref":"ux-patterns.yaml#bulk-action"}
```

## Graph Integration

When FalkorDB is available, each instinct SHOULD also be indexed as a Graph Node:
```cypher
GRAPH.QUERY featuregraph "CREATE (:Instinct {id:'inst_001', ctx:'nestjs,prisma', bad:'findMany() no limit', good:'findMany({take:50})', sev:5, ts:'2026-04-07', src:'fix-bug'})"
```

## Lifecycle

1. **Created** — Agent appends a line after fixing a bug or discovering a pattern.
2. **Indexed** — (Optional) Node created in FeatureGraph with `[:AFFECTS]` edges.
3. **Resolved** — Whis clusters instincts and upgrades a SKILL.md. Edge `[:RESOLVED_IN]` added.
4. **Archived** — Resolved instincts are moved to `instincts.archive.jsonl` (cold storage).
