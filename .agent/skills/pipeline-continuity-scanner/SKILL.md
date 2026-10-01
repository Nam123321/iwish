---
name: pipeline-continuity-scanner
description: Evaluates pipeline integrity against codebase and graphs using AST and UADRG tools.
---

# 🔎 Pipeline Continuity Scanner Skill

This skill is designed to act as the primary operational wrapper for the underlying scripts that detect pipeline fragmentation within Cowok.ai's architecture.

## Responsibilities

When tasked with running pipeline continuity checks, you MUST use the following deterministic scripts. Never rely on LLM intuition to evaluate code data flows.

1. **UADRG Discovery**
   Map the current state of cross-dependencies by invoking the graph builder on the target.
   ```bash
   python3 .agent/scripts/uadrg/graph-builder.py --target <story_or_epic_id>
   ```

2. **AST Data Flow Validation**
   Cross-reference physical Prisma logic and routing against documented specifications (e.g., `data-spec.md`).
   ```bash
   python3 .agent/scripts/validate-data-flow-contracts.py --target <story_or_epic_id>
   ```
   *Note: Ensure the codebase is not being actively modified during this scan. The script will handle warnings for dynamic paths safely.*

3. **Watchmen Report Signing**
   Take the findings from the AST scan and produce a human-readable **Pipeline Fragmentation Report**. You MUST then invoke the signing daemon to guarantee zero-trust integrity.
   ```bash
   python3 .agent/scripts/mcp-signing-daemon.py --sign-artifact <path_to_report.md>
   ```

## Post-Execution Guardrails

- **Zero-Trust Compliance:** The fragmentation report MUST contain the OOB cryptographic signature.
- **SDLC Route:** The ultimate recommendation for resolving gaps MUST be `/refactor-story` + standard `/flow` to enforce manual QA and PR reviews. Bypassing human oversight with `/flow-auto-approve` is structurally prohibited.
