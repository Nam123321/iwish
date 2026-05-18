---
story_id: "STORY-SIM-1.9"
epic_id: "EPIC-SIM-01"
title: "Tool Setup Onboarding and Early Graph Backend Selection"
status: "COMPLETED"
assignee: "orch-agent"
priority: "HIGH"
phase: "forge"
---

# Story 1.9: Tool Setup Onboarding and Early Graph Backend Selection

## 1. Objective

Ensure that a freshly installed I-Wish runtime can:

1. ask for graph selection early during onboarding
2. explain the recommended default and alternatives
3. prompt for missing tool groups at the moment a workflow actually needs them
4. expose a reusable mechanism so Orch can ask the user to choose a default option or a custom alternative

## 2. Problem Statement

The system already had a tool registry and a `select-tool` command, but it did not yet provide a strong onboarding path for:

- early graph backend choice
- missing-tool prompts during workflow execution
- clear user options between default packs and custom tool adoption

This created a gap between “tool registry exists” and “user can confidently start a project with the right orchestration context”.

## 3. Scope

### In scope

- ask for graph backend selection as part of initial runtime setup
- define a baseline `tool-setup-status` surface
- enrich route decisions with tool setup prompts
- research and document two additional graph options beyond `falkordb-full`
- persist graph selection into runtime graph profile

### Out of scope

- full production connector setup for every supported graph backend
- automatic installation of third-party graph infrastructure
- full UI wizard for all tools

## 4. Acceptance Criteria

### AC1: Graph is asked early

- runtime install output explicitly tells the user that graph setup is required
- install output shows the recommended default and the available alternatives

### AC2: Route-time prompting exists

- Orch route output can surface missing required tool groups when a workflow depends on them
- the prompt includes:
  - reason
  - recommended option
  - current selection
  - known options
  - custom option path

### AC3: Graph options are documented

- the system documents:
  - `falkordb-full`
  - `neo4j`
  - `memgraph`
  - `lite-static`
  - `custom-adapter`

### AC4: Selection is persisted

- `iwish select-tool graph <adapter>` writes the graph profile selection
- graph surface layout is recorded for later Orch research

### AC5: Source-of-truth is updated

- this story exists in `_iwish-output/iwish-skills/stories/`
- sprint status includes the story

## 5. Tasks

- [x] Add baseline tool setup prompt model
- [x] Add `tool-setup-status` CLI command
- [x] Add route-time tool setup prompt rendering
- [x] Make graph backend setup explicit during install
- [x] Add graph profile persistence on selection
- [x] Research and document `neo4j` and `memgraph`
- [x] Update sprint/source-of-truth artifacts

## 6. Notes

- Graph setup is treated as a baseline onboarding concern because Orch relies on graph-backed reasoning across:
  - codebasegraph
  - featuregraph
  - knowledgegraph
  - skillgraph
  - memorygraph
- Other tool groups are prompted lazily at workflow time when they are actually required.

## 7. Definition of Done

- [x] Early graph guidance exists
- [x] Route-time prompting exists
- [x] Graph options are documented
- [x] Selection persists to runtime graph profile
- [x] Story and sprint updated
