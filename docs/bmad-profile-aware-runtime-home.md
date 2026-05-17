# BMAD Profile-Aware Runtime Home

## Purpose

BMAD uses `${BMAD_HOME}` for runtime-only artifacts that should not be written directly into canonical repo paths.

HSEA adds more runtime state than the original RAP/public-runtime policy covered:

- generated candidate capabilities
- absorbed repo evidence
- evolution fixtures and scorecards
- runtime graph-profile mirrors
- exportable graph/runtime state
- sandboxed external references

This document defines how those artifacts stay isolated by profile and project without weakening the boundary between:

- canonical repo assets
- project-local runtime materialization under `_bmad/`
- repo-local project memory
- `${BMAD_HOME}` runtime-only or mirrored state

## Base Runtime Home

BMAD runtime home starts from:

```bash
BMAD_HOME=${BMAD_HOME:-~/.bmad-dragonball}
```

## Profile-Aware Layout

Use this runtime layout for HSEA-aware runtime artifacts:

```text
${BMAD_HOME}/
  profiles/
    <profile-id>/
      shared/
        cache/
        logs/
        registry/
      projects/
        <project-slug>/
          sandbox/
          absorbed-repos/
          generated-skills/
          generated-workflows/
          generated-agents/
          repo-dna/
          gap-analysis/
          evolution/
            candidates/
            fixtures/
            scorecards/
            holdouts/
          runtime-config/
          graph-exports/
          reports/
```

## Required Path Variables

- `profile-id`
  - stable runtime profile label
  - default: `default`
  - examples: `default`, `client-a`, `internal-rnd`

- `project-slug`
  - filesystem-safe identifier for the active BMAD project
  - default recommendation: repository or project slug in lowercase kebab-case

Example:

```text
${BMAD_HOME}/profiles/default/projects/bmad-dragonball/
```

## What Belongs Under `${BMAD_HOME}`

Use `${BMAD_HOME}` for runtime-only or mirror/export state such as:

- sandboxed external references and clones
- absorbed repo analysis artifacts
- draft generated skills/workflows/agents before promotion
- repo DNA and gap analysis artifacts produced by absorption workflows
- evolution-lab candidates, fixtures, holdouts, and scorecards
- runtime config mirrors
- graph export/import bundles
- temporary or resumable reports that should survive across sessions without becoming canonical repo assets

## What Does Not Move Under `${BMAD_HOME}`

These remain repo-local or project-local:

### Canonical Repo Assets

- `.agent/`
- `templates/`
- `docs/`
- committed `_bmad-output/`

### Project-Local Runtime Materialization

- `_bmad/`

`_bmad/` is the project-local workflow runtime materialization surface. It is not replaced by `${BMAD_HOME}`.

### Repo-Local Approved Memory

- `.agent/memory/PROJECT.md`
- `.agent/memory/USER.md`
- `.agent/memory/learning-log.jsonl`
- `.agent/memory/instincts.jsonl`

Those remain in the project/worktree because they are part of the project's governed memory contract, not generic cross-project runtime storage.

## Canonical vs Mirror Rule

If an artifact has an approved canonical home in the repo, that canonical home remains authoritative.

`${BMAD_HOME}` may hold:

- drafts
- exports
- mirrors
- resumable runtime state

But `${BMAD_HOME}` does not silently replace canonical repo paths.

Examples:

- graph profile decision may be mirrored under `${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/runtime-config/graph-profile.yaml`
- but the authoritative project-level decision still belongs in project config or project memory per the graph policy

## Promotion Boundary

Draft capability promotion still follows the runtime-to-canonical path:

```text
${BMAD_HOME}/generated-* -> approval -> canonical repo target -> validation
```

For HSEA-aware paths, the more specific profile-aware form is:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/generated-* -> approval -> canonical repo target -> validation
```

## Graph and Runtime Mirrors

When a project-level runtime decision needs a filesystem location outside canonical repo files, use:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/runtime-config/
```

Recommended files:

```text
graph-profile.yaml
runtime-home-metadata.yaml
materialization-status.yaml
```

Graph export/import bundles should live under:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/graph-exports/
```

Sandboxed clones or external references should live under:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/sandbox/
```

## Evolution and Trial Outputs

Store evolution artifacts under:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/evolution/
```

Suggested subtrees:

- `candidates/`
- `fixtures/`
- `scorecards/`
- `holdouts/`

## Isolation Rules

### Profile Isolation

Different `profile-id` values must not share project runtime trees unless explicitly copied or exported.

### Project Isolation

Different `project-slug` values must not share:

- generated drafts
- graph exports
- evolution candidates
- runtime config mirrors
- repo absorption artifacts

### Shared Profile State

Only low-risk shared runtime items belong in:

```text
${BMAD_HOME}/profiles/<profile-id>/shared/
```

Examples:

- logs
- cache
- registry

Do not place project-sensitive candidate outputs in `shared/`.

## Portability Rules

Canonical docs, stories, templates, and workflow instructions must reference:

- `${BMAD_HOME}`
- repo-relative paths
- `{project-root}`

They must not reference user-specific absolute paths.

## Related Assets

- `docs/bmad-public-runtime-policy.md`
- `docs/bmad-workflow-runtime-materialization.md`
- `docs/bmad-graph-backend-selection.md`
- `.agent/fragments/profile-aware-runtime-home-policy.md`
- `.agent/fragments/graph-backend-selection-policy.md`
