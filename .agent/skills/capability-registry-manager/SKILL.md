---
name: capability-registry-manager
description: Manages zero-friction, multi-platform registration of skills and workflows
  across Antigravity, Cursor, Roo, Cline, Windsurf, Claude Code, Codex, and I-Wish.
---
# Capability Registry Manager (Multi-Platform Slash Command & Registry Hub)

## Overview
Whenever a new workflow (`.agent/workflows/*.md`) or skill (`.agent/skills/*/SKILL.md`) is authored, refactored, or enhanced, this skill guarantees that the slash command and capability are synchronously registered across all supported platforms without manual fragmentation or worktree amnesia.

## Supported Multi-Platform Targets (10+ Units)
1. **Google Antigravity & Gemini Workspace**: YAML frontmatter validation & `.agents/rules/*.mdc` instruction generation.
2. **I-Wish Unified Workflow Engine**: Materialization of `_iwish/delivery/workflows/4-implementation/{name}/workflow.yaml`.
3. **I-Wish Catalog & Aliases**: Auto-injection into `_iwish/catalog/alias-registry.yaml` and `_iwish/runtime/manifest.json`.
4. **I-Wish Knowledge Graph**: Atomically locked upsert in `.agent/knowledge-graph.yaml`.
5. **Dynamic Routing Engine**: Generation of `.agent/workflows/{name}.routing-profile.yaml` with triggers and phases.
6. **Cursor IDE**: Generation of `.cursor/rules/{name}.mdc` and `.cursorrules` compatibility.
7. **Roo Code / Cline**: Synchronization of `.clinerules` and `.roomodes`.
8. **Claude Code / Anthropic**: Registration in `CLAUDE.md` and `.claude/commands/`.
9. **OpenAI Codex / Custom GPTs**: Registration in `.openai/actions/` and instructions.
10. **Localization (i18n)**: Insertion of command tooltips in `.agent/templates/locales/vi.yaml` and `en.yaml`.
11. **Git Worktree Propagation**: Atomic file synchronization across all active worktrees.

## Execution

To register any capability across all platforms with a single command:
```bash
python3 .agent/skills/capability-registry-manager/scripts/register-capability-multiplatform.py \
  --name "<capability_name>" \
  --type "<workflow|skill>" \
  --file "<relative_path_to_markdown>" \
  --description "<description>" \
  --triggers "<trigger1,trigger2,...>" \
  --phases "<solution,implementation,validate>" \
  --primary-agents "<orch-agent,dev-agent>"
```

## Integration with `/skill`
Step 4 of `/skill` and Step W-04 of `/create-skill` / `/enhance-skill` MUST automatically execute `register-capability-multiplatform.py` as a mandatory finalization gate.
