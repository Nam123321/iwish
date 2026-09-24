---
name: "dependency-governance-enforcer"
description: "Use when reviewing PRs, managing repo configurations, or fixing dependency drift to enforce single lockfile, pin peer dependencies, and update CODEOWNERS."
inputs:
  - "Target repository path"
outputs:
  - "Validation report and fixed lockfiles/CODEOWNERS"
mcp_tools_required: []
subagent_triggers: []
---

# Dependency Governance Enforcer

## When to Use This Skill
- A pull request introduces a new lockfile or modifies dependency structures.
- A user asks to clean up package managers (e.g., mixing npm, yarn, pnpm).
- Peer dependency warnings need to be resolved.
- CODEOWNERS needs to be updated to map to package manifest changes.

## Core Rules
1. **Single Lockfile Enforcement:** NEVER allow multiple lockfiles (e.g., both `package-lock.json` and `yarn.lock`) in the same project directory. Identify the primary package manager (based on `package.json` engines/packageManager or existing lockfile presence) and remove others.
2. **Peer Dependency Constraints:** Peer dependencies MUST be pinned with exact versions or strictly bounded ranges (`^` or `~`) to prevent unexpected runtime collisions across consumer workspaces.
3. **CODEOWNERS Alignment:** Any package manifest (`package.json`, `lerna.json`, `pnpm-workspace.yaml`) MUST have an explicit owner defined in `.github/CODEOWNERS`.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| DEP-01  | Single Lockfile Check | Category A (Deterministic) | File existence check (`find . -name "*-lock*"`) | File paths printed to output |
| DEP-02  | Peer Dep Range Validation | Category A (Deterministic) | Regex parsing of `peerDependencies` in `package.json` | Parsed package.json output |
| DEP-03  | CODEOWNERS Coverage | Category A (Deterministic) | String matching manifests to `.github/CODEOWNERS` | CODEOWNERS diff |

## Industry Standards & Best Practices
- **Strict Mode:** For monorepos, use the `packageManager` field in `package.json` to strictly enforce the tool (e.g., `"packageManager": "pnpm@9.0.0"`).
- **Corepack:** Enable Node.js `corepack` to ensure the correct package manager version is seamlessly used by all developers.

## Boilerplate / Snippets
To scan for duplicate lockfiles:
```bash
find . -maxdepth 3 -type f \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" -o -name "bun.lockb" \)
```

To enforce CODEOWNERS for all manifests:
```text
# .github/CODEOWNERS
**/package.json @my-org/platform-team
**/pnpm-workspace.yaml @my-org/platform-team
```
