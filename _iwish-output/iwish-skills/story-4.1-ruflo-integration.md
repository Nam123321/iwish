# Story 4.1: TDD London Fragment Document (`tdd-london-principles`)

**Epic:** Epic 4: TDD London School Fragment
**Story Title:** Create TDD London Principles Knowledge Fragment
**Goal:** Author a comprehensive fragment document that teaches LLM agents the principles and patterns of London School TDD (mockist approach) with practical Vitest/Jest examples, and register it in the knowledge graph.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story delivers a complete vertical slice:
1. **Content Layer**: Creating the fragment document (`tdd-london-principles.md`) with Double-Lock directive, principles, examples, and anti-patterns.
2. **Registry Layer**: Patching `knowledge-graph.yaml` so the fragment is discoverable by agent engines and auto-loaded when mock-heavy tests are being written.
3. **Governance Layer**: The Double-Lock instruction enforces agents to read this fragment before producing mock-heavy test code.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** the fragment file exists at `draft-rules/tdd-london-principles.md`, **When** an agent reads it, **Then** it must contain clear guidelines on mocks, stubs, and spies with London School TDD principles (Outside-In, Mock Dependencies, Test Behavior Not Implementation).
- **AC2:** **Given** the fragment's examples section, **When** reviewed, **Then** it must provide at least 3 practical mock-writing scenarios using Vitest/Jest: (1) mocking an API service call, (2) stubbing a database repository, (3) using spies to verify event emission.
- **AC3:** **Given** the knowledge graph registry, **When** `knowledge-graph-patch-tdd.yaml` is applied, **Then** this fragment is registered with correct metadata (name, path, trigger_condition, priority).

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (No frontend UI; purely documentation) → 0
4. **Cross-Domain:** 0 (No) → 0
5. **Flow Complexity:** 0 (Static document creation) → 0
6. **Test Burden:** 0 (Document content; no runtime tests needed) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Fragment with London TDD principles | Task 1: Create `draft-rules/tdd-london-principles.md` with Double-Lock directive, core principles, and test-double taxonomy (mock vs stub vs spy). | ✅ Done |
| AC2 | 3+ practical mock scenarios | Task 2: Author three code examples inside the fragment: API mock, DB stub, event spy. | ✅ Done |
| AC3 | Knowledge graph registration | Task 3: Create `knowledge-graph-patch-tdd.yaml` with fragment metadata. | ✅ Done |

---

## 💬 5. Socratic Review Synthesis Summary
- **Structure**: The fragment is a standalone Markdown file with YAML frontmatter, stored under `draft-rules/` for consistency with existing fragments like `ux-guardian-anti-slop.md`. It is self-contained (~200 lines).
- **Activation Mode**: Double-Lock — agents are forced to `view_file` this fragment before writing any mock-heavy test code. The trigger condition in the knowledge graph ensures automatic routing.
- **Why London School?**: London School TDD (mockist) is the dominant pattern for I-Wish's service-layer testing because the system is heavily composed of collaborator objects (API clients, repositories, event buses). Classical TDD would require spinning up real dependencies, which is impractical for agent-driven development.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | All 3 ACs are directly addressed with concrete deliverables. |
| Data Integrity & State | 10 | Static Markdown files; no runtime state or side effects. |
| Security & Validation | 10 | No external inputs, no code execution; purely instructional. |
| Performance & Scalability | 9 | ~200-line fragment is well within agent context window limits. |
| Error Handling & Recovery | 9 | Double-Lock ensures graceful degradation — if fragment is missing, agents proceed without it but log a warning. |
| Architectural Depth & Leverage | 10 | Reusable across all Ruflo epic stories that involve testing. The knowledge graph entry ensures automatic discovery. |
| UX Empathy | 9 | Prevents agents from generating low-quality, brittle mock tests that would frustrate developers. |

**TOTAL AVERAGE: 9.57/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (content → registry → governance).
- [x] **Deletion Testable?** Yes (removing the fragment triggers knowledge graph resolution errors).
- [x] **Interface vs Implementation?** Yes (graph entry is the public interface; fragment content is the implementation).

---

## Test Plan
- **T1**: Verify `draft-rules/tdd-london-principles.md` exists and contains YAML frontmatter with `name: tdd-london-principles`.
- **T2**: Verify the fragment contains sections: Double-Lock Directive, Core Principles, Test Double Taxonomy, 3 practical examples, Anti-Patterns.
- **T3**: Verify `knowledge-graph-patch-tdd.yaml` contains a node entry with `id: fragment-tdd-london-principles` and correct `trigger_condition`.
- **T4**: Verify all 3 code examples are syntactically valid Vitest/Jest code blocks.

---

## Self-Review
- **Code quality**: N/A (documentation story). Fragment follows established frontmatter conventions.
- **Content quality**: Comprehensive London School TDD coverage with actionable examples. Anti-patterns section prevents common mistakes.
- **Completeness**: All 3 ACs satisfied. Knowledge graph patch follows existing `knowledge-graph-patch.yaml` format.
- **Edge cases**: Double-Lock directive handles the edge case of agents skipping the fragment.

---

**Status:** `DONE`
