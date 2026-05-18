---
story_id: "STORY-SIM-1.8"
epic_id: "EPIC-SIM-01"
title: "Open Tool Usage Pack and Design Platform Generalization"
status: "COMPLETED"
assignee: "Vegeta"
priority: "HIGH"
phase: "forge"
---

# Story 1.8: Open Tool Usage Pack and Design Platform Generalization

## 1. Objective

Move I-Wish from:

```text
Tool Adapter only
```

to:

```text
Tool Adapter + Usage Skill Pack + Routing Registration
```

with a special focus on design platforms:

- Stitch
- Figma
- Claude Design

## 2. Problem Statement

The current system already has a tool registry for:

- browser
- design
- graph

But a tool adapter entry alone does not make a tool actually usable by Orch in a real workflow.

Examples:

- `stitch` had deeper workflow support via `stitch-first-dev` and `stitch-to-code`
- `figma` and `claude-design` existed only as registry entries, without equivalent usage-pack scaffolding
- the visual validation gate still carried Stitch-specific naming/history (`stitch-design-taste`) even though the desired behavior should be design-platform-agnostic

## 3. Scope

### In scope

- define a standard for Open Tool Usage Packs
- add a dedicated workflow for building new tool usage packs
- scaffold default design usage-pack skeletons for:
  - Stitch
  - Figma
  - Claude Design
- clarify that `visual-fidelity-gate` is the canonical generic gate
- update sprint/source-of-truth tracking

### Out of scope

- full connector-specific execution for Figma
- full connector-specific execution for Claude Design
- migrating every current workflow off Stitch-specific assumptions in one pass

## 4. Acceptance Criteria

### AC1: Standard exists

- `docs/iwish-open-tool-usage-pack-standard.md` defines:
  - adapter + usage pack model
  - tool-family expectations
  - intake rules for new tools

### AC2: Dedicated workflow exists

- `create-tool-usage-pack` exists and describes how to:
  - research a tool
  - design the usage pack
  - scaffold workflows/skills
  - register them into Orch-facing routing

### AC3: Default design skeletons exist

- the repo contains default usage-pack workflow skeletons for:
  - `figma-first-dev`
  - `figma-to-code`
  - `claude-design-first-dev`
  - `claude-design-to-code`

### AC4: Generic gate direction is explicit

- the system direction explicitly treats `visual-fidelity-gate` as the canonical generic validation gate
- Stitch-specific naming is recognized as legacy or specialized rather than universal

### AC5: Source-of-truth is updated

- story exists in `_iwish-output/iwish-skills/stories/`
- sprint status includes the story

## 5. Tasks

- [x] Define Open Tool Usage Pack standard
- [x] Add `create-tool-usage-pack` workflow
- [x] Add routing profile for `create-tool-usage-pack`
- [x] Scaffold default design usage-pack workflows for Figma
- [x] Scaffold default design usage-pack workflows for Claude Design
- [x] Record the generalized direction for design-platform support
- [x] Update sprint/source-of-truth artifacts

## 6. Notes

- Open Tool support should never stop at “adapter exists”.
- A tool is only orchestration-ready when the corresponding usage pack exists.
- This pattern should later extend to browser and graph tools as well.

## 7. Definition of Done

- [x] Standard exists
- [x] Workflow exists
- [x] Default design skeletons exist
- [x] Story and sprint updated
