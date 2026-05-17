# BMAD Public Runtime Policy

## Purpose

BMAD-DragonBall is both a working development system and a public distribution. Keep these two spaces separate:

- **Canonical repo assets** are files intended to ship in GitHub packages.
- **Runtime user artifacts** are generated while a user runs BMAD locally and must stay outside the canonical repo unless explicitly promoted.

## Runtime Home

All generated, downloaded, cloned, or temporary artifacts MUST use:

```bash
BMAD_HOME=${BMAD_HOME:-~/.bmad-dragonball}
```

Standard runtime layout:

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
          runtime-config/
          graph-exports/
          reports/
```

The previous hidden sandbox directory is deprecated. Existing local installs may migrate its contents to `${BMAD_HOME}/sandbox`, but canonical BMAD docs, workflows, stories, and templates must not introduce new references to the legacy path.

For HSEA-aware runtime policy, prefer the profile/project-aware form above. Existing references to `${BMAD_HOME}/generated-*`, `${BMAD_HOME}/repo-dna/`, `${BMAD_HOME}/gap-analysis/`, or `${BMAD_HOME}/absorbed-repos/` remain valid as shorthand for the active project's runtime root when the profile/project context is already known.

## Canonical Assets

The following repo paths are canonical and may be shipped publicly:

```text
.agent/agents/
.agent/skills/
.agent/workflows/
.agent/fragments/
.agent/templates/
templates/
docs/
```

Generated assets MUST NOT be written directly to these paths until a human or approved agent explicitly promotes them.

Project-local runtime materialization under `_bmad/` and repo-local approved memory under `.agent/memory/` are also distinct from `${BMAD_HOME}` runtime artifacts and remain governed by their own policies.

## Generated Capability Lifecycle

Skills, workflows, agents, fragments, or compound capabilities created by workflows such as `/absorb-repo` or `/create-skill` follow this lifecycle:

```text
draft -> approved -> promoted -> validated
```

Draft locations:

```text
${BMAD_HOME}/generated-skills/<id>/
${BMAD_HOME}/generated-workflows/<id>/
${BMAD_HOME}/generated-agents/<id>/
```

Each draft MUST include a `metadata.yaml` file:

```yaml
id: ui-ux
type: skill
status: draft
origin: absorb-repo
origin_repo: https://github.com/example/source-repo
created_at: "2026-05-09"
source_artifacts:
  - repo-dna
  - gap-analysis
promotion_target: .agent/skills/ui-ux
path_policy: runtime
```

Promotion means:

1. Copy or move the approved asset into the canonical repo path.
2. Register it in `.agent/knowledge-graph.yaml` via `.agent/scripts/add-to-kg.sh`.
3. Run `.agent/scripts/validate-kg.sh`.
4. Run `.agent/scripts/validate-portability.sh`.
5. Sync the matching `templates/` file only when the capability is intended to ship publicly.

## Path Hygiene

Canonical assets MUST use repo-relative paths, `{project-root}`, or `${BMAD_HOME}`. They MUST NOT contain user-specific or machine-specific paths:

Forbidden path families include user-home absolute paths, local `file:` URLs into user homes, machine-specific desktop workspace paths, and the deprecated hidden sandbox path.

Use `.agent/scripts/validate-portability.sh` before completing any story that modifies agents, skills, workflows, templates, docs, or committed BMAD output.
