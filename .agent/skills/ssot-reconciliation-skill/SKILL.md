---
name: SSOT Reconciliation Skill
description: Detects, evaluates, and synchronizes drift between implementation code, architectural docs, global policies, and user stories using a Zero-Trust Evaluation Gate.
---

# SSOT Reconciliation Skill

This skill is responsible for mitigating drift between code, planning artifacts (`impl-plan.md`), documentation (`data-spec.md`, `ui-spec.md`, `story.md`), and Global Project Policies (`.agents/rules/*`, `eslint`, `tsconfig`). It enforces a strict triage matrix and zero-trust validations before proposing or modifying documentation.

## Core Directives
1. **Never Assume Sync:** Do not assume code and documentation are in sync without verification.
2. **Context Pruning:** Extract only relevant JSON contracts from documents.
3. **Always Backup:** Run physical backup (`cp`) before writing over spec files.
4. **Dependency Tracker:** You MUST map the target Story ID to its exact PRD, UI Spec, and Data Spec files by reading `project-context.md` or `feature-hierarchy.md` before attempting reconciliation.
5. **[NEW] Global Policy Scope:** You MUST explicitly track Global Policies (e.g., `testing-strategy.yaml`, `.eslintrc-qa.json`). Planning artifacts (`impl-plan.md`, `story.md`) MUST NOT contradict Global Policies.

## Drift Detection Engine

### Step 1: Contract Extraction
When validating drift, first extract the required rules from the target document into a JSON array of `states` and `business rules`.
- **[P10 Mitigation - Cost Control]:** Cache this JSON extraction in `_iwish-output/ssot-cache/`. Only re-extract via LLM if the target Spec file's hash changes.
- **[Zero-Trust Gate] Hash Caching:** Do NOT calculate hashes using LLM. You MUST use a deterministic Python script with `hashlib.sha256`. To prevent Cache Poisoning, use Atomic Writes: write to a temporary file (`hash.tmp.$PID`) then use `os.replace` (Atomic Rename) to the final cache path.

### Step 2: Semantic Diff Engine
Compare the proposed edge-case, implementation logic, or Planning Artifacts with the JSON Contract (including Global Policies).
- **[Zero-Trust Gate] In-Sync:** If you conclude the change is already covered (In-Sync), you MUST provide **Citation / Proof** (exact text quote or line number). If proof is absent, downgrade verdict to `Drift = True`.
- **[P1/P5 Mitigation]:** Context input max 2000 characters. Timeout 15s. Fallback to "Human Review" on error.

### Step 3: Triage Gate Matrix
Evaluate the `Drift` against the Triage Matrix:

**Mandatory Updates (Proceed to Plan & Auto-Sync):**
- **Global Policy & Strategy Adherence (e.g., File Extensions, Test Coverage, Linting Rules)**
- Business Rule changes
- Data Schema / Model changes
- UX/UI State additions
- Architecture / Integrations
- AC Edge-case mitigations
> **[Zero-Trust Gate]:** You MUST provide explicit Citation/Proof (exact line/quote) from the codebase or Global Policy demonstrating that the change belongs to one of these Mandatory groups before putting it into the Plan. If a Global Policy updates, you MUST perform a "Downward Sync" to auto-correct all existing `impl-plan.md` and `story.md` affected by the policy change.

**Forbidden Updates (Reject Ticket):**
- Internal Refactoring (unless mandated by Global Policy)
- Micro-performance tuning
- Styling / CSS tweaks
- Internal error handling (try/catch logic)
- Unit test coverage details (unless it violates testing-strategy thresholds)

- **[P6 Mitigation - Privilege Boundary]:** If the drift impacts `architecture.md` or other Global Docs, you MUST NOT update it directly. Trigger `/party-mode` for Watchmen signature.
- **[P4/P8/P11 Mitigation - Human-in-the-loop Override]:** If LLM classifies a change as "Refactoring" but the code modifies branching logic (`if/else`), output a "Silent Alert" asking the User if they want to Force-Override.

## Safe Sync Execution
When instructed to execute the reconciliation plan:
1. **[P3 Mitigation - Concurrency Lock]:** Apply Mutex Lock on the file. Do NOT use static `.lock` text files. You MUST use OS-level `flock` (e.g., via Python `fcntl.flock` on the file descriptor) to prevent Stale Deadlocks in case of crashes.
2. **[P2/P12 Mitigation]:** Execute physical backup (`.bak`).
3. Apply changes (e.g., updating `.js` to `.ts` in File Manifests).
4. If format breaks or user rejects, restore from `.bak`.
