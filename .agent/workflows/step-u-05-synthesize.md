# Step U-05: Synthesize

## Purpose
Compile all findings into actionable report. Optionally invoke Artifact Smith for interactive output.

## Steps
1. Read all findings from Knowledge Bus (`unknowns-ledger.yaml` and `macro-risks.yaml`).
2. Group by:
   - Quadrant (UU/KU/UK/KK distribution)
   - Severity (critical/high/medium/low)
   - Phase origin (which phase produced the finding)
3. Generate `_iwish-output/unknowns/reports/unknowns-report-{context}.md`:
   - Executive Summary (1 paragraph)
   - Quadrant Distribution Chart (mermaid)
   - Top 5 Critical Findings (with evidence + recommendations)
   - Macro Risk Dashboard (confidence scores for all tracked assumptions)
   - Micro Findings Table (FMEA style with RPN)
   - Recommended Actions (prioritized list)
4. If `depth=full` or user requests → invoke Artifact Smith (`invoke_subagent` for Artifact Smith) to generate interactive HTML version.
5. Append synthesis metadata to `unknowns-ledger.yaml`.

## Exit Criteria
- [ ] Report generated at `_iwish-output/unknowns/reports/unknowns-report-{context}.md`
- [ ] Key findings presented to user
- [ ] Recommendations actionable (linked to specific workflows like `/make-story`, `/correct-course`)

Next, proceed to `step-u-06-cascade-check.md` if running full/bridge scope, otherwise execution completes.
