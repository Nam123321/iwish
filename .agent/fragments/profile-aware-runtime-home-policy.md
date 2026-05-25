# Profile-Aware Runtime Home Policy

Use this fragment when a workflow, policy, or story needs to decide where runtime-only HSEA artifacts belong.

## Core Rule

Use `${BMAD_HOME}` for runtime-only or mirror/export state.

Keep canonical repo assets, repo-local approved memory, and `_bmad/` runtime materialization in their existing project-local locations unless an explicit workflow says otherwise.

## Runtime Root Shape

Preferred HSEA-aware runtime path:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/
```

Recommended subtrees:

- `sandbox/`
- `absorbed-repos/`
- `generated-skills/`
- `generated-workflows/`
- `generated-agents/`
- `repo-dna/`
- `gap-analysis/`
- `evolution/`
- `runtime-config/`
- `graph-exports/`
- `reports/`

## What Stays Project-Local

- `.agent/`
- `templates/`
- `_bmad/`
- `.agent/memory/PROJECT.md`
- `.agent/memory/USER.md`
- `.agent/memory/learning-log.jsonl`
- `.agent/memory/instincts.jsonl`

## Promotion Rule

Generated drafts begin under `${BMAD_HOME}` and become canonical only after approval and validation.

## Mirror Rule

If a runtime decision needs persistence outside canonical repo files, mirror it under:

```text
${BMAD_HOME}/profiles/<profile-id>/projects/<project-slug>/runtime-config/
```

Use `sandbox/` under the same root for cloned or external-reference worktrees that should not bleed across projects.

## Isolation Rule

Do not mix runtime artifacts across different `profile-id` or `project-slug` values.
