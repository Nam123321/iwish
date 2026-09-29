---
name: spec-stack-auditor
description: "LLM-based semantic scanner for Markdown documents (Epic, PRD) to validate conceptual architecture against the tech stack."
inputs: [document_path]
outputs: [audit_report]
---

# Specification Tech Stack Auditor

## Goal
Audit conceptual architecture decisions within specification documents (like PRDs, Epics) against the established tech stack and best practices.

## Execution Rules (Native LLM Evaluation)
Since we are operating natively within the agent environment, you must use your internal reasoning to read the specified markdown document and evaluate its architectural integrity. You do not need an external execution engine.

## Audit Checklist
1. **Tech Stack Consistency:** Does the document introduce new technologies, libraries, or architectural patterns (e.g., Vector RAG, MCP, AST compiler) that are not part of the standard project stack?
2. **Feasibility:** Are the proposed technical approaches feasible within the current system constraints?
3. **Redundancy:** Does the document propose building something from scratch that already exists in the shared libraries or core platform?
4. **Integration Risks:** Are there implicit integration challenges or unsupported protocols required by the proposed design?

## Output Format
Generate a report highlighting any findings, categorized by Severity (Critical, High, Medium, Low). 
If a finding represents a macro-risk, format it so it can be added to the `macro-risks.yaml` register.
