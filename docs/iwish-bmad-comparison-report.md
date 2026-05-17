# I-Wish vs BMAD Method vs BMAD-DragonBall Report

Generated: 2026-05-15

## Scope

- Upstream baseline: BMAD Method original repo analyzed through absorbed DNA and gap-analysis artifacts.
- Historical baseline: BMAD-DragonBall before the I-Wish re-architecture, reconstructed from preserved runtime/workflow/agent surfaces in this repository.
- Current target: I-Wish as implemented in the current repository state.

## Executive Summary

- BMAD Method upstream is strongest at productized installation, declarative module metadata, native skill packaging, TOML customization overlays, and ecosystem distribution.
- BMAD-DragonBall before I-Wish was strongest at dense workflow coverage, persona-rich orchestration, repo absorption, project/domain guardrails, and extended packs for frontend, backend, ops, code intelligence, prompt engineering, AI, and marketing.
- I-Wish keeps the DragonBall content plane while replacing the canonical operating surface: new namespace, function-first routing, `create-skill`/`enhance-skill`, open module registration, source-of-truth aware Orch routing, tool profiles, and reverse-sync reconciliation work items.

## Pattern-by-Pattern Comparison

| Pattern | BMAD Method original | BMAD-DragonBall before | I-Wish current |
|---|---|---|---|
| Pattern 1: Config-driven module installation | Declarative install via `module.yaml`, installer CLI, channels, marketplace/community/custom source support | Mostly repo-local runtime materialization and template/wrapper based setup under `_bmad` | `iwish install/update/status/doctor/register-module`, `_iwish` substrate, declarative runtime templates, install targets `claude-code/codex/cursor` |
| Pattern 2: Native skill architecture | Native `SKILL.md` is the universal runtime unit across core and BMM modules | Mixed model: skills + workflow wrappers + agent markdown + templates + persona layers | Canonical package contract is `SKILL.md + DESIGN.md + customize.toml + metadata + lineage`; old wrappers kept as compatibility aliases |
| Pattern 3: Layered customization overlays | Strong TOML overlay model and custom module/config layering | Customization existed but was more repo/template centric and less declaratively isolated | Runtime keeps open-module metadata, custom roots, tool profiles, and prepares for non-fork overlays in `_iwish/custom` |
| Pattern 4: Lifecycle/domain workflow taxonomy | Clean split between `core-skills` and `bmm-skills`, phase-oriented lifecycle | Extremely rich workflow catalog with many specialized wrappers, packs, QA, UX, repo absorption, and day-2/ops flows | Keeps DragonBall’s wide workflow coverage but routes it through Orch-first and truth-aware command surfaces |
| Pattern 5: Step-file execution discipline | Explicit just-in-time step loading is a strong normalized standard | Step files existed in many important workflows but were not declared as a platform-level standard | Formalized as the I-Wish step-file standard and referenced by `create-skill` / `enhance-skill` |
| Pattern 6: Catalog/help routing | Catalog-driven navigation from manifests/CSV and module metadata | High workflow richness but heavier memory burden for users due to many slash/persona paths | Catalog entries now index canonical commands, aliases, tool adapters, and external modules; Orch routes from chat or slash |
| Pattern 7: Open tool ecosystem | Upstream is broad on harness/platform support but narrower on tool abstraction inside custom runtime choices | Many workflows implicitly touched external tools, but selection was less explicit and less standardized | Tool registry now exposes browser/design/graph adapter groups and project-scoped tool profile selection |
| Pattern 8: Reverse-waterfall source of truth | Mostly artifact-driven phase progression with guided handoffs | Strong story/epic/sprint culture already existed, but ad-hoc fix/code changes could still drift | Reconciliation now writes queue JSON, work-item markdown, and `_bmad-output/reconciliation` sidecars; routing is aware of story/epic matches |

## Implementation Mapping

### BMAD Method original

- Core structure: `src/core-skills` + `src/bmm-skills` + installer + docs site.
- Runtime center: installable skill directories, marketplace/community/custom modules, `_bmad` config/custom files.
- Inventory snapshot from absorbed clone: 44 skill entrypoints, 12 core skills, 32 BMM skills, 4 agent markdown files, 55 step files, 2 module manifests.
- Notable upstream additions from recent evolution: `bmad-prfaq`, `bmad-checkpoint-preview`, customization overlays, community module browser, channel management, wide harness support.

### BMAD-DragonBall before I-Wish

- Canonical namespace and branding: BMAD / BMAD-DragonBall / `_bmad`.
- Agent model: persona-first naming such as Vegeta, Piccolo, Whis, Grand-Priest, Android 18, Hit, Trunks, King-Kai, etc.
- Authoring model: `create-capability` / `enhance-capability`, heavy workflow wrapper catalog, template-centric delivery, local materialization scripts.
- Strength profile: repo absorption, governance fragments, UX simulation, quality guardians, domain-specific orchestration, and large pack ecosystem including day-2/ops concerns.
- Current repo inventory approximates that historical content plane: 18 active skills, roughly 19 persona-first/legacy agents before canonical function-first wrappers were added, and 203 workflows before the new short-form canonical wrappers were introduced.

### I-Wish current

- Canonical namespace and branding: I-Wish / `_iwish` / `IWISH_HOME`.
- Canonical agent surface is function-first, centered on `orch-agent`, `dev-agent`, `capability-agent`, `review-agent`, `ux-agent`, and delivery/product/data roles via alias mapping.
- Canonical authoring/evolution surface is `create-skill` / `enhance-skill`; `create-capability` / `enhance-capability` remain compatibility aliases.
- Canonical short workflow surface is now explicit: `/code`, `/make-story`, `/make-ui-spec`, `/review`, `/plan`, `/research`, `/retro`, `/status`, and `/register-skill-pack`.
- Runtime additions delivered in this implementation cycle:
  - `iwish route` with semantic + source-of-truth aware routing
  - `iwish reconcile-change` and `iwish reconcile-status`
  - `iwish truth-status`
  - `iwish inventory`
  - `iwish select-tool` / `show-tool-profile`
  - `iwish register-module` with open-module metadata

## Inventory Summary

| Surface | BMAD Method original | BMAD-DragonBall before | I-Wish current |
|---|---:|---:|---:|
| Skill entrypoints | 44 | 18 | 18 |
| Agent markdown files | 4 | ~19 persona-first agents | 35 total / 16 canonical function-first agents / 17 legacy persona agents / 2 transitional function agents |
| Workflow markdown files / wrappers | 99 (approx. skill+step surface) | 203 plus legacy naming | 214 total / 11 canonical short-form workflows / 56 legacy entrypoints / 107 step files / 14 templates / 14 support assets / 13 active non-canonical workflows |
| Module manifests | 2 | template/library pack driven | 4 canonical I-Wish runtime modules + 8 library packs |
| Tool adapter groups | harness/platform heavy, not modeled here as project-scoped adapters | implicit / workflow-specific | 3 groups / 9 adapters |
| Install targets | ~42 harnesses upstream | no canonical cross-harness installer | 3 |

## Current I-Wish / BMAD-DragonBall Content Inventory

### Canonical Agents (16)
- ai-agent
- analyst-agent
- architect-agent
- capability-agent
- creative-agent
- data-architect-agent
- delivery-manager-agent
- dev-agent
- devops-agent
- orch-agent
- pm-agent
- product-agent
- qa-agent
- research-agent
- review-agent
- ux-agent

### Canonical Workflows (11)
- code
- create-skill
- enhance-skill
- make-story
- make-ui-spec
- plan
- register-skill-pack
- research
- retro
- review
- status

### Skills (18)
- canary
- caveman-mode
- clone-website
- design-consultation
- export-pdf
- github-deep-research
- idea-hardening
- land-and-deploy
- navigator-guardian
- pivot-guardian
- qa-simulator-guardian
- repo-absorption
- security-guardian
- socratic-review
- ui-ux
- user-simulation-guardian
- ux-guardian
- visual-fidelity-gate

### Legacy Persona Agents (17)
- android-18
- bulma
- cell
- gotenks
- grand-priest
- hit
- king-kai
- krillin
- master-roshi
- piccolo
- quick-flow-solo-vegeta
- shenron
- songoku
- tien-shinhan
- trunks
- vegeta
- whis

### Transitional Function Agents (2)
- data-architect
- data-strategist

### Workflow Inventory Breakdown (214)

#### Legacy Workflow Entrypoints (56)
- Agent wrappers: `bmad-agent-bmm-*`, `bmad-agent-grand-priest`
- Workflow wrappers: `bmad-bmm-*`
- Legacy helper/editorial surfaces: `bmad-help`, `bmad-brainstorming`, `bmad-party-mode`, `bmad-index-docs`, `bmad-shard-doc`, `bmad-review-adversarial-general`, `bmad-editorial-review-*`
- Compatibility aliases: `create-capability`, `enhance-capability`

#### Active Non-Canonical Workflows (13)
- `absorb-repo`
- `analyze-codebase`
- `audit-ux-patterns`
- `codebase-health`
- `create-data-overview`
- `create-data-spec`
- `data-dependency-map`
- `fix-bug`
- `impact-analysis`
- `mkt-capture-pipeline`
- `prd-purpose`
- `research-project-modules`
- `simulate-user`

#### Workflow Step Files (107)
- Internal execution assets for long-form workflows such as `step-*`, `step-e-*`, `step-v-*`, `step-w-*`
- These are not canonical slash commands and do not all need renaming

#### Workflow Templates (14)
- Includes artifacts such as `prd-template`, `epics-template`, `ux-design-template`, `architecture-decision-template`, and related `.template` files

#### Workflow Support Assets (14)
- Includes internal helper assets such as `workflow-entry`, `workflow-*`, `instructions`, `full-scan-instructions`, `prototype`, and `checklist`

### Library Packs (8)
- ai-pack
  - skills (1): SKILL
  - workflows (6): bmad-agent-bmm-songoku, songoku, songoku-ai-review, songoku-ai-spec, songoku-cost-audit, songoku-eval
  - agents (1): songoku
- backend-pack
  - skills (1): SKILL
  - workflows (5): seed-data-audit, step-01-audit, step-01-validate, validate-schema, workflow
  - agents (0): none
- code-intelligence-pack
  - skills (0): none
  - workflows (1): analyze-codebase
  - agents (0): none
- devops-pack
  - skills (1): SKILL
  - workflows (2): optimize-all-docker, optimize-docker
  - agents (0): none
- frontend-pack
  - skills (1): SKILL
  - workflows (2): stitch-first-dev, stitch-to-code
  - agents (0): none
- marketing-pack
  - skills (0): none
  - workflows (3): checklist, mkt-execute, mkt-sync
  - agents (2): hercule, majin-buu
- ops-pack
  - skills (1): SKILL-devops
  - workflows (0): none
  - agents (0): none
- prompt-engineering-pack
  - skills (1): SKILL
  - workflows (0): none
  - agents (0): none

### Tool Adapters (3 groups)
- browser: playwright, chrome-devtools-mcp, browser-use
- design: figma, stitch, claude-design
- graph: falkordb-full, lite-static, custom-adapter

### Install Targets (3)
- claude-code
- codex
- cursor

## BMAD Method Original Inventory Snapshot

### Core Skills (12)
- bmad-advanced-elicitation
- bmad-brainstorming
- bmad-customize
- bmad-distillator
- bmad-editorial-review-prose
- bmad-editorial-review-structure
- bmad-help
- bmad-index-docs
- bmad-party-mode
- bmad-review-adversarial-general
- bmad-review-edge-case-hunter
- bmad-shard-doc

### BMM Skill Entry Points (32)
- bmm-skills/1-analysis/bmad-agent-analyst/SKILL.md
- bmm-skills/1-analysis/bmad-agent-tech-writer/SKILL.md
- bmm-skills/1-analysis/bmad-document-project/SKILL.md
- bmm-skills/1-analysis/bmad-prfaq/SKILL.md
- bmm-skills/1-analysis/bmad-product-brief/SKILL.md
- bmm-skills/1-analysis/research/bmad-domain-research/SKILL.md
- bmm-skills/1-analysis/research/bmad-market-research/SKILL.md
- bmm-skills/1-analysis/research/bmad-technical-research/SKILL.md
- bmm-skills/2-plan-workflows/bmad-agent-pm/SKILL.md
- bmm-skills/2-plan-workflows/bmad-agent-ux-designer/SKILL.md
- bmm-skills/2-plan-workflows/bmad-create-prd/SKILL.md
- bmm-skills/2-plan-workflows/bmad-create-ux-design/SKILL.md
- bmm-skills/2-plan-workflows/bmad-edit-prd/SKILL.md
- bmm-skills/2-plan-workflows/bmad-prd/SKILL.md
- bmm-skills/2-plan-workflows/bmad-validate-prd/SKILL.md
- bmm-skills/3-solutioning/bmad-agent-architect/SKILL.md
- bmm-skills/3-solutioning/bmad-check-implementation-readiness/SKILL.md
- bmm-skills/3-solutioning/bmad-create-architecture/SKILL.md
- bmm-skills/3-solutioning/bmad-create-epics-and-stories/SKILL.md
- bmm-skills/3-solutioning/bmad-generate-project-context/SKILL.md
- bmm-skills/4-implementation/bmad-agent-dev/SKILL.md
- bmm-skills/4-implementation/bmad-checkpoint-preview/SKILL.md
- bmm-skills/4-implementation/bmad-code-review/SKILL.md
- bmm-skills/4-implementation/bmad-correct-course/SKILL.md
- bmm-skills/4-implementation/bmad-create-story/SKILL.md
- bmm-skills/4-implementation/bmad-dev-story/SKILL.md
- bmm-skills/4-implementation/bmad-investigate/SKILL.md
- bmm-skills/4-implementation/bmad-qa-generate-e2e-tests/SKILL.md
- bmm-skills/4-implementation/bmad-quick-dev/SKILL.md
- bmm-skills/4-implementation/bmad-retrospective/SKILL.md
- bmm-skills/4-implementation/bmad-sprint-planning/SKILL.md
- bmm-skills/4-implementation/bmad-sprint-status/SKILL.md

### Agent Files (4)
- artifact-analyzer
- web-researcher
- distillate-compressor
- round-trip-reconstructor

## Delta Notes

- I-Wish does not shrink DragonBall’s content surface; it re-centers the operating model around an installable, routable, source-of-truth aware substrate.
- BMAD-DragonBall before and I-Wish current share most of the same domain content inventory, including day-2/ops, devops, QA, UX, repo absorption, and marketing/library packs.
- The largest difference between pre-I-Wish DragonBall and I-Wish is not content count but canonical execution model: branding, command surface, orchestration surface, runtime namespace, module registration, tool profile selection, and reverse-sync artifacts.
- The largest difference between I-Wish and BMAD Method original is that I-Wish remains much more open-ended and pack-rich, while upstream remains cleaner and more normalized as a distributable framework product.

## Primary Source Artifacts

- Upstream gap analysis: ../../../.bmad-dragonball/gap-analysis/BMAD-METHOD-gap-analysis.md
- Upstream DNA: ../../../.bmad-dragonball/repo-dna/BMAD-METHOD-dna.md
- Current runtime docs: docs/iwish-runtime-substrate.md
- Current routing/reconciliation docs: docs/iwish-routing-reconciliation.md
