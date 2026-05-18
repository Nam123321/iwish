---
epic: EPIC-IWISH-01
story_id: IW-STORY-02
title: Update Alias Registries, Constants, and Clean Up Orphaned Files
status: todo
assignee: orch-agent
---

# IW-STORY-02: Update Alias Registries, Constants, and Clean Up Orphaned Files

## 1. Context & Business Value
Following the successful migration of agent schemas to the I-Wish native format (IW-STORY-01), the routing infrastructure still references outdated or missing aliases. Specifically, aliases for `website-clone-agent` and updated mappings for `tech-writer-agent` need to be reflected in both the YAML catalog and TypeScript constants to ensure the CLI routes generic/legacy commands correctly without breaking.

**Tracer Bullet (Vertical Slice):** 
Update the static YAML registry (`_iwish/catalog/alias-registry.yaml`) -> Update the TypeScript runtime constants (`src/iwish/constants.ts`) -> Verify compilation and file cleanup.

## 2. Acceptance Criteria

- **AC1:** `_iwish/catalog/alias-registry.yaml` is updated to include `cell: website-clone-agent`.
- **AC2:** `_iwish/catalog/alias-registry.yaml` is updated to change `master-roshi` mapping to `tech-writer-agent`.
- **AC3:** `src/iwish/constants.ts` is updated to exactly mirror the changes in AC1 and AC2.
- **AC4:** A final verification is run to ensure no orphaned legacy files (like `ui-absorber-agent.md`) exist in the `.agent/agents/` directory.

## 3. Implementation Tasks

- `[x]` **Task 1 (AC1, AC2):** Modify `_iwish/catalog/alias-registry.yaml`. Add the missing mappings and correct the `master-roshi` target.
- `[x]` **Task 2 (AC3):** Modify `src/iwish/constants.ts`. Update `LEGACY_AGENT_ALIASES` to match the YAML catalog.
- `[x]` **Task 3 (AC4):** Verify the `.agent/agents/` directory is clean.
- `[x]` **Task 4 (General):** Run `npm run build` to ensure the TypeScript constants update compiles correctly.

## 4. AC-To-Task Traceability Matrix
- **AC1** -> Task 1
- **AC2** -> Task 1
- **AC3** -> Task 2
- **AC4** -> Task 3

## 5. Dev Notes (Project Memory)
- **Architecture Constraints:** The I-Wish framework enforces standalone markdown workflows and agents. We rely on the generic workflow engine (`_iwish/core/tasks/workflow.xml`).
- **Memory Hygiene:** Be sure to execute empirical Git Diffs before declaring tasks complete, as per the Anti-Sycophancy protocol.

---

## 🛡️ QA Simulator Guardian (7-Row Scorecard)
*Domain: CLI/Orchestration Configuration*

| Axis | Threat Vector | Mitigation Strategy | Score |
|---|---|---|---|
| **1. State Integrity** | Out of sync YAML vs TS configs. | TS and YAML configs are being explicitly synchronized in Tasks 1 and 2. | 9/10 |
| **2. Edge Case Logic** | Unhandled legacy alias routing. | AC1 and AC2 explicitly capture edge aliases (Cell, Master-Roshi). | 9/10 |
| **3. Concurrency** | N/A | Static configuration changes. | 10/10 |
| **4. Error Boundaries** | CLI parser fails on invalid YAML. | Build validation via `tsc` (Task 4) guards against compilation regressions. | 9/10 |
| **5. Security/Trust** | N/A | Internal configuration only. | 10/10 |
| **6. Scale/Perf** | N/A | O(1) dictionary lookups. | 10/10 |
| **7. UX Empathy** | User gets "Agent Not Found" errors on old commands. | Full alias mapping guarantees backwards compatibility for users accustomed to legacy names. | 9/10 |

**TOTAL AVERAGE:** 9.4/10 (PASS)
