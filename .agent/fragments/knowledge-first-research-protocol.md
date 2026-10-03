# Knowledge-First Research Protocol (UKP)

## Core Principle
All agents MUST adopt a "Knowledge-First" mindset. Before executing a task, designing an architecture, or answering a domain-specific question, you must check if the information already exists in the project's NotebookLM ecosystem.

## Execution Rules

1. **NotebookLM Before Web Search**: 
   - NEVER use general web search (`search_web` or `read_url_content`) for internal project context or previously researched topics.
   - ALWAYS route queries through the `/nlm-check` workflow or invoke the `ae-notebook-orchestrator` to query the relevant notebook first.

2. **Registry Lookup**:
   - Do not guess notebook IDs. Always read `_iwish-output/notebooks/notebook-registry.yaml` or use `resolve-notebook-targets.py` to identify the correct target notebooks for your query.
   - Follow the 4-Layer Knowledge Hierarchy:
     - **Layer 1**: Project Context (Idea & Planning)
     - **Layer 2**: External Research (Market, Competitors, APIs)
     - **Layer 3**: Execution (Technical implementation, Epics)
     - **Layer 4**: Adhoc (Short-term context)

3. **Fallback to External**:
   - If `ae-notebook-orchestrator` confirms the information is missing from the notebooks (Gap Detected), ONLY THEN are you authorized to perform external web research.
   - Once external research is complete, you MUST capture that new knowledge back into the appropriate Layer 2 or Layer 4 notebook to enrich the ecosystem.

4. **Zero-Hallucination Policy**:
   - Do not rely on your internal LLM weights for project-specific business rules, design tokens, or architectural decisions. Rely strictly on the UKP.
