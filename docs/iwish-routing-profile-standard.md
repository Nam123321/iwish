# I-Wish Routing Profile Standard

Generated: 2026-05-16

## Purpose

`routing-profile.yaml` is the **machine-readable first-pass source** Orch should consult before opening:

- `integration-guide.md`
- `integration-guide.html`
- `SKILL.md`
- workflow bodies
- agent bodies

This keeps Orch routing cheaper in tokens and more consistent.

## Required Placement

- skill package:
  - `.agent/skills/<name>/routing-profile.yaml`
- workflow:
  - `.agent/workflows/<name>.routing-profile.yaml`
- agent:
  - `.agent/agents/<name>.routing-profile.yaml`
- external module:
  - `_iwish/catalog/routing-profiles/<name>.yaml`

## Required Fields

```yaml
id: skill-html-anything
name: html-anything
kind: external-module
shape: compound
role: supportive
phases:
  - deliver
stages:
  - stakeholder-communication
triggers:
  - html
  - shareable guide
anti_triggers:
  - raw backend patch
primary_agents:
  - orch-agent
primary_workflows:
  - review
supportive_skills: []
tool_dependencies: []
constraints:
  - keep external until promoted
review_pack: docs/open-modules/html-anything-integration-guide.md
source_path: _iwish/catalog/external-modules/html-anything.json
story_refs:
  - story-1.7
tags:
  - open-module
  - artifact
```

## Orch Research Order

When Orch receives a request:

1. Read source-of-truth context:
   - story/epic/sprint/reconciliation
2. Read candidate `routing-profile.yaml`
3. Open the matching `integration-guide.md` only if deeper judgment is needed
4. Open `SKILL.md` or workflow/agent body only for the shortlisted path

## Why This Exists

Without routing profiles, Orch has to infer too much from:

- filenames
- heuristic keyword matching
- full-body workflow scans

That costs more tokens and increases routing noise.

## Governance Rule

Any new or materially changed:

- skill
- workflow
- agent
- absorbed repo
- external module

SHOULD create or update a routing profile together with its review pack.
