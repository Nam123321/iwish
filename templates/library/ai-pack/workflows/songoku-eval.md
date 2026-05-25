---
description: 'Run AI accuracy benchmarks, hallucination detection, and regression tests for deployed AI features'
---

# Songoku AI Eval Workflow

// turbo-all

## Prerequisites
- Deployed AI feature with accessible API endpoints, or prompt templates with golden tests
- Architecture document with evaluation criteria

## Steps

1. **Load Required Context**
   - Read Prompt Engineering Guardian SKILL for evaluation criteria
   - Read the AI feature's prompt template and golden tests
   - Load the story's acceptance criteria for AI accuracy targets

2. **Identify Evaluation Type**
   | Feature Type | Eval Method |
   |-------------|-------------|
   | Classification | Accuracy, Precision, Recall, F1 |
   | Extraction (NLP) | Exact Match, Partial Match, F1 |
   | Chat/Generation | LLM-as-Judge, Human eval |
   | Summarization | ROUGE, BERTScore, Faithfulness |
   | RAG pipeline | Retrieval Precision@k, Recall@k, NDCG |
   | Recommendation | Hit Rate, MRR, NDCG |

3. **Prepare Test Dataset**
   - Load golden tests from `src/modules/ai/prompts/{feature}/golden-tests.json`
   - If no golden tests exist, generate from business rules + edge cases
   - Minimum: 20 test cases per feature (10 happy path, 5 edge cases, 5 adversarial)

4. **Run Accuracy Evaluation**
   - Execute each test case against the AI feature
   - Compare output vs expected output
   - Calculate metrics per evaluation type
   - Record: pass/fail, confidence score, latency, token usage

5. **Run Hallucination Detection**
   - For each generated output:
     a. **Faithfulness Check**: Does the output match provided context?
     b. **NLI Contradiction Score**: Does the output contradict itself?
     c. **Factual Grounding**: Are all claims supported by source data?
   - Rate each output: ✅ Grounded | ⚠️ Partially grounded | ❌ Hallucinated

6. **Run Security/Adversarial Tests**
   - Test prompt injection attempts (5 standard payloads)
   - Test PII handling (input with phone/email → should be handled)
   - Test out-of-scope queries (should get graceful refusal)
   - Test system prompt extraction attempt

7. **Run Regression Tests**
   - Compare current results with previous golden test run
   - Flag any accuracy degradation > 2%
   - Flag any latency regression > 20%
   - Flag any cost increase > 15%

8. **Generate Evaluation Report**
   ```markdown
   ## AI Evaluation Report: {Feature Name}
   
   ### Overall Score
   | Metric | Target | Actual | Status |
   |--------|--------|--------|--------|
   | Accuracy | >{X}% | {Y}% | ✅/❌ |
   | Hallucination Rate | <5% | {Y}% | ✅/❌ |
   | Avg Latency | <{X}ms | {Y}ms | ✅/❌ |
   | Avg Cost/Query | <${X} | ${Y} | ✅/❌ |
   | Security Tests | 5/5 pass | {X}/5 | ✅/❌ |
   
   ### Test Results Breakdown
   | Test ID | Input | Expected | Actual | Match | Latency | Tokens |
   
   ### Hallucination Analysis
   | Output # | Faithfulness | NLI Score | Grounding | Status |
   
   ### Regression Comparison
   | Metric | Previous | Current | Delta | Status |
   
   ### Recommendations
   1. {action items based on findings}
   ```

9. **Save Report**
   - Save to `{output_folder}/ai-specs/eval/{feature-name}-eval-{date}.md`
   - Update golden tests if new edge cases discovered

10. **Present to User**
    - Display overall pass/fail status
    - Highlight critical failures
    - Recommend: deploy / fix / re-evaluate
