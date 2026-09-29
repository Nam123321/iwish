# Step U-06: Cascade Check

## Purpose
Evaluate if any findings trigger cascade actions.

## Steps
1. Check all macro assumptions with `confidence < 0.5`:
   - Present to user with evidence
   - Ask: "Investigate further (re-run with deeper tools)?" or "Accept risk?" or "Trigger course correction?"
2. Check all macro assumptions with `confidence < 0.3`:
   - AUTO-ESCALATE: "⚠️ MACRO-{ID} critically undermined. Dependent stories: [list]. Recommend: `/pivot-project`"
   - Block: Add `blocked_by: MACRO-{ID}` to dependent story frontmatter
3. If cascade triggered:
   - Route to `/reconcile-change` (for structural sync)
   - Route to `/correct-course` or `/pivot-project` (based on severity)
   - Update sprint-status via proper workflow (NOT direct file edit)
4. If no cascade needed:
   - Log: "Unknowns scan completed. No cascade required."
   - Offer: "Run `/unknowns` again after next sprint for confidence recalibration"

## Exit Criteria
- [ ] All threshold-breach findings addressed
- [ ] Cascade routing executed (if triggered)
- [ ] User informed of results
- [ ] Cascade verification logic executes (if cascade triggered)
