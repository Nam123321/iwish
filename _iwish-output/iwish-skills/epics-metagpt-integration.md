# Epics & Stories: MetaGPT Selective Extraction Integration

This document maps the requirements for integrating MetaGPT extracted features into I-Wish system skills.

---

## Epic 1: MetaGPT SOP Sequential Execution Pattern

### Story 1.1: Sequential Turn Fragment Draft
- **Goal**: Create a system fragment `sop-sequential-execution` in draft form under `${IWISH_HOME}/generated-skills/` that defines the rules for sequential turn routing.
- **Acceptance Criteria**:
  - AC1: Define the `BY_ORDER` react mode frontmatter.
  - AC2: Map sequential step progress tracking (`rc.state` equivalents).

---

## Epic 2: Secure ActionNode XML Parser

### Story 2.1: Secure XML ActionNode Parser Draft
- **Goal**: Create a system skill `safe-xml-parser` draft under `${IWISH_HOME}/generated-skills/` to parse recursive XML tags.
- **Acceptance Criteria**:
  - AC1: Extract contents of nested XML tag lists and dicts.
  - AC2: Use `ast.literal_eval()` instead of `eval()` to prevent remote code execution.

---

## Epic 3: Fast-Track Self-Healing Loop

### Story 3.1: Fast-Track Self-Healing Draft
- **Goal**: Create a system skill `fast-track-self-healing` draft under `${IWISH_HOME}/generated-skills/` to automate compilation checks and retries.
- **Acceptance Criteria**:
  - AC1: Capture compilation stderr traces.
  - AC2: Auto-inject traceback context into LLM prompt.
  - AC3: Hard limit loops to exactly 3 retries.
