# Capability Spec: project-drift-detector

## Type: SKILL
## Status: Draft
## Created: 2026-08-01

### Problem Statement
Automatically scans project documentation and compares it against codebase artifacts and git history to identify inconsistencies in story statuses and architectural drift.

### Core Concepts
1. Documentation parsing
2. Codebase static analysis
3. Git history alignment

### Anti-Patterns
- ❌ Relying solely on git history without checking documentation.

### Best Practices  
- ✅ Use static analysis tools to verify actual codebase state against documented specifications.

### Deliverables
- [x] File 1: `.agent/skills/project-drift-detector/SKILL.md`
