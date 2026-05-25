---
description: 'Review AI feature spec before development — prompt, model selection, cost estimate, security audit'
---

# Songoku AI Review Workflow

// turbo-all

## Prerequisites
- Story file or AI feature spec available
- Architecture document with LLM Strategy accessible

## Steps

1. **Load Required Skills**
   - Load Prompt Engineering Guardian from `{project-root}/.agent/skills/prompt-engineering-guardian/SKILL.md`
   - Load AI Cost Optimizer from `{project-root}/.agent/skills/ai-cost-optimizer/SKILL.md`

2. **Load Story Context**
   - Read the story file containing AI feature requirements
   - Read architecture.md LLM Strategy section for available tiers
   - Read ai-feature-map.md for the feature's AI role (Supporter/Advisor/Supervisor/Primary)

3. **Prompt Design Review**
   - Review prompt template against P-01 through P-07 rules
   - Check 6-section structure (Role/Context/Task/Constraints/Format/Examples)
   - Verify XML tag usage for multi-provider compatibility
   - Run OWASP LLM security checklist (all 5 mandatory checks)
   - Score prompt: ⭐ 1-5 rating

4. **Model Selection Validation**
   - Apply Model Selection Decision Tree
   - Verify cost-appropriate tier is assigned
   - Check if model cascade is applicable
   - Calculate cost-per-query estimate

5. **Token Budget Assessment**
   - Estimate input tokens (system + context + user input)
   - Estimate output tokens per task type
   - Calculate monthly cost projection
   - Verify max_tokens is set and appropriate

6. **Caching & Optimization**
   - Evaluate if semantic caching applicable
   - Check context pruning opportunities
   - Assess batch processing eligibility
   - Calculate potential savings with optimization

7. **RAG Pipeline Check** (if applicable)
   - Review chunking strategy
   - Verify retrieval method (vector/hybrid)
   - Check re-ranking implementation
   - Validate Cognee ontology definition

8. **Security Review**
   - Run OWASP LLM Top 10 compliance check
   - Verify input sanitization
   - Check output validation
   - Validate tenant isolation in AI data

9. **Generate Review Report**
   - Save to `{output_folder}/ai-specs/reviews/{story-id}-ai-review.md`
   - Include: scores, cost projection, issues found, recommendations
   - Alert on any ❌ findings that block development

10. **Present to User**
    - Display summary with rating
    - Highlight blocking issues
    - Recommend next actions
