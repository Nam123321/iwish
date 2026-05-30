# Story 3.1: Model Discovery & Stats Tracker

**Epic:** Epic 3: Multi-Provider Thompson Sampling Router
**Story Title:** Model Discovery & Stats Tracker
**Goal:** Implement an environment scanner that detects available LLM providers and a persistent stats tracker that records per-model call metrics (latency, cost, success/failure) using Thompson Sampling Beta distribution priors.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story implements the foundational data layer for the Thompson Router:
1. **Environment Discovery Layer**: Scans `process.env` for known API key patterns (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_HOST`).
2. **Stats Persistence Layer**: Reads/writes model performance data to `.iwish/routing-stats.json`.
3. **Call Logging Layer**: Records latency, estimated cost, and success/failure per call, updating Beta distribution parameters (α/β).
4. **CLI Layer**: Provides `discover`, `log`, and `show` subcommands for manual operation.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** environment variables for one or more known LLM providers are set, **When** `discoverProviders()` is called, **Then** it returns a list of `{ provider, envVar, models[] }` for each detected provider.
- **AC2:** **Given** a stats file does not exist, **When** `saveStats()` is called for the first time, **Then** it creates `.iwish/routing-stats.json` and its parent directory automatically.
- **AC3:** **Given** a call result is logged via `logCall(model, provider, success, latencyMs, estimatedCost)`, **When** the stats are queried, **Then** the record reflects updated `alpha`/`beta` (Thompson priors), `totalCalls`, `avgLatencyMs`, `totalCost`, and `lastUpdated`.
- **AC4:** **[EDGE-CASE]** **Given** no API keys are set in the environment, **When** `discoverProviders()` is called, **Then** it returns an empty array without errors.
- **AC5:** **[EDGE-CASE]** **Given** the stats JSON file is corrupted or contains invalid JSON, **When** `loadStats()` is called, **Then** it logs a warning and returns a fresh empty stats object.
- **AC6:** **[EDGE-CASE]** **Given** `logCall()` is called for a model that has no prior record, **When** stats are updated, **Then** a new entry is created with default priors (alpha=1, beta=1).

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 6 (≤ 8) → 0
2. **Data Model Spread:** 1 (single routing-stats.json schema) → 0
3. **UI Surface:** 0 (CLI only) → 0
4. **Cross-Domain:** 0 (Pure Node.js, env + fs) → 0
5. **Flow Complexity:** 2 (env scanning + stats CRUD + file I/O) → 0
6. **Test Burden:** 3 (env mocking, file ops, stats math) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|---------------------|-----------------------------|--------|
| AC1 | Discover providers from env vars | Task 1: Implement `discoverProviders()` scanning known key patterns | ✅ Mapped |
| AC2 | Create stats file and directory | Task 2: Implement `saveStats(filePath?)` with `mkdirSync({ recursive: true })` | ✅ Mapped |
| AC3 | Log call and update Beta priors | Task 3: Implement `logCall()` updating α/β, avgLatency, totalCost | ✅ Mapped |
| AC4 | Empty env graceful handling | Task 1: Return `[]` when no keys found | ✅ Mapped |
| AC5 | Corrupted stats file recovery | Task 4: Implement `loadStats()` with try-catch and fallback | ✅ Mapped |
| AC6 | New model auto-initialization | Task 3: Create default entry `{ alpha:1, beta:1 }` on first log | ✅ Mapped |

---

## 📋 5. Tasks
- [x] Task 1: Implement `StatsTracker` class with `discoverProviders()` method
- [x] Task 2: Implement `saveStats()` / `loadStats()` with file I/O and directory creation
- [x] Task 3: Implement `logCall()` with Thompson prior updates and running average latency
- [x] Task 4: Implement `getStats(model?)` returning one or all model stats
- [x] Task 5: Implement CLI interface with `discover`, `log`, `show` subcommands
- [x] Task 6: Write comprehensive unit tests covering all ACs and edge cases

---

## 🧪 6. Test Plan
- **Test 1:** `discoverProviders()` detects providers when env vars are set
- **Test 2:** `discoverProviders()` returns empty array when no env vars match
- **Test 3:** `logCall()` creates new model entry with correct initial priors (alpha=2 on success, beta=2 on failure)
- **Test 4:** `logCall()` increments existing model stats correctly
- **Test 5:** `getStats(model)` returns stats for a specific model
- **Test 6:** `getStats()` returns stats for all models
- **Test 7:** `saveStats()` creates parent directory and file
- **Test 8:** `loadStats()` recovers gracefully from corrupted JSON
- **Test 9:** `loadStats()` returns empty stats when file does not exist
- **Test 10:** Average latency calculation is correct across multiple calls
- **Test 11:** Total cost accumulates correctly

---

## 💬 7. Socratic Review Synthesis Summary
- **Fail-Safe Design:** All I/O operations (env scanning, file read/write) are wrapped in try-catch to prevent crashes. Corrupted stats files trigger a clean reset rather than blocking the router.
- **Thompson Priors:** Using `alpha = successes + 1` and `beta = failures + 1` ensures a proper Beta(1,1) uniform prior for new models, preventing zero-sample bias.
- **Extensibility:** The provider registry is a simple array of `{ envVar, provider, defaultModels }` tuples, making it trivial to add new providers (Mistral, Cohere, etc.).

---

## 🛡️ 8. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | All CRUD operations on stats are deterministic and well-tested. |
| Data Integrity & State | 9.5 | JSON file persistence with atomic write pattern. Minor risk of concurrent writes (acceptable for single-agent use). |
| Security & Validation | 9.0 | Reads env vars (no secrets logged), validates input types. No eval or dynamic code execution. |
| Performance & Scalability | 9.5 | Sub-millisecond env scanning and JSON I/O for typical model pools (< 20 models). |
| Error Handling & Recovery | 10 | Corrupted files, missing directories, and missing env vars all handled gracefully. |
| Architectural Depth & Leverage | 9.5 | Provides the foundational data layer that Story 3.2's Thompson Selector will consume. |
| UX Empathy | 9.0 | CLI output is human-readable with formatted tables and emoji indicators. |

**TOTAL AVERAGE: 9.50/10 (PASS)**

---

**Status:** `DONE`
