---
description: 'Generate comprehensive AI specification for a story — prompt design, model selection, cost model, eval criteria, security'
---

# Songoku AI Spec Workflow

// turbo-all

## Prerequisites
- Story file with AI feature requirements
- Architecture document with LLM Strategy and Cognee/Mem0 integration

## Steps

1. **Load Required Skills and Context**
   - Load Prompt Engineering Guardian SKILL
   - Load AI Cost Optimizer SKILL
   - Read the story file
   - Read architecture.md AI sections (LLM Strategy, Cognee, Mem0)
   - Read ai-feature-map.md for this feature's AI role and principles

2. **Extract AI Requirements from Story**
   - What task does the AI perform?
   - What user role triggers it? (Client Admin, NVBH, Customer)
   - What platform? (Admin Portal, Sales App, Webstore)
   - What AI role? (Supporter, Advisor, Supervisor, Primary)
   - What input data does AI receive?
   - What output does AI produce?
   - What accuracy is acceptable?
   - What latency is acceptable?

3. **Design Prompt Template**
   - Follow 6-section structure from Prompt Engineering Guardian
   - Use XML tags for provider compatibility
   - Include defensive prompting against injection
   - Include PII handling instructions
   - Create initial zero-shot version
   - Estimate token count (input + output)

4. **Select Model Tier**
   - Apply Decision Tree from AI Cost Optimizer
   - Start with cheapest viable tier (TOKEN-02 principle)
   - Document justification if not using T1
   - Consider cascade strategy if applicable

5. **Design RAG Pipeline** (if feature uses retrieval)
   - Define data sources for retrieval
   - Choose chunking strategy (semantic preferred)
   - Select embedding model and dimension
   - Define retrieval method (vector/hybrid)
   - Design re-ranking approach
   - Specify Cognee ontology if using GraphRAG

6. **Design Memory Integration** (if feature uses memory)
   - Mem0: Define session context to store/recall
   - Cognee: Define knowledge to ingest/query
   - Set retention policies per memory type
   - Ensure tenant isolation

7. **Calculate Cost Model**
   - Fill Feature Cost Template from AI Cost Optimizer
   - Project monthly cost at scale
   - Identify caching opportunities
   - Set cost alerts

8. **Define Evaluation Criteria**
   - Set accuracy target (percentage)
   - Set hallucination rate target (<5%)
   - Set latency target
   - Create initial golden tests (minimum 10)
   - Define A/B test plan for prompt optimization

9. **Security Specification**
   - Input validation rules
   - Output sanitization rules
   - PII handling rules
   - Rate limiting configuration
   - Tenant isolation verification

10. **Generate AI Spec Document**
    ```markdown
    # AI Specification: {Story ID} — {Feature Name}
    
    ## Overview
    | Field | Value |
    |-------|-------|
    | Story | {ID} |
    | AI Role | Supporter/Advisor/Supervisor/Primary |
    | Platform | Admin/Sales/Webstore |
    | User Role | {role} |
    | Trigger | {how AI is activated} |
    
    ## Prompt Template
    - Version: v1.0.0
    - Location: `src/modules/ai/prompts/{feature}/system.v1.0.0.md`
    - Input tokens: ~{N}
    - Output tokens: ~{N}
    {prompt template}
    
    ## Model Selection
    | Tier | Provider | Justification |
    | Cascade | Yes/No | Strategy: {description} |
    
    ## Cost Model
    {Feature Cost Template from AI Cost Optimizer}
    
    ## RAG Pipeline (if applicable)
    | Component | Choice | Rationale |
    
    ## Memory Integration (if applicable)
    | Layer | Usage | Retention |
    
    ## Evaluation Criteria
    | Metric | Target |
    
    ## Security
    | OWASP Risk | Mitigation |
    
    ## Golden Tests
    {initial test cases}
    ```

11. **Save and Present**
    - Save to `{output_folder}/ai-specs/{story-id}-ai-spec.md`
    - Present to user for review
    - Flag any decisions requiring user input
