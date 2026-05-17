# I-Wish Capability System Framework

Generated: 2026-05-16

## Purpose

This document restructures I-Wish capability taxonomy into a development-system view that is easier to operate:

1. There is one **primary delivery framework** from idea to delivered product.
2. That framework is broken into **phases**, then **stages/tasks**.
3. Agents, skills, and workflows exist to serve those stages/tasks.
4. Supporting capabilities such as `absorb-repo`, `create-skill`, `enhance-skill`, `clone-website`, and similar belong to a separate **supportive group**, not the main delivery spine.
5. Fragments, always-on rules, and shared governance belong to a **foundational group** injected into many capabilities.

This framework is the recommended mental model for Orch routing, capability inventory, and future public packaging.

## 1. System Layers

### A. Delivery Framework Layer

This is the main product-development backbone that users should see first.

```text
Idea -> Discover -> Plan -> Solution -> Implement -> Validate -> Deliver -> Operate/Learn
```

These are the primary business-facing phases.

### B. Process Capability Layer

This layer contains the capabilities that directly execute a stage/task inside the main delivery framework.

Examples:

- `bmad-brainstorming`
- `idea-challenge`
- `bmad-bmm-market-research`
- `bmad-bmm-create-prd`
- `bmad-bmm-create-architecture`
- `bmad-bmm-create-epics-and-stories`
- `bmad-bmm-create-ui-spec`
- `bmad-bmm-dev-story`
- `bmad-bmm-code-review`
- `bmad-bmm-correct-course`

These are the “mainline process movers”.

### C. Supportive Capability Layer

This layer exists to support the process layer, not replace it.

Examples:

- `absorb-repo`
- `register-skill-pack`
- `create-skill`
- `enhance-skill`
- `unique-advantage-evaluator`
- `analyze-codebase`
- `clone-website`
- `fix-bug`
- `simulate-user`
- `audit-ux-patterns`
- `impact-analysis`

These help with leverage, adaptation, augmentation, acceleration, special investigation, and external integration.

### D. Foundational Injection Layer

This is the rule and method substrate injected into many capabilities.

Examples:

- Dynamic context / iron laws / always-on policies
- Fragments
- Shared design principles
- Validation heuristics
- Provenance / governance rules
- Context-loading and memory-admission rules

These are not user-facing “flows”. They are force-multipliers and guardrails.

## 2. Main Delivery Framework

### Phase 1: Discover

Goal: understand the problem, domain, users, business constraints, technical context.

Representative stages/tasks:

- ideation
- business framing
- market research
- domain research
- technical research
- brownfield/project-context discovery

Representative process capabilities:

- `bmad-brainstorming`
- `idea-challenge`
- `bmad-bmm-market-research`
- `bmad-bmm-domain-research`
- `bmad-bmm-technical-research`
- `bmad-bmm-generate-project-context`
- `bmad-bmm-document-project`
- `research`

### Phase 2: Plan

Goal: define the product intent and planning artifacts.

Representative stages/tasks:

- product brief
- PRD creation
- PRD editing
- PRD validation
- project plan framing

Representative process capabilities:

- `bmad-bmm-create-product-brief`
- `bmad-bmm-create-prd`
- `bmad-bmm-edit-prd`
- `bmad-bmm-validate-prd`
- `plan`

### Phase 3: Solution

Goal: turn the plan into buildable specifications.

Representative stages/tasks:

- architecture
- UX design
- UI spec
- epics and stories
- implementation readiness

Representative process capabilities:

- `bmad-bmm-create-architecture`
- `bmad-bmm-create-ux-design`
- `bmad-bmm-create-ui-spec`
- `bmad-bmm-create-epics-and-stories`
- `bmad-bmm-check-implementation-readiness`
- `make-story`
- `make-ui-spec`

### Phase 4: Implement

Goal: execute development work safely and iteratively.

Representative stages/tasks:

- dev execution
- bug fixing
- review
- course correction
- QA automation
- quick execution paths

Representative process capabilities:

- `bmad-bmm-dev-story`
- `code`
- `fix-bug`
- `bmad-bmm-code-review`
- `review`
- `bmad-bmm-correct-course`
- `bmad-bmm-qa-automate`
- `bmad-bmm-quick-dev`
- `bmad-bmm-quick-spec`

### Phase 5: Validate and Deliver

Goal: validate quality and prepare safe delivery.

Representative stages/tasks:

- sprint status
- readiness/status checks
- rollout checks
- release confidence

Representative process capabilities:

- `bmad-bmm-sprint-status`
- `status`
- `retro`

### Phase 6: Operate and Learn

Goal: learn from execution, evolve the system, absorb external leverage, and improve routing.

Representative stages/tasks:

- retrospective
- repo absorption
- capability evolution
- external module registration

Representative supportive capabilities:

- `absorb-repo`
- `register-skill-pack`
- `create-skill`
- `enhance-skill`
- `unique-advantage-evaluator`

## 3. Capability Funnel

The current repo has evolved beyond the old 4-type matrix. The recommended I-Wish funnel is:

| Capability Shape | Meaning | Typical Role | Required Action |
|---|---|---|---|
| `dynamic-context` | Always-on policy / iron law / core rule | Foundational | Register as always-on context and inject globally |
| `fragment` | Passive reusable standard or method | Foundational | Store in `/.agent/fragments/` and inject from workflows/skills/agents |
| `skill` | Callable specialized procedure/tool | Process or Supportive | Create `/.agent/skills/<name>/SKILL.md`, register in KG/catalog |
| `workflow` | Multi-step stateful process | Usually Process, sometimes Supportive | Create `/.agent/workflows/<name>.md` plus step files if needed |
| `agent` | Persona/role shell that owns decision scope and routes skills/workflows | Usually Process | Create `/.agent/agents/<name>.md` and define owned workflows/skills |
| `compound` | A higher-order bundle composed of multiple skills/workflows/agents | Usually Supportive or subsystem-level | Create generated capability package or module with explicit routing contract |
| `skill-attachment` | Supporting specialist skill injected into existing process, not a standalone mainline flow | Supportive | Create/patch a skill and wire it into existing workflows |
| `workflow-patch` | A narrow patch to an existing workflow, not a new top-level flow | Supportive | Route to `enhance-skill` with `patch` or `merge` recommendation |

## 4. Role Axis

Every capability should also be tagged by **role in the system**, independent of shape:

| Role | Meaning |
|---|---|
| `process-primary` | Directly executes a main stage/task in the delivery framework |
| `supportive` | Helps another capability perform better, safer, or faster |
| `foundational` | Injected rules, standards, or governance used across many capabilities |

This second axis is what was missing in the current inventory view.

Example:

- `bmad-bmm-create-prd` = `workflow` + `process-primary`
- `skill-design-consultation` = `skill` + `supportive`
- `ux-principles` fragment = `fragment` + `foundational`
- `ui-ux` specialist wrapper = `skill-attachment` + `supportive`
- `absorb-repo` = `workflow` + `supportive`

## 5. Recommended Orch Research Flow

When Orch receives a request, it should not start by asking “which skill do I use?”.

It should ask these questions in order:

1. Which **delivery phase** is this request in?
2. Which **stage/task** inside that phase is being attempted?
3. Which **process-primary capability** best owns that stage/task?
4. Which **supportive capabilities** improve success, reduce risk, or satisfy constraints?
5. Which **foundational injections** must be loaded before execution?

Retrieval order for Orch should be:

1. source-of-truth context
2. `routing-profile.yaml`
3. `integration-guide.md`
4. execution body (`SKILL.md`, workflow body, or agent body)

### Example

User says:

`UX có nhiều lỗi chưa tuân thủ master design`

Orch reasoning:

1. Phase = `Solution` or `Validate`, not raw implementation.
2. Stage/task = `UI compliance review`.
3. Primary owner = `make-ui-spec` or `review`, likely `ux-agent`.
4. Supportive capabilities = `design-consultation`, `ux-pro-max`, `stitch-design-taste`, `ux-guardian`.
5. Foundational injections = UX principles / design governance fragments / approved `DESIGN.md`.

So Orch should first route by framework stage, then enrich with skills.

## 6. Action Matrix by Funnel Output

| Funnel Result | Action |
|---|---|
| `dynamic-context` | Register as foundational context, not as a public command |
| `fragment` | Create fragment and inject into relevant capabilities |
| `skill` | Create `SKILL.md`, KG node, catalog entry, and trigger metadata |
| `workflow` | Create top-level workflow with step-file discipline when appropriate |
| `agent` | Create canonical function-first agent and map legacy aliases |
| `compound` | Create module/subsystem package; do not flatten into a single skill |
| `skill-attachment` | Patch supporting skill into existing process workflow |
| `workflow-patch` | Use `enhance-skill` patch/merge path, not a new public workflow |

## 7. Current Problems In The Repo

### Problem 1: Old funnel is too narrow

`step-w-01-triage.md` still mostly thinks in `skill / workflow / agent`.

### Problem 2: Missing role axis

Even when classification is correct, the system still does not clearly tell whether the capability is:

- process-primary
- supportive
- foundational

### Problem 3: Inventory mixes public and internal assets

Canonical user-facing commands, legacy wrappers, step files, templates, and support assets are still listed together too often.

### Problem 4: Orch can see capabilities, but not yet as a coherent delivery system

This is why the repo feels rich but hard to mentally assemble.

## 8. Recommended Next Normalization

1. Reframe inventory and graph around `phase -> stage/task -> primary process capability -> supportive capabilities -> foundational injections`.
2. Update classification workflow to produce both:
   - `shape`
   - `role`
3. Add metadata on each capability:
   - `framework_phase`
   - `framework_stage`
   - `role`
   - `input`
   - `process`
   - `output`
4. Treat `absorb-repo`, `create-skill`, `enhance-skill`, `clone-website`, `analyze-codebase`, and similar as supportive capabilities by default.
5. Keep fragments and always-on governance out of the public command surface.
6. Require an **adoption review pack** for absorbed repos, external modules, and newly created capabilities:
   - `.md` for governance and diffs
   - `.html` for reading, sharing, and user review
   - must include use cases, edge cases, stress cases, constraints, routing hints, and review questions
7. Require `routing-profile.yaml` for absorbed repos, external modules, and newly created capabilities so Orch has a machine-readable first-pass layer before opening long-form artifacts.

## 9. Bottom Line

The repo should be explained to users as:

- one **main delivery framework**
- many **stage-owned process capabilities**
- a **supportive capability layer** that assists those stages
- a **foundational injection layer** that keeps quality and governance intact

That is a much better operating model than presenting skills, workflows, and agents as one flat list.
