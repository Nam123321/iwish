---
epic: epic-gstack
story_id: G.3
status: DONE
priority: P0
depends_on: []
phase: "forge"

---
# Story G.3: Wave 1 — Anti-Sycophancy Rules & Learning Context Loop

## 1. Overview

This is the first execution wave from the Gstack Absorption plan. It targets the two highest-priority behavioral gaps in the I-Wish agent ecosystem:

1.  **Anti-Sycophancy (Office Hours):** I-Wish council agents and ideation workflows currently lack adversarial pushback rules. Agents agree too readily ("Great idea!", "Absolutely!", "That makes perfect sense!"), creating an "Echo Chamber" that degrades the quality of brainstorming, product briefs, and reviews.
2.  **Learning Context Loop:** I-Wish agents start every session completely fresh. There is no mechanism for agents to log operational learnings (e.g., "this pattern caused a merge conflict last time") or retrieve them in future sessions. The same mistakes repeat indefinitely.

This story creates the foundational **Fragment** and **Dynamic Context** assets for both patterns and wires them into the target agents and workflows using the established Double-Lock mechanism.

## 2. User Story

**As an** Orchestrator Agent (Grand-Priest) and participating council agents (King-Kai, Master-Roshi, Hit),
**I want** to have Anti-Sycophancy rules injected into my behavioral context and a structured Learning Loop for session persistence,
**So that** I provide genuinely adversarial feedback instead of hollow agreement, and continuously learn from past sessions to avoid repeating mistakes.

## 3. Acceptance Criteria

### AC1: Anti-Sycophancy Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 1 is completed
*   **Then** `/.agent/fragments/anti-sycophancy.md` exists containing:
    *   A **Banned Phrases** table (minimum 10 phrases: "Great idea!", "Absolutely!", "That makes perfect sense!", "I completely agree!", "Brilliant!", "No issues at all", "Looks good to me!", "Perfect!", "That's exactly right!", "I love that approach!").
    *   5 **Pushback Patterns** (e.g., "What's the strongest argument AGAINST this?", "If this fails, what's the most likely cause?", "What assumption are we NOT questioning?").
    *   A **Response Posture** guideline (default stance: constructive skepticism, not cheerleading).
    *   6 **Forcing Questions** framework for Product Discovery (adapted from Gstack `office-hours`).

### AC2: Anti-Sycophancy Injected into Target Agents
*   **Given** the fragment `anti-sycophancy.md`
*   **When** the following agents are loaded:
    *   `king-kai.md` (Product Manager)
    *   `master-roshi.md` (Technical Writer)
    *   `hit.md` (Edge Case Guardian)
*   **Then** each agent's `<rules>` section contains a Double-Lock injection block:
    ```
    > [!IMPORTANT]
    > **DOUBLE-LOCK CONTEXT INJECTION:**
    > You MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md` before providing any review or feedback.
    ```
*   **And** each agent's `<rules>` contains a hard rule: `<r>NEVER use phrases from the Banned Phrases list. If you catch yourself agreeing, STOP and force a counter-argument.</r>`

### AC3: Anti-Sycophancy Injected into Target Workflows
*   **Given** the fragment `anti-sycophancy.md`
*   **When** the following workflows are loaded:
    *   `iwish-party-mode.md` (`/party-mode`)
    *   `iwish-bmm-create-product-brief.md` (`/create-product-brief`)
    *   `iwish-brainstorming.md` (`/brainstorming`)
*   **Then** each workflow contains a mandatory preamble step or Double-Lock injection block that loads `anti-sycophancy.md` before the first interaction step.

### AC4: Learning Context Loop Fragment Created
*   **Given** the `/.agent/fragments/` directory
*   **When** Wave 1 is completed
*   **Then** `/.agent/fragments/learning-context-loop.md` exists containing:
    *   **LOAD Protocol** (Step 00): Instructions for agents to query `knowledge-graph.yaml` for prior learnings tagged with the current workflow context.
    *   **SAVE Protocol** (Final Step): Instructions for agents to append new learnings to the Knowledge Graph using `add-to-kg.sh`, with mandatory fields: `id`, `type: learning`, `path`, `description`, `tags`, `confidence` (1-10), `session_date`.
    *   **Prune Rules**: Guidance on staleness (learnings older than 90 days without reconfirmation get flagged).
    *   **Search Template**: A `grep_search` query pattern for agents to use when searching the KG.

### AC5: Learning Context Loop Wired into Grand-Priest
*   **Given** the fragment `learning-context-loop.md`
*   **When** the Grand-Priest agent is activated
*   **Then** its activation `<step n="3">` (LOAD PHASE) references the Learning Context Loop fragment for detailed retrieval instructions.
*   **And** its `<rules>` SAVE PHASE references the fragment for save protocol details.

### AC6: Knowledge Graph Updated
*   **Given** the two new fragments
*   **When** the migration is complete
*   **Then** `/.agent/knowledge-graph.yaml` contains two new nodes:
    *   `fragment-anti-sycophancy` (type: `fragment`, path: `/.agent/fragments/anti-sycophancy.md`)
    *   `fragment-learning-context-loop` (type: `fragment`, path: `/.agent/fragments/learning-context-loop.md`)
*   **And** `validate-kg.py` reports 0 broken links.

### AC7: Sprint Status Updated
*   **Given** the story is complete
*   **When** all ACs pass
*   **Then** `sprint-status.yaml` is updated: `STORY-G.3` → `status: done`.
*   **And** `story-g2-wave-1-context.md` (the old stub) is either deleted or replaced by this story file.

## 4. Technical Specification

### 4.1. Fragment: `anti-sycophancy.md`

**Location:** `/.agent/fragments/anti-sycophancy.md`

**Content Structure:**
```markdown
# Anti-Sycophancy Rules (Office Hours Protocol)

## Banned Phrases
| # | Phrase | Why Banned |
|---|--------|-----------|
| 1 | "Great idea!" | Empty validation without analysis |
| 2 | "Absolutely!" | Agreement without evidence |
| ... | ... | ... |

## Pushback Patterns
1. "What's the strongest argument AGAINST this?"
2. "If this fails in production, what's the most likely cause?"
3. "What assumption are we NOT questioning?"
4. "Who would this NOT work for? Which persona suffers?"
5. "What would a competitor do differently?"

## Response Posture
- Default stance: **Constructive Skepticism**
- You are a peer, not a cheerleader
- Every "yes" must come with a "but have you considered..."
- Silence on risks = complicity in failure

## 6 Forcing Questions (Product Discovery)
1. What problem does this solve that users currently tolerate?
2. Why NOW? What changed?
3. What's the simplest version that validates the hypothesis?
4. What will you say NO to in order to do this well?
5. How will you know this succeeded in 30 days?
6. What's the undo/rollback plan if this fails?
```

### 4.2. Fragment: `learning-context-loop.md`

**Location:** `/.agent/fragments/learning-context-loop.md`

**Content Structure:**
```markdown
# Learning Context Loop Protocol

## LOAD Protocol (Step 00)
1. Query `/.agent/knowledge-graph.yaml` using `grep_search`
2. Filter nodes where `type: learning` AND `tags` overlap with current task
3. Load relevant learnings via `view_file` on their `path`
4. Summarize loaded context in 1-2 sentences before proceeding

## SAVE Protocol (Final Step)
1. Identify new learnings from current session
2. Create `.md` file in `/.agent/learnings/` with structured format
3. Use `add-to-kg.sh` to register in Knowledge Graph
4. Required fields: id, type: learning, path, description, tags, confidence, session_date

## Prune Rules
- Learnings > 90 days without reconfirmation → flag as STALE
- Contradicted learnings → mark as SUPERSEDED with link to newer learning
- Confidence < 3 → auto-prune after 30 days

## Search Template
grep_search query="<keyword>" path="/.agent/knowledge-graph.yaml"
→ Filter results for type: learning
→ Read description and tags
→ view_file on matching path(s)
```

### 4.3. Agent Modifications

| Agent | File | Modification |
|-------|------|-------------|
| King-Kai | `/.agent/agents/king-kai.md` | Add Double-Lock block + banned-phrase rule to `<rules>` |
| Master-Roshi | `/.agent/agents/master-roshi.md` | Add Double-Lock block + banned-phrase rule to `<rules>` |
| Hit | `/.agent/agents/hit.md` | Add Double-Lock block + banned-phrase rule to `<rules>` |
| Grand-Priest | `/.agent/agents/grand-priest.md` | Reference `learning-context-loop.md` in LOAD/SAVE rules |

### 4.4. Workflow Modifications

| Workflow | File | Modification |
|----------|------|-------------|
| Party Mode | `/.agent/workflows/iwish-party-mode.md` | Add mandatory preamble loading `anti-sycophancy.md` |
| Create Product Brief | `/.agent/workflows/iwish-bmm-create-product-brief.md` | Add Double-Lock block at Step 1 |
| Brainstorming | `/.agent/workflows/iwish-brainstorming.md` | Add Double-Lock block at preamble |

### 4.5. Infrastructure

- Create directory `/.agent/learnings/` (empty, ready for Learning Loop output).
- Register both new fragments in `knowledge-graph.yaml`.

## 5. Out of Scope

- Automated pruning of stale learnings (future story).
- Cross-model dispatch for genuine second opinion (Gstack `pair-agent` — separate story).
- Confidence calibration scoring system (Wave 2 story dependency).

## 6. Tri-Agent LITE Scan Summary

*   **Kira Lite (Data-Piccolo):** Two new fragment files + KG node entries. One new directory (`learnings/`). Agent `.md` edits are append-only (non-breaking). Risk: Workflow reference breakage if Double-Lock syntax is malformed.
*   **Shinji Lite (Data Strategist):** Event flow: Grand-Priest LOAD → reads KG → dispatches to agent → agent loads anti-sycophancy fragment → enforces rules. SAVE flow: Agent → creates learning `.md` → calls `add-to-kg.sh` → KG updated. No new data models; schema reuses existing KG node format.
*   **Quinn Lite (Testability):** Anti-sycophancy is verifiable by running `/party-mode` test session and scanning output for banned phrases. Learning Loop testable by creating a mock learning, restarting session, and verifying retrieval. `validate-kg.py` serves as automated regression test.

---

## 7. QA SIMULATOR GUARDIAN AUDIT (Fat-Guardian)

**7-Row Hybrid Scorecard:**

| Axis | Score (1-10) | Evaluation / Gap |
| :--- | :--- | :--- |
| **1. Completeness** | 9 | Covers both P0 patterns (Anti-Sycophancy + Learning Loop) with explicit fragment content, agent targets, and workflow targets. Minor gap: brainstorming workflow currently references a missing legacy path, requiring either a stub or full rewrite. |
| **2. Testability** | 8 | Anti-sycophancy testable via grep for banned phrases in `/party-mode` output. Learning Loop testable via mock create+retrieve cycle. Tone assessment remains partially subjective. Mitigation: Define a concrete "banned phrase count = 0" pass/fail gate. |
| **3. Edge-Case Resilience** | 9 | Double-Lock mechanism ensures fragments are loaded even if agent is "lazy". Prune rules prevent KG bloat. `add-to-kg.sh` prevents YAML corruption. Edge case: What if `learnings/` directory grows unbounded? Mitigated by 90-day prune rule. |
| **4. Consistency** | 10 | Perfectly follows the Fragment + Double-Lock standard established in G.1 and validated in G.2. Uses existing `validate-kg.py` for regression. |
| **5. Feasibility** | 10 | All changes are markdown edits and file creation. No code compilation, no runtime dependencies. Fully executable by a single Vegeta session. |
| **6. Security/Perf** | 9 | Fragments are loaded on-demand (no context window bloat). Learning nodes have confidence scoring to prevent low-quality noise from polluting the KG. Minor risk: Malicious or garbled learning entries could degrade future sessions. Mitigation: Confidence scoring + prune rules. |
| **7. UX Empathy** | 9 | Eliminates "Echo Chamber" in council reviews and ideation sessions. Users get genuinely useful pushback instead of hollow agreement. The Forcing Questions framework provides immediate practical value for product discovery. |
| **TOTAL AVERAGE** | **9.14 / 10** | **PASSED.** (>= 8.5) |
