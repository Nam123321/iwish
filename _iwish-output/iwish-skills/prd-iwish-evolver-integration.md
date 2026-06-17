# Product Requirements Document (PRD): I-Wish & Autoresearch Core Integration

## 1. Goal Description
The objective is to integrate the I-Wish self-evolving skill engine into the I-Wish system, enhanced by Autoresearch's quantitative optimization loop and Git branching sandbox. This integration bridges the gap between static, command-driven capabilities in I-Wish and autonomous, self-correcting continuous learning. By running skill evolution inside a secure, rollback-capable Git sandbox with strict time budgets, we enable the agent to autonomously repair runtime bugs and optimize prompts without risking code corruption or token runaways.

---

## 2. Functional Requirements (FR)

### FR1: Autonomous Git-Sandbox Evolution (`iwish-evolver`)
- Implement a system skill `iwish-evolver` that wraps I-Wish skill mutations (`FIX`, `DERIVED`, `CAPTURED`) in a temporary Git branch sandbox.
- Automatically execute `git reset --hard` to instantly restore the last stable state if a skill patch fails compilation, validation, or degrades performance metrics.

### FR2: Time-Budgeted Execution & Warm-up Overhead Filtering
- Enforce strict wall-clock time budgets (e.g., maximum 30 seconds for tool execution, 5 minutes for full benchmark suites) during skill validation.
- Automatically filter out the initial tool/server warm-up overhead (first-run initialization latency, JIT compilation, model load time) to ensure latency-based evaluation is accurate and fair.

### FR3: Traceback Reflection & Self-Correction
- Implement a structured parser for python/javascript error traceback dumps.
- Parse stack traces to identify line numbers and error context, feeding this structure back to the evolver agent prompt (adapted from Autoresearch's `program.md`) to guide targeted repairs.

### FR4: Prompt Density Optimization & Token-Efficiency Metrics
- Measure token usage and compression metrics for evolved skills.
- Compute prompt density using a tokenizer-independent metric (like bits-per-byte / character entropy) to ensure prompt rewrites compress instructions without sacrificing intent or precision.

### FR5: Hermes Recommendation Triage Contract
- Generate a machine-readable recommendation YAML matching the Hermes Curator standard (`disposition: patch|merge|archive`) for every successfully evolved skill.
- Present the recommendations to the user for one-click approval before promoting any generated skill drafts from the sandbox to the canonical `.agent/` folder.

---

## 3. Non-Functional Requirements (NFR)

### NFR1: Security & Dependency Protection
- Do not utilize the vulnerable `litellm==1.82.6` dependency pinned by upstream I-Wish. All LLM calls must route through I-Wish's secure, internal, validated LLM client.

### NFR2: Zero Persistent Daemon Bloat
- Avoid launching interactive CLI daemons that can enter loop states (like the macOS `launchd` interactive loop bug). All background executions must be non-interactive, stateless, and routed through standardized MCP tool calls.
