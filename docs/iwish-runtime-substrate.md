# I-Wish Runtime Substrate

## Purpose

This document defines the first concrete implementation slice of the I-Wish re-architecture.

## Canonical Names

- Product: `I-Wish`
- Namespace: `iwish`
- Runtime root: `_iwish/`
- Runtime home env: `IWISH_HOME`

## Compatibility Shims

- `_bmad/` remains readable as a legacy runtime surface.
- `BMAD_HOME` remains accepted as an input alias for the canonical `IWISH_HOME`.
- Legacy agent names and slash commands resolve through `templates/iwish/runtime/catalog/alias-registry.yaml`.

## Installed Runtime Shape

```text
_iwish/
  core/
    module.yaml
    runtime-map.yaml
  catalog/
    alias-registry.yaml
    official-modules.yaml
    external-modules/
  custom/
  graphs/
    graph-profile.yaml
  runtime/
    manifest.json
    install-targets/
  tools/
    tool-registry.yaml
```

## CLI

Canonical commands:

- `iwish install`
- `iwish update`
- `iwish status`
- `iwish doctor`
- `iwish list-install-targets`
- `iwish list-modules`
- `iwish list-tools`
- `iwish register-module`

Compatibility aliases:

- `bmad-db init` -> `iwish install`
- `bmad-db add` -> `iwish register-module`

## Current Install Targets

Officially supported:

- `claude-code`
- `local-terminal`
- `cursor`
- `windsurf`
- `opencode`
- `google antigravity`

When `--platform` is omitted on install/update, the CLI should ask the user which target(s) to scaffold instead of silently assuming a default target. The prompt accepts target names or numeric choices separated by commas.

Use `iwish list-install-targets` to review supported vs planned adapter surfaces.

Planned adapters:
- additional platform adapters should be tracked as install-target stories until they have runtime materialization rules

## Capability Packaging

I-Wish package scaffolding now includes:

- `SKILL.md`
- `DESIGN.md`
- `customize.toml`
- `metadata.yaml`
- `lineage.jsonl`
- `promotion-plan.md`

`DESIGN.md` is the canonical place for routing contract, graph touchpoints, tool dependencies, degraded-mode behavior, and self-improvement notes.
