---
name: universal-project-evaluator
description: Evaluates any project or idea using the Universal Project Evaluation Framework (combining MICRGL meta-structure and CEO mental models).
tags: [business-economics, ceo-agent, project-strategy, market-research]
---

# Universal Project Evaluator

This skill orchestrates the evaluation of a business project, idea, or market report. It prevents superficial analysis by enforcing the rigorous standards defined in `universal-evaluation-framework.md`. 

Use this skill during the `product-strategy` phase, or when `research-agent` is tasked with evaluating a new market, competitor, or idea.

## Prerequisites
- You MUST have read `_iwish-output/2. Product Planning/templates/universal-evaluation-framework.md`.

## The 4-Phase Evaluation Workflow

### Phase 1: Knowledge Extraction & Triangulation
Do not accept surface-level data. You must extract and triangulate.
1. **Source Vetting:** Before querying, identify your sources. Apply the **Data Integrity Standards** (Primary vs Secondary, Conflict of Interest, Temporal Validity). Reject outdated or heavily biased vendor reports unless triangulated.
2. **NotebookLM Querying:** If using `notebook-request-engineer` and NotebookLM, you MUST push the following prompt schema to extract the baseline data:
   > "Analyze the source documents. Extract the complete Value Chain. Identify the Margin Pool distribution across this chain. Calculate the Value-Uplift Multiplier (output value / input cost). Identify the primary Capex/Opex barriers to entry. Note: If the source lacks data to answer this, explicitly state 'Insufficient Data'."

### Phase 2: The CEO-Level Stress Test
Once data is extracted, apply the `/ceo-agent` mental models.
1. **Strategic Viability:** Evaluate if the project is 0-to-1 (Thiel) or disruptive (Christensen). Does it target an overserved or underserved market?
2. **Margin Pool Capture:** Evaluate if the proposed project sits at the "Choke Point" of the industry (capturing >40% of value). If not, why is it viable?
3. **Pre-Mortem Risk:** Apply Munger's Inversion. Identify the top 3 single-points-of-failure that would kill this project in 3 years.
4. **Scope Discipline:** Apply "Reduction Mode". What is the absolute bare-metal MVP? What must be explicitly excluded to prevent bloat?

### Phase 3: Synthesis & Verdict
Synthesize the findings into a structured report.
The report MUST contain:
1. **Executive Verdict (GO / NO-GO / PIVOT)**
2. **The Value Mechanics (Chain, Pool, Uplift)**
3. **The Moat & Pre-Mortem**
4. **The Bare-Metal MVP**
5. **Source Quality Confidence Score (1-10)**

### Phase 4: Output & Quality Gate
- If this skill is invoked as a Quality Gate for an existing PRD or Strategy, output the findings and explicitly list any "Failures" (e.g., "Failure: Margin Pool is < 20%, project is a commodity trap").
- If this skill is invoked for Research, output the report as a markdown artifact and inject it into the appropriate I-Wish Planning directory.
