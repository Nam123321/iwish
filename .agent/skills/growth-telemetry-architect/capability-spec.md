# Capability Spec: growth-telemetry-architect

## Type: SKILL
## Status: Draft
## Created: 2026-07-01

### Problem Statement
The I-Wish Orchestrator needs an automated way to generate Marketing Tracking Plans (telemetry schema) from PRD definitions for platforms like PostHog or Amplitude without manual data mapping.

### Knowledge Sources
- Source 1: `/Users/hatrang20061988/Desktop/AI Project/iwish/_iwish-output/stories/story-24.4.md` — Story definition and Edge Case rules for telemetry generation.

### Core Concepts
1. **Telemetry Schema Generation**: Analyzes PRDs to identify critical conversion events and North Star metrics.
2. **Naming Convention Enforcement**: Enforces Object Action structured naming.
3. **Structured Output**: Produces valid JSON/YAML telemetry schemas.
4. **Platform Specific Rules**: Adapts casing (e.g., PostHog `snake_case` vs Amplitude `Title Case`).

### Anti-Patterns
- ❌ Hallucinating metrics if they are absent from the PRD.
- ❌ Outputting trailing markdown blocks when strict JSON/YAML is expected.
- ❌ Crashing on massive PRDs exceeding token context limits.

### Best Practices
- ✅ Explicitly instruct the LLM to halt and ask for clarification if metrics are missing.
- ✅ Implement regex or prompt-constrained structured outputs to enforce JSON/YAML.
- ✅ Pre-calculate tokens and fail gracefully on oversized specs.
- ✅ Isolate platform-specific rules dynamically based on target platform.

### Deliverables
- [x] File 1: `.agent/skills/growth-telemetry-architect/SKILL.md`
