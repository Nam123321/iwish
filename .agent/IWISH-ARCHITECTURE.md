# I-Wish Architecture: Central Governance & Sharing Registry

This document serves as the absolute ground truth for how I-Wish (Behavioral Meta-Agent Development) orchestrates shared context, rules, skills, and methodologies. 

By strictly adhering to this architecture, we guarantee that the LLM Orchestrator avoids hallucination and laziness (Double-Lock Strategy) while maintaining Continuous Learning.

---

## 1. The Classification Matrix & Funnel Criteria

Any new piece of knowledge, tool, or methodology entering the I-Wish ecosystem MUST pass through the Classification Funnel. It evaluates three criteria:
*   **Scope & Autonomy:** Is it a simple rule, passive knowledge, an active tool, or an end-to-end process?
*   **Execution Context:** Is it "always on", "injected when needed", "called on demand", or "followed step-by-step"?
*   **Reusability:** Is it shared globally or scoped to specific tasks?

The modern funnel should classify capabilities on two axes:

1. **Shape axis:** `dynamic-context`, `fragment`, `skill`, `workflow`, `agent`, `compound`, `skill-attachment`, or `workflow-patch`
2. **Role axis:** `process-primary`, `supportive`, or `foundational`

The older 4-type matrix remains historically useful, but it is no longer expressive enough for the current I-Wish/I-Wish capability system.

| Shape | Funnel Criteria (Tiêu chí phân loại) | Typical Role | Required Action (Hành động bắt buộc) |
| :--- | :--- | :--- | :--- |
| **Dynamic Context** | A core behavioral rule or iron law that must always be active. | Foundational | Register as global policy/context and keep prompt footprint lean. |
| **Fragment** | Reusable standard, guideline, or methodology. Passive knowledge. | Foundational | Create `/.agent/fragments/<name>.md` and inject from related workflows/skills/agents. |
| **Skill** | Packaged, specialized, callable task/tool. | Process or Supportive | Create `SKILL.md` in `/.agent/skills/{skill_name}/` and register in KG/catalog. |
| **Workflow** | Multi-step end-to-end process that must be followed sequentially. | Usually Process | Create `/.agent/workflows/<name>.md` and step files when appropriate. |
| **Agent** | Dedicated decision shell or role that routes workflows/skills. | Usually Process | Create `/.agent/agents/<name>.md` and map owned capabilities. |
| **Compound** | Capability bundle spanning multiple coherent jobs or a subsystem. | Usually Supportive | Create generated package/module instead of flattening into one file. |
| **Skill Attachment** | Specialist helper injected into existing process workflows. | Supportive | Create/patch supporting skill and wire into existing process capabilities. |
| **Workflow Patch** | Narrow extension to an existing workflow instead of a new public workflow. | Supportive | Route to `enhance-skill` patch/merge path. |

### Delivery-System Role Interpretation

Capabilities should also be interpreted through the delivery framework:

- **Process-primary:** directly owns a stage/task in the main product-delivery spine
- **Supportive:** improves, accelerates, or de-risks another capability
- **Foundational:** shared injection or governance substrate used across many capabilities

Examples:

- `create-prd` = workflow + process-primary
- `absorb-repo` = workflow + supportive
- `ui-ux` specialist wrapper = skill-attachment + supportive
- `ux-principles` = fragment + foundational

Generated assets are the exception to direct canonical writes. Any output from `/absorb-repo`, `/create-skill`, or similar capability-forging workflows MUST start as a draft under `${IWISH_HOME:-~/.iwish}/generated-*` with `metadata.yaml`. It may enter `.agent/` only after explicit promotion approval, KG registration, and portability validation. See `docs/iwish-public-runtime-policy.md`.

---

## 2. The Iron Rule of Continuous Learning

To preserve the learning cycle across multiple sessions, **EVERY** Workflow must adhere to the following:

1.  **Step 00 (Load Context):** The first action of the Orchestrator is to query the Knowledge Graph or Semantic Search to load any relevant Dynamic Context or learned patterns.
2.  **Final Step (Save Context):** The final action of the Orchestrator before terminating the session is to save any new insights, edge cases, or corrections back to the Knowledge Graph.

---

## 3. Double-Lock Context Injection (For Fragments)

LLMs are prone to forgetting or "lazily" ignoring required methodologies. To enforce absolute compliance when using **Fragments**, developers must utilize the Double-Lock strategy.

At the very top of any Workflow `.md` file that requires a Fragment, you must use this exact syntax:

```markdown
> [!IMPORTANT]
> **DOUBLE-LOCK CONTEXT INJECTION:**
> Before proceeding to Step 1, you MUST use the `view_file` tool to load and read `/.agent/fragments/{fragment_name}.md`. Failure to do so violates the I-Wish architecture. If the file cannot be loaded, you MUST HALT execution and alert the user immediately.
```

---

## 4. The Master Mapping Table

This static map tracks how specific Workflows rely on specific Fragments or Skills. 
*Agents must use this registry as the ground truth before execution.*

### Current Mappings

**(This section will be populated as Wave 2 and Wave 3 of Gstack absorption are completed)**

```yaml
mappings:
  - workflow: "fix-bug"
    requires_fragment: "test-bootstrap"
  - workflow: "ui-spec"
    requires_fragment: "ux-principles"
  - workflow: "prototype"
    path: "/.agent/workflows/prototype.yaml"
    description: "Safe experimental prototyping on isolated branches with patch backups"
  - skill: "caveman-mode"
    path: "/.agent/skills/caveman-mode/SKILL.md"
    description: "Rule-of-Three compressed communication for token efficiency"
```
---
 
 ## 5. Quality Guardrails (Local DevEx Ops)
 
 I-Wish maintains a multi-layered quality system to prevent "Magic Numbers", "Context Leaks", and "Architectural Drift" from entering the codebase.
 
 ### 5.1. The Layered Defense
 
 | Layer | Trigger | Tooling | Focus |
 | :--- | :--- | :--- | :--- |
 | **1. Development** | `/step-04-self-check` | `npm run lint:fix` | Early linting, auto-repair of style violations. |
 | **2. Pre-Commit** | `git commit` | `lint-staged` | Fast formatting/linting of staged files. |
 | **3. Pre-Push** | `git push` | `npm run build`, `guard:*` | Full type-check, Secret Scan, Registry Check, Magic Number & Context Leak detection. |
 
 ### 5.2. Specialized Guardrails
 
 *   **Magic Number Hunter**: Generic scanner for hardcoded values (colors, spacing) that should be abstract tokens. Default: Stitch.
 *   **Context-Leak Detector**: Prevents hardcoding of Business Data (Prices, Status IDs, UUIDs) that should be dynamic.
 *   **Registry Hook**: Ensures every source file is registered in `knowledge-graph.yaml`.
 
 ---
 
 ## 6. Meta-SDLC & Evolution Lab Governance
 
 When developing internal capabilities, workflows, skills, or agent personas (Meta-SDLC), the orchestrator MUST adhere to the **Evolution Lab Layout Mode** to ensure absolute isolation from the product runtime.
 
 1. **Isolation**: All Meta-SDLC artifacts (stories, epics, tasks, UI/Data specs, risk matrices, review reports) MUST be written to `.agent/evolution-lab/...`.
 2. **Pollution Prevention**: Internal framework development MUST NOT pollute the product's runtime or project metrics. Meta-SDLC files are exempt from `sprint-status.yaml`, `FeatureGraph`, and `CodeGraph` scans unless specifically tracking framework progress.
 3. **Naming Convention**: Use the `M` prefix for stories and epics related to the Meta-SDLC (e.g. `story-M1.1.md`) to maintain semantic clarity.
