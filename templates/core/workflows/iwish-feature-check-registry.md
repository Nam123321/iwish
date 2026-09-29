---
name: 'check-registry'
description: 'Checks the I-Wish registry for consistency across slash commands, workflows, and skills.'
disable-model-invocation: true
---

# Command Registry Consistency Check

This workflow acts as a linter for the I-Wish system. It scans `.agent/` and `_iwish/` directories to ensure that all registered slash commands (via `name:` in YAML frontmatter or standard YAML) are unique, and that all references to commands (e.g., `@[/check-registry]`) or explicitly linked files map to valid, existing paths.

## Execution
Run the following command to check registry consistency:

```bash
node .agent/scripts/check-registry-consistency.js
```

If the command fails (exit code 1), it means there are broken references or duplicate slash commands in the registry. Review the console output and fix the flagged issues.
