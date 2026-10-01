---
name: "dependency-governance"
description: "Use when you need to validate lockfiles, check dependency scope, enforce runtime constraints across services, or audit service ownership boundaries."
inputs: ["target_dir"]
outputs: ["compliance_report.json"]
mcp_tools_required: []
subagent_triggers: []
---

# Dependency Governance

## When to Use This Skill
- When checking out a new service to verify its dependencies.
- When `package.json`, `Cargo.toml`, `requirements.txt`, or lockfiles are modified.
- When enforcing or verifying service ownership boundaries.

## Core Rules
1. **Breadth Check**: Enforce that a service does not pull in dependencies outside its functional domain.
2. **Lockfile Consistency**: Automatically detect if a lockfile is out of sync with its manifest file.
3. **Runtime Constraints**: Validate that runtime dependencies match the target production environment limits.
4. **Service Ownership**: Validate `CODEOWNERS` or metadata manifests to ensure the service has explicit owners mapped.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | Lockfile Sync | A | Lockfile vs Manifest diff | `view_file` on lockfile/manifest |
| GATE-2  | Ownership Check | A | `CODEOWNERS` parsing | `grep_search` on `CODEOWNERS` |
| GATE-3  | Scope Validation | B | Semantic evaluation of dep domains | Agent reasoning output |
