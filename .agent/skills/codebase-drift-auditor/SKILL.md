---
name: deep-audit
description: Perform deep structural codebase audit using ts-morph to detect API contract
  gaps, any types, and monorepo violations.
triggers:
- /deep-audit
- /audit
phases:
- implementation
- validate
primary_agents:
- qa-agent-persona
- orch-agent-persona
---
# Codebase Drift Auditor (`/deep-audit`)

## Overview
This skill executes a suite of strict Category A (deterministic) TypeScript structural checks against the codebase to prevent "drift"—specifically Express ghost dependencies, missing Fastify API contracts, type safety abuse (`any`), monorepo boundary violations, singleton misuse, and fake tests.

It uses `ts-morph` for precise AST parsing instead of Regex to eliminate False Positives, and runs in **Lightweight AST Mode** to prevent Out-Of-Memory (OOM) crashes on large monorepos.

## Trigger Conditions (End-to-End Zero-Trust Category A)
1. **Planning Phase (Plan-Proven-Safe)**: Agent MUST run `/deep-audit --story-id <id>` to generate Physical Evidence (`drift-context-<id>.json`). The validator will FAIL the plan if this JSON is missing or forged.
2. **Execution Phase (Code Review)**: Embedded as **Mechanical Check** in `.agent/workflows/iwish-feature-code-review.md`. The orchestrator auto-executes this script. Hard fails on drift.
3. **Git Pre-commit Hook**: Blocks rogue commits at the OS level.

## The 5 Audit Pillars (Scripts)
All scripts reside in `.agent/skills/codebase-drift-auditor/scripts/` and run on Node.js using `ts-node`:

1. `audit-api-contracts.ts` - Fastify route schema validation AND **AST-based API Route enforcement** (uses `ts-morph` to deeply scan `@Controller`/`api.get()` strings and assert exact match with `api-routes.ts`, replacing the grep-based check of `API Contract Guardian` during CI review).
2. `audit-type-safety.ts` - Banning `as any`, `@ts-ignore` in production code.
3. `audit-monorepo-boundaries.ts` - Catching relative paths like `../../../../src`.
4. `audit-resource-singletons.ts` - Detecting stray `new PrismaClient()`.
5. `audit-test-integrity.ts` - Blocking empty tests and `expect(true).toBe(true)`.
6. `audit-ui-msw-drift.ts` - **[NEW] UI-MSW Drift Detection**. Scans Frontend React components (including `.test.tsx` and `.stories.tsx`) via AST. strictly enforcing the usage of `Fishery` factories for Domain mock data, and banning Type Obfuscation (`any`) or `Faker Bypass`.

## 🚨 Anti-AI Cheat Mechanism (Zero-Trust)
To prevent agents from exploiting escape hatches:
- **Escape Hatch**: Developers can bypass audits on specific lines using `// @iwish-disable-audit: [Reason]`.
- **Cheat Prevention**: AI Agents are STRICTLY FORBIDDEN from automatically injecting `// @iwish-disable-audit` into the codebase to clear a blocking gate.
- If an agent self-injects this comment without explicit user instruction, it is a **Zero-Trust Violation** and the pipeline will be marked as `FAILED`.

## Execution
To run manually across a specific module:
```bash
npx ts-node .agent/skills/codebase-drift-auditor/scripts/audit-all.ts <path-to-directory>
```
*(If `<path-to-directory>` is omitted, defaults to `apps/` and `src/`)*

## Party-Mode Interpretation
When Party-Mode receives a report from `/deep-audit`:
- **Physical Evidence:** Treat the AST scan results as indisputable physical evidence.
- **No Hallucination:** Do not assume a file is safe if the AST scanner fails it.
- **Actionable Steps:** Prioritize fixing the exact files flagged by the auditor before debating high-level architecture.
