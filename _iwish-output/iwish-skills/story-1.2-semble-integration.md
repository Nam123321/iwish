# Story 1.2: Context-Aware Story Chunk Injector

**Epic:** Epic 1: Semble Retrieval Skill & Story Reading
**Story Title:** Context-Aware Story Chunk Injector
**Goal:** Write a script that extracts key concepts from a story file, queries Semble for the most relevant code chunks, and formats them as injectable markdown context blocks for the dev-agent's prompt.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. Complete flow:
1. **Input**: Story markdown file (e.g., `story-X.Y-*.md`)
2. **Processing**: NLP-lite concept extraction from AC and tasks
3. **Query**: Semble search with extracted concepts
4. **Output**: Formatted markdown code blocks ready for prompt injection

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a story file path, **When** the injector runs, **Then** it extracts key concepts from the story's Acceptance Criteria, Goal, and Task descriptions using regex/keyword extraction.
- **AC2:** **Given** extracted concepts, **When** queried against Semble, **Then** it retrieves the top-k (default=5) most relevant code chunks from the project codebase.
- **AC3:** **Given** retrieved chunks, **When** formatting for prompt injection, **Then** output is structured as fenced markdown code blocks with file path headers, line ranges, and relevance scores.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 0 → 0
3. **UI Surface:** 0 → 0
4. **Cross-Domain:** 1 (Depends on Story 1.1 semble-search) → 0
5. **Flow Complexity:** 1 (Extract → Query → Format pipeline) → 0
6. **Test Burden:** 1 → 0
**Complexity Score (CS):** 0 (✅ OK)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | Concept Extraction | Task 1: Implement `extract_concepts()` parsing story markdown for keywords. | ✅ Mapped |
| AC2 | Semble Query | Task 2: Call `semble-search` skill with extracted concepts. | ✅ Mapped |
| AC3 | Prompt Formatting | Task 3: Format results as injectable markdown context. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Purpose**: Reduces agent hallucination by grounding dev-agent prompts with REAL code context from the working codebase.
- **Token Efficiency**: Only top-k chunks are injected, keeping prompt size manageable while maximizing relevance.
- **Dependency**: Requires Story 1.1 `semble-search` skill to be functional.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification |
|---|---|---|
| Functional Correctness | 9 | Straightforward extract-query-format pipeline. |
| Data Integrity & State | 9 | Stateless; reads story file, queries semble, outputs markdown. |
| Security & Validation | 9 | No external network; local file operations only. |
| Performance & Scalability | 8 | Bounded by semble search speed (~1-3s per query). |
| Error Handling & Recovery | 9 | Falls back to empty context with warning if semble unavailable. |
| Architectural Depth & Leverage | 9 | Enables smarter dev-agent prompts across all future stories. |
| UX Empathy | 9 | Transparent to dev-agent; context appears naturally in prompt. |

**TOTAL AVERAGE: 8.86/10 (PASS)**

---

**Status:** `DONE`
**Depends On:** Story 1.1
