# Story 3.2: Hermes Curator Recommendation Generator

**Epic:** Epic 3: Error Recovery & Hermes Contract Promotion
**Story Title:** Hermes Curator Recommendation Generator
**Goal:** Implement a recommendation exporter under `.agent/skills/iwish-evolver/scripts/recommendation-generator.py` that formats successfully evolved skills into a YAML contract matching the I-Wish Hermes Curator standard (`disposition: patch|merge|archive`). It outputs these proposals under `_iwish-output/generated-skills/` and provides a promotion script to apply changes to `.agent/` upon user approval, honoring the safety and reference boundaries.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. It spans:
1. **YAML Exporter**: Serializing the evolved skill metadata (UUID, path, status, confidence, evidence) to a Hermes YAML contract.
2. **Draft Output**: Writing the evolved skill body and `metadata.yaml` to `${IWISH_HOME}/generated-skills/<name>/`.
3. **Promotion Executor**: CLI script to migrate files from the sandbox draft folder to the active `.agent/` directory on user approval.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a skill has been successfully evolved and validated in the sandbox, **When** the session ends, **Then** it generates a recommendation YAML file under `_iwish-output/iwish-skills/` conforming to the Hermes Curator YAML schema.
- **AC2:** **Given** a recommendation, **When** generated, **Then** it sets `approval_required: true` and defines the `target_path` under `_iwish-output/generated-skills/<name>/` and `promotion_target` under `.agent/skills/<name>/`.
- **AC3:** **Given** a generated draft skill, **When** the user invokes the promotion script with approval, **Then** it copies files to the canonical `.agent/` folder, updates the main knowledge graph (`knowledge-graph.yaml`), and removes temporary sandbox git branches.
- **AC4:** **Given** the user rejects a recommendation, **When** executed, **Then** it archives the draft recovery plan safely under `_iwish-output/scratch/` and drops the sandbox changes without modifying any `.agent/` files.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 1 (Hermes Curator YAML schema) → 0
3. **UI Surface:** 0 (CLI/script only, no UI) → 0
4. **Cross-Domain:** 1 (File promotions, Git cleanup, YAML config updating) → 0
5. **Flow Complexity:** 1 (Promotion approval workflow states) → 0
6. **Test Burden:** 1 (Testing rollback of rejected skills and cleanup) → 0
**Complexity Score (CS):** 0 (✅ OK — Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | Hermes YAML Export | Task 1: Implement YAML serializer matching Hermes metadata schema in `recommendation-generator.py`. | [x] Done |
| AC2 | Draft Sandbox Setup | Task 2: Create directory generator to write drafts under `_iwish-output/generated-skills/`. | [x] Done |
| AC3 | Promotion Script | Task 3: Create CLI utility script to copy files, update `knowledge-graph.yaml`, and prune branches. | [x] Done |
| AC4 | Rejection Handling | Task 4: Add cleanup/archive logic for rejected recommendations to restore original git HEAD. | [x] Done |

---

## 💬 5. Socratic Review Synthesis Summary
- **Governance Compliance**: This story is the critical bridge that satisfies both Hermes Curator safety boundaries (no direct overwriting of canonical `.agent/` assets) and the desire for automation. The agent runs automatically *inside* the sandbox, but the final promotion *requires* user approval.
- **Lineage Integrity**: When copying files to the canonical system, the promotion tool automatically appends the parent UUID and commit SHA to the final skill frontmatter, maintaining auditability.
- **Pruning Strategy**: Removing temporary branches post-promotion prevents branch pollution in the git log.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Rigid schema enforcement; safe copy actions protect canonical files. |
| Data Integrity & State | 9 | Updates `knowledge-graph.yaml` atomically; backups are created before modifications. |
| Security & Validation | 9 | Verifies draft paths are within `_iwish-output` to prevent path traversal issues. |
| Performance & Scalability | 9 | Promotion operations are simple filesystem moves, taking under 100ms. |
| Error Handling & Recovery | 10 | Provides full recovery plans for all dispositions (patch, merge, archive). |
| Architectural Depth & Leverage | 10 | Integrates the learning system directly with I-Wish's primary governance layer. |
| UX Empathy | 10 | Transparent one-click promotion script takes the friction out of skill upgrades. |

**TOTAL AVERAGE: 9.57/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (Validate skill → generate YAML -> write draft -> run promotion -> merge canonical KG).
- [x] **Deletion Testable?** Yes (removing generator means evolved skills remain stuck in sandbox forever).
- [x] **Interface vs Implementation?** Yes (exposed through standard YAML metadata boundaries).

---

**Status:** `DONE`
