# Capability Spec: dependency-governance-enforcer

## Type: SKILL
## Status: Draft
## Created: 2026-08-01

### Problem Statement
Projects frequently suffer from operational overload due to mixed package managers, unconstrained peer dependencies causing resolution conflicts, and undocumented ownership of structural package files. This capability automates the enforcement of dependency hygiene and governance.

### Core Concepts
1. **Single Package Manager Rule**: Only one resolution system can be active to guarantee determinism.
2. **Peer Dependency Pinning**: Unbounded peer dependencies (`*` or `>=`) cause cascade failures in monorepos and downstream consumers.
3. **Structural Ownership**: Package manifests dictate architecture and must be owned by designated teams in `CODEOWNERS`.

### Anti-Patterns
- ❌ Allowing `npm install` in a `yarn` project, creating a rogue `package-lock.json`.
- ❌ Using `*` for a peer dependency version.
- ❌ Modifying root `package.json` without review from the platform team.

### Deliverables
- [x] File 1: `.agent/skills/dependency-governance-enforcer/SKILL.md`
- [x] File 2: `metadata.yaml`
