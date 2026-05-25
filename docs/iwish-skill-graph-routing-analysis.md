# I-Wish Skill Graph and Orch Routing Analysis

Generated: 2026-05-15

## Purpose

This report answers three questions:

1. How are skills currently indexed and connected?
2. Which skills are routable, tactical, foundational, or missing from the graph?
3. How can the skill graph improve Orch semantic routing?

## Current Skill Graph Snapshot

- Root skill packages under `.agent/skills`: `18`
- Routing profiles seeded for Orch-first research: `27`
- Indexed in `.agent/knowledge-graph.yaml`: `14`
- Library-pack skills discovered: `6`
- Workflow capabilities discovered: `80`
- Total capability surface currently visible to Orch inventory: `104`
- Unindexed root skills: `6`
- Indexed orphan skills: `0`
- Tactical root skills: `6`
- Routable root skills: `3`
- Foundational root skills: `5`

## Unindexed Skills

These exist under `.agent/skills/` but are not currently represented in the knowledge graph:

- `export-pdf`
- `idea-hardening`
- `navigator-guardian`
- `socratic-review`
- `ui-ux`
- `visual-fidelity-gate`

### Implication

These are still semantic-routing blind spots at the root skill-package layer unless a workflow or agent references them by path manually.

## Workflow-Shaped Capability Coverage

The earlier `18-skill` number was too narrow. Orch does not operate only over package skills. It also needs workflow-shaped capabilities.

Current workflow capability coverage now includes:

- Canonical commands: `11`
- Legacy workflow entrypoints: `56`
- Active non-canonical workflows: `13`
- Total workflow capabilities indexed for capability analysis: `80`

This includes inherited BMAD Method style surfaces such as:

- Analysis: `bmad-brainstorming`, `bmad-bmm-market-research`, `bmad-bmm-domain-research`, `bmad-bmm-technical-research`, `bmad-bmm-generate-project-context`, `bmad-bmm-document-project`
- Planning: `bmad-bmm-create-prd`, `bmad-bmm-create-product-brief`, `bmad-bmm-edit-prd`, `bmad-bmm-validate-prd`, `plan`, `make-story`
- Solutioning: `bmad-bmm-create-architecture`, `bmad-bmm-create-epics-and-stories`, `bmad-bmm-create-ui-spec`, `bmad-bmm-create-ux-design`, `bmad-bmm-check-implementation-readiness`
- Implementation: `bmad-bmm-dev-story`, `bmad-bmm-code-review`, `bmad-bmm-correct-course`, `bmad-bmm-qa-automate`, `bmad-bmm-quick-dev`, `bmad-bmm-quick-spec`, `fix-bug`, `code`

## Indexed Skill Classification

### Routable Skills

These are broad, entry-oriented skills that can plausibly be surfaced directly by Orch:

- `skill-repo-absorption`
- `skill-security-guardian`
- `skill-github-deep-research`

### Tactical Skills

These are usually invoked inside a workflow or by a specialist agent as a gate, tactic, or subroutine:

- `skill-clone-website`
- `skill-pivot-guardian`
- `skill-user-simulation-guardian`
- `skill-qa-simulator-guardian`
- `skill-canary`
- `skill-caveman-mode`

### Foundational Skills

These act like reusable dependency layers for other skills or review systems:

- `skill-stitch-design-taste`
- `skill-ux-guardian`
- `skill-design-consultation`
- `skill-land-and-deploy`
- `skill-ux-pro-max`

## What The Current Graph Already Tells Us

### Direct dependency chains

- `skill-repo-absorption` depends on `skill-security-guardian`
- `skill-design-consultation` depends on `skill-stitch-design-taste` and `skill-ux-guardian`
- `skill-land-and-deploy` depends on `skill-canary`
- `skill-ux-pro-max` depends on `skill-ux-guardian`, `skill-design-consultation`, `skill-stitch-design-taste`, and `skill-user-simulation-guardian`

### Workflow-to-skill edges already visible

- `bmad-bmm-create-ui-spec` calls `skill-design-consultation`
- `bmad-bmm-dev-story` and `fix-bug` call `skill-pivot-guardian`
- `simulate-user` and `workflow-entry` call `skill-user-simulation-guardian`
- `bmad-bmm-code-review` calls `skill-qa-simulator-guardian`
- `bmad-party-mode` and `bmad-bmm-sprint-status` call `skill-canary` and `skill-land-and-deploy`

### Agent-to-skill edges already visible

- `cell`, `piccolo`, and `vegeta` call `skill-clone-website`
- `songoku`, `piccolo`, and `gotenks` call `skill-github-deep-research`
- `songoku` calls `skill-user-simulation-guardian`
- `songoku` and `vegeta` call `skill-caveman-mode`

## Why This Helps Orch Routing

The current graph is already enough to improve Orch in three ways:

1. **Phase-aware suggestion**
   Orch can tell whether a skill is likely a direct entrypoint or a tactical subroutine.

2. **Dependency-aware suggestion**
   If Orch selects `design-consultation`, it can also infer likely follow-up checks from `ux-guardian` and `stitch-design-taste`.

3. **Role-aware dispatch**
   If a skill is repeatedly called by a specialist agent, Orch can recommend the agent and not just the skill.

4. **Cheaper first-pass retrieval**
   Orch can consult `routing-profile.yaml` before opening long-form review packs or execution bodies.

## Where The Current Graph Is Still Weak

### 1. Missing skills are invisible

`socratic-review`, `visual-fidelity-gate`, and `navigator-guardian` are strategically important but unindexed.

### 2. Edge types are implicit

Today we can infer:

- workflow calls skill
- agent calls skill
- skill depends on skill

But the graph does not explicitly label:

- `required gate`
- `optional tactic`
- `fallback skill`
- `review-only skill`
- `delivery-only skill`

### 3. Orch does not yet reason over multi-intent skill plans

The graph can support this, but the current Orch runtime still relies on heuristic-first route selection.

## Recommended Skill Graph Upgrades

### Priority 1

- Index all missing skills into `.agent/knowledge-graph.yaml`
- Add canonical workflow nodes for:
  - `/code`
  - `/make-story`
  - `/make-ui-spec`
  - `/review`
  - `/plan`
  - `/research`
  - `/retro`
  - `/status`
  - `/register-skill-pack`

### Priority 2

Add explicit edge semantics:

- `CALLS_REQUIRED`
- `CALLS_OPTIONAL`
- `DEPENDS_ON`
- `RECOMMENDED_BY_AGENT`
- `USED_FOR_PHASE`
- `USED_FOR_DOMAIN`

### Priority 3

Add routing metadata to skill nodes:

- `entrypoint: true|false`
- `tactic: true|false`
- `phase: analysis|planning|implementation|review|ops`
- `domains: ui|qa|repo|deployment|research|architecture`
- `agent_owner`

## Open 2 Design: Open Customization Module Workflow

For Open 2, the current design path is:

1. User brings an external source: repo URL, local path, or skill pack.
2. Orch routes to `/register-skill-pack`.
3. If it is a repo, `/absorb-repo` performs trust/security + structure analysis first.
4. The payload is classified as:
   - skill pack
   - workflow pack
   - agent pack
   - tool adapter pack
   - hybrid repo
5. It is normalized into I-Wish package contract.
6. `iwish register-module` stores the external module as a first-class runtime record with triggers and tool dependencies.
7. Orch and the catalog can discover it later through semantic routing.

This is intentionally open and not tied to a closed marketplace.

## Orch Simulation

### User message

`Tôi cần fix story-1.6, nhưng trước khi code hãy review scope và xem có skill external nào từ Superpower nên dùng không.`

### Ideal Orch reasoning sequence

1. Detect `story-1.6` as a source-of-truth match.
2. Detect mixed intent:
   - review scope
   - implementation follow-up
   - external skill/module consideration
3. Orch should not collapse this into one single workflow immediately.
4. Orch should produce a staged execution proposal:
   - Step A: `review-agent` for scope/risk review of `story-1.6`
   - Step B: `capability-agent` with `/register-skill-pack` if a Superpower pack needs intake
   - Step C: `dev-agent` with `/code` once scope and tool/module fit are clear
5. Orch should also recommend relevant tactical/foundational skills from the graph:
   - `skill-github-deep-research` if external open-source reference is needed
   - `skill-pivot-guardian` if implementation scope broadens
   - `skill-qa-simulator-guardian` if the story is high risk before ship

### What the current runtime does

The current heuristic runtime tends to overweight explicit `review` language. That means mixed-intent requests can still route too early toward `/review`.

### What this shows

The skill graph is already useful, but Orch needs a second-stage planner:

- first detect **multi-intent**
- then build a **sequence of agent/skill/workflow recommendations**
- then bind them to source-of-truth entities such as story, epic, and reconciliation scope

## Conclusion

Yes, the skill graph can materially improve semantic routing for Orch.

The biggest unlock is not just adding more nodes. It is:

- indexing missing skills
- labeling tactic vs entrypoint vs foundational roles
- adding explicit edge semantics
- letting Orch produce staged plans for mixed-intent requests instead of one-shot routing
