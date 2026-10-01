---
name: strict-gate-guardian
description: Enforces deterministic step-by-step execution using Category A Hard Gates (Draft-then-Promote pattern) to prevent agents from skipping mandatory steps.
---

# 🛡️ Strict Gate Guardian (Anti-Skip Watchman)

## 1. The Problem (Context Compression & Fast-Tracking)
When workflows contain long text instructions with sequential steps (e.g., Step 1: Create HTML, Step 2: Create Mockup, Step 3: Write Markdown), LLMs often compress context or fast-track execution. They skip intermediate steps and jump straight to the final output file, relying entirely on Category B (Trust-Based) prompt adherence.

## 2. The Solution: Draft-then-Promote (Category A Gate)
To prevent step-skipping, we enforce the **Draft-then-Promote** pattern augmented with the **Immutable File Pattern**.

Instead of instructing the agent to use `write_to_file` directly to the final destination (e.g., `ui-spec.md`), the workflow MUST:
1. **[Immutable File Lock]**: Instruct the agent to run a shell command to create an empty read-only placeholder for the final file (`touch ui-spec.md && chmod 444 ui-spec.md`). This guarantees that if the agent attempts a direct write, it fails with an OS-level `Permission denied` error.
2. Instruct the agent to write the output to a temporary draft file (e.g., `ui-spec-draft.md`).
3. Require the agent to run a strict **Finalizer Script** via shell execution.
4. The Finalizer Script programmatically checks the filesystem for the physical artifacts required by the skipped steps (e.g., `html-preview.html`).
5. **IF PASS**: The script unlocks the placeholder (`chmod 644`), promotes the draft to the final destination (`fs.renameSync`), and re-locks it (`chmod 444`).
6. **IF FAIL**: The script deletes the unauthorized draft and aborts the operation, forcing the agent to go back and complete the missed step.

## 3. Implementation Example
*See `.agent/scripts/finalize-ui-spec.js` for the reference implementation.*

### Usage in Workflow Prompt:
```markdown
6. **[MANDATORY PRE-REQUISITE]**: You must create `html-preview.html` first.
7. **[STRICT GATE GUARDIAN]**: Do NOT save the final file. You MUST save it as `ui-spec-draft.md`.
8. Execute: `node .agent/scripts/finalize-ui-spec.js --story=1.1 --draft=ui-spec-draft.md --out=ui-spec.md`
```

## 4. Enforcement Maturity
This pattern upgrades a workflow's Enforcement Maturity from **Low/Zero (0-30% Category A)** to **High (>70% Category A)** by establishing a verifiable hardware-level gate that prompt injection or hallucination cannot bypass.
