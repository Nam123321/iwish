# Project-Scoped Rules for I-Wish SDLC Workflows

All developer and orchestrator agents executing tasks in this workspace MUST strictly adhere to the following rules to prevent regression of workflow standards.

---

## 🛡️ Story Creation Rule (`/make-story`)

Whenever creating, rewriting, or updating a Story file (`story.md`), you MUST execute the steps defined in [iwish-feature-create-story.md](file:///.agent/workflows/iwish-feature-create-story.md) sequentially:

1. **FR Mapping**: Link the story explicitly to its corresponding Functional Requirements (`FR Covered: [FR-ID: Name]`) using clickable absolute file links pointing to the PRD.
2. **OKF Header**: Enforce valid OKF YAML frontmatter including `type: I-Wish Story`, `resource` URI, `tags`, and `links_to` array.
3. **Plan Tune Heuristic**:
   - Calculate the Complexity Score (CS) using the 6-dimension scoring table.
   - If CS >= 7, you **MUST HALT** and present a split proposal. Do not generate the story code/file until the user approves the split.
4. **AC-to-Task Traceability Matrix**: Generate a markdown matrix mapping every Acceptance Criteria (AC) to at least one implementation Task. No orphan or missing links are allowed.
5. **Cross-Feature Dependencies**: Generate the `## Cross-Feature Dependencies` section.
6. **QA Simulator Guardian Audit**: Mentally execute the simulator and embed the 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy) at the bottom. The `TOTAL AVERAGE` must be >= 8.5/10.
7. **Edge Case Guardian Scan**: Invoke the Review Agent, run the FMEA risk scoring, write risk nodes, and update the epic risk matrix.
8. **Automated Validation**: Before injecting or finalizing, you MUST run:
   `python3 .agent/scripts/validate-story.py "<file_path>"`
   If this script fails or reports missing elements, you **MUST NOT** proceed or declare the turn complete until all validation errors are resolved.
9. **Knowledge Graph Injection**: After successful validation, run:
   `iwish inject-node --file "<file_path>" --metadata '{"summary": "...", "tags": [...], "layer": "...", "complexity": "..."}'`
