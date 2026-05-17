# I-Wish

I-Wish is an AI-assisted product delivery system with:

- a canonical CLI
- installable runtime scaffolding
- Orch-first routing
- reusable workflows, agents, and skills
- shim-first compatibility for legacy BMAD surfaces

It is designed to help teams move from idea to delivery through a structured but open orchestration model.

## Install

Global install:

```bash
npm install -g iwish
```

One-off usage with `npx`:

```bash
npx iwish install
```

Legacy compatibility remains available:

```bash
npx bmad-db init
```

## Core CLI

```bash
iwish install
iwish update
iwish status
iwish doctor
iwish route "research trên github các giải pháp cho bài toán này"
iwish register-module <source>
iwish select-tool graph falkordb-full
```

When `--platform` is omitted, the CLI will ask which install target(s) you want to use. The prompt accepts target names or numeric choices separated by commas.

Use `iwish list-install-targets` to inspect the current support matrix and planned adapter stories.

## Current Install Target Support

Officially supported today:

- `claude-code`
- `codex`
- `cursor`
- `windsurf`
- `opencode`
- `google antigravity`

Planned adapter expansion:
- additional platform adapters can be added through follow-up install-target stories

## Main Workflows

Canonical user-facing workflows include:

- `/idea-challenge`
- `/plan`
- `/make-story`
- `/make-ui-spec`
- `/code`
- `/review`
- `/research`
- `/pivot-project`
- `/bootstrap-existing-project`
- `/research-solution-sources`

## Packaging Model

The published package includes:

- `dist/` CLI runtime
- `templates/` runtime and module templates
- `.agent/` canonical workflows, agents, and skills
- `docs/` core I-Wish documentation

This is intentional: the CLI depends on local workflow/template assets at runtime.

## Recommended Reading

- [I-Wish Introduction Guide](./docs/iwish-introduction.md)
- [I-Wish Runtime Substrate](./docs/iwish-runtime-substrate.md)
- [I-Wish Capability System Framework](./docs/iwish-capability-system-framework.md)
- [I-Wish Routing Profile Standard](./docs/iwish-routing-profile-standard.md)
- [I-Wish Routing and Reconciliation](./docs/iwish-routing-reconciliation.md)
- [I-Wish Brownfield Bootstrap](./docs/iwish-brownfield-bootstrap.md)

## Current Status

I-Wish is already usable as a local CLI/runtime, but public packaging and GitHub launch should still follow an explicit release checklist.

See:

- [GitHub Launch Plan](./docs/iwish-github-launch-plan.md)

## License

ISC
