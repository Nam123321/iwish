# I-Wish Integration Guide: agent-skills
> **Generated:** 2026-06-18
> **Source:** [agent-skills](https://github.com/addyosmani/agent-skills)
> **Status:** APPROVED (Selective Extraction)

---

## 1. What is it
- **Capability/Repo Name:** `agent-skills`
- **Source:** `https://github.com/addyosmani/agent-skills`
- **Current Registration State:** Selective Extraction approved. The repository is treated as a **Compound** source.
- **Shape Classification:** `compound` (divided into supportive `fragment`s and specialized `skill`s).
- **Role Classification:** `supportive` / `foundational` (caching mechanism).

---

## 2. Why it exists
- **Job Solved:** Combats agentic overconfidence, token bloat, and "lazy" development behaviors.
- **Why I-Wish Wants It:** It introduces:
  1. In-flight adversarial self-checking (**Doubt-Driven Development**).
  2. Local, secure HTTP revalidation caching for fetch tools (**SDD Cache**).
  3. Metric-driven code simplification (**Code Simplification**).
- **Gaps Filled:** Adds prompt-level revalidation caching and systematic, in-flight refactoring guidelines that I-Wish previously lacked.

---

## 3. Delivery Framework Placement
- **Gated Spec-Driven (SDD):** Placed in the **Define & Planning** phase. Injected into:
  - `/create-prd` (to clarify assumptions).
  - `/make-story` (to reframe requirements as testable metrics).
  - `/iwish-feature-create-ui-spec` (to specify boundaries).
- **Doubt-Driven (DDD):** Placed in the **Build & Verify** phase. Injected into:
  - `/code` / `/iwish-feature-dev-story` (run cycle before completing non-trivial tasks).
  - `/fix-bug` (verify side-effects and regression).
  - `/create-architecture` (verify design decisions).
  - `/review` (verify PR completeness and prevent "doubt theater").
- **Observability, Simplification, & Citations:** Placed in the **Build** phase as supportive tools for `dev-agent` and `research-agent`.

---

## 4. Input -> Process -> Output
- **Inputs:** Raw user instructions, file diffs, target specifications, and HTTP URLs.
- **Process:**
  - *For Fetch:* Pre-hook intercepts tool call, verifies URL safety, checks local cache, sends HTTP HEAD request. If 304, returns cached payload.
  - *For Code:* Agent isolates diff, formats Claim and Contract, prompts adversarial reviewer, reconciles findings, and applies incremental edits.
- **Outputs:** Revalidated cached HTTP outputs, refactored clean source files, and audit-trail reconciliation tables.

---

## 5. Use Cases
- **Core Use Cases:**
  - Token-efficient fetch requests for external documentations.
  - In-flight adversarial reviews for high-stakes commits (schema migrations, branching logic).
  - Refactoring long/nested files during implementation.
- **Adjacent Use Cases:**
  - Telemetry logging setups (`observability-and-instrumentation`).
  - Generating Architectural Decision Records (`documentation-and-adrs`).
- **Do-Not-Use Cases:**
  - Trivial files renaming or formatting.
  - Unscoped "drive-by" refactoring of unrelated files.
  - When the user explicitly requests speed/brevity over verification (e.g. `/caveman-mode`).

---

## 6. Edge Cases / Stress Cases / Constraints
- **SSRF Egress Risk:** Unvalidated curl redirects could hit private networks.
  - *Constraint:* Block redirect follows (`--max-redirs 0`) and apply strict URL whitelist filters (`url_is_safe()`).
- **Symlink Overwrites:** Cache writes could follow symlinks and overwrite files outside the sandbox.
  - *Constraint:* Pre-verify regular-file targets and reject symlinks at entry.
- **Tooling Dependencies:** Cache hooks require `jq`, `curl`, and `shasum` to be in the host path.
  - *Constraint:* Degrade gracefully (exit 0) if dependencies are missing.
- **Doubt Loops:** Agent can get stuck in infinite self-skepticism loops.
  - *Constraint:* Enforce a strict limit of 3 cycles before stopping and escalating to the user.

---

## 7. Agent / Workflow / Skill Coordination
- **`review-agent`:** Coordinates the in-flight Doubt-Driven check.
- **`dev-agent`:** Coordinates the Code Simplification and TDD checklists.
- **`research-agent`:** Coordinates the Source-Driven doc citations.
- **`orch-agent`:** Manages the routing gates and handles Socratic debates when doubt reconciliation fails.

---

## 8. Orch Routing Hints
- **Trigger Phrases:** `revalidate cache`, `verify complexity`, `doubt check`, `reduce nesting`, `ADR`, `TTFB`, `LCP`.
- **Anti-Triggers:** `rename variable`, `format document`, `typo`.
- **Preferred Routing Stage:** Injected automatically during task implementation and review loops.
- **Proposal Mode:** Passive (runs silently in the background for caching/checks) except cross-model doubt requests, which require explicit user confirmation.

---

## 9. Review Questions for the User
- Should the default TTL for revalidated cache (`SDD_CACHE_MAX_AGE`) remain 24 hours?
- Should cross-model doubt reviews automatically suggest the Gemini CLI, or should they always prompt for user choice?
- Are the code complexity thresholds (nesting deep >= 3, function length >= 50 lines) appropriate for the user's project codebase style?

---

## 10. Example Scenarios

### Scenario 1: Revalidating Fetch Cache
1. Agent calls `WebFetch` tool with `URL: https://example.com/docs`.
2. Pre-hook checks `.claude/sdd-cache/` for hash match. Cache hit found.
3. Pre-hook queries `example.com` HEAD with `If-None-Match: "etag-123"`.
4. Server responds `304 Not Modified`.
5. Pre-hook exits 2, returns cached content instantly without consuming WebFetch tokens.

### Scenario 2: In-flight Doubt Cycle
1. Agent implements a new middleware in `auth.ts` crossing module boundaries.
2. Agent isolates the diff and target requirements, omitting prior reasoning.
3. Agent prompts a fresh-context reviewer: *"Find issues with this artifact under the contract."*
4. Reviewer identifies a potential race condition in token refresh.
5. Agent reconciles finding, refactors the code, and verifies with unit tests.

---

## 11. Codebase Health & Code Simplification Synergy

To prevent conflicts and build a high-quality feedback loop:
1. **Codebase Health (`/codebase-health`)** operates as a **Macro Diagnostic Gate**. It runs statically on the entire workspace during planning, sprint status checks, or pre-PR gates to detect complex hotspots (e.g., nesting depth $\ge 3$, functions $\ge 50$ lines, files $\ge 500$ lines, or connections $\ge 50$).
2. **Code Simplification (`code-simplification`)** operates as a **Micro Remediation Skill**. It runs dynamically (in-flight) in the developer agent's context to guide the step-by-step refactoring of the flagged complexity hotspots.
3. **Synergy Policy:**
   - Any file flagged as a complexity hotspot by `/codebase-health` is automatically added to the refactoring backlog.
   - During active development (`/code`, `/iwish-feature-dev-story`), if an agent edits a file that is either marked as a hotspot or gets pushed past the health thresholds by the new changes, the agent must activate the `code-simplification` skill to refactor and simplify the affected sections.
   - Refactored changes must be verified using the test suite to ensure exact behavioral parity.

