---
description: 'Audit token usage and cost per AI feature — identify waste and optimization opportunities'
---

# Songoku Cost Audit Workflow

// turbo-all

## Prerequisites
- Deployed AI features with usage data, or story files with AI specs
- Architecture document with LLM tier pricing

## Steps

1. **Load AI Cost Optimizer SKILL**
   - Read `{project-root}/.agent/skills/ai-cost-optimizer/SKILL.md`

2. **Inventory AI Features**
   - List all AI features from `ai-feature-map.md`
   - Cross-reference with sprint-status.yaml for development status
   - Identify which features are deployed vs planned

3. **For Each Deployed Feature, Collect:**
   - Model tier used (T1-T6)
   - Actual token usage (input + output)
   - Number of queries per day
   - Cache hit rate (if implemented)
   - Actual cost per query
   - Actual monthly cost

4. **For Each Planned Feature, Estimate:**
   - Apply Feature Cost Template from AI Cost Optimizer SKILL
   - Calculate projected monthly cost
   - Compare with overall AI budget allocation

5. **Run Cost Audit Checklist**
   - Execute 10-point cost audit checklist from SKILL
   - Flag anti-patterns found (table from SKILL)

6. **Generate Cost Report**
   ```markdown
   ## AI Cost Audit Report — {date}
   
   ### Summary
   | Metric | Value |
   |--------|-------|
   | Total Monthly AI Cost | ${actual or projected} |
   | Cost per Tenant/Month | ${value} |
   | Most Expensive Feature | {name} — ${cost} |
   | Total Token Usage | {number} tokens/day |
   | Avg Cache Hit Rate | {%} |
   
   ### Feature-by-Feature Breakdown
   | Feature | Tier | Queries/Day | Cost/Query | Monthly | Optimizable? |
   
   ### Optimization Opportunities
   | Opportunity | Feature | Current Cost | Projected | Savings |
   
   ### Anti-Patterns Found
   | Pattern | Feature | Impact | Fix |
   
   ### Recommendations
   1. {Prioritized recommendation}
   2. {etc.}
   ```

7. **Save Report**
   - Save to `{output_folder}/ai-specs/cost-audit-{date}.md`

8. **Present to User**
   - Display top 3 optimization opportunities
   - Flag any features exceeding budget threshold
   - Recommend immediate actions
