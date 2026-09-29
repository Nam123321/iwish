---
description: 'Automated workflow to refactor monolithic skills into the 3-Layer Progressive Disclosure architecture. Use to compress Context Window load.'
---

# 🛠️ `/refactor-skill` Workflow

## 📌 OVERVIEW
The `/refactor-skill` workflow automates the transition of heavy, monolithic skills and workflows (>500 lines) into the highly optimized **3-Layer Progressive Disclosure** pattern. This reduces static LLM context overhead by up to 98% while preserving logic via Just-In-Time (JIT) file loading.

**Usage:** `/refactor-skill [target_file_path]`
**Tournament Mode:** `/refactor-skill [target_file_path] --test-task "A dummy task to test the skill"`

---

## 🚦 INITIALIZATION
1. **Validate Input:** Ensure `target_file_path` is provided. If `--test-task` is provided, enable Tournament Validation Mode.
2. **Audit Target:** Read the target file. Check the Line Count using `wc -l`. If the file is < 500 lines, issue a warning that it might not need refactoring, but proceed if forced by the user.

---

## ⚙️ THE 5-PHASE REFACTORING PIPELINE

### Phase 1: METADATA & AUDIT
- Read the target file.
- Extract any YAML frontmatter (e.g., `--- \n description: ... \n ---`).
- Store the total line count to calculate the **Context Compression Ratio** later.

### Phase 2: EXTRACTION (The Reference File)
- **Routing Decision:**
  - If target is a workflow (`.agent/workflows/*`), create the reference at `.agent/workflows/references/{file-slug}-protocol.md`.
  - If target is a skill (`.agent/skills/{slug}/*`), create the reference at `.agent/skills/{slug}/references/{file-slug}-protocol.md`.
- **Action:** Move the ENTIRE core logic (XML tags, `<step>`, prompts, rulesets) from the original file into the newly created reference file.

### Phase 3: THE FRONT-DOOR (Pushy Description)
- **Action:** Overwrite the original `target_file_path` with a slim "Front-Door" template.
- **Template Constraints:**
  - Must include the original YAML metadata.
  - Must be `< 30 lines`.
  - Must contain the critical markdown link pushing the AI to read the reference file before executing.
  - *Example pushy instruction:* "To execute this skill, you MUST read and rigidly obey the rules defined in: [Protocol Link](file:///...). Do NOT attempt to run without reading."

### Phase 4: TOURNAMENT VALIDATION (Optional)
- **Condition:** Only trigger if `--test-task` was provided.
- **Action:** 
  1. Invoke the `/tournament` workflow, pitching the original branch (Native/Monolithic) against the newly refactored branch (3-Layer).
  2. The Tournament orchestrator will generate a Scorecard.
  3. **Metrics Check:** Verify that Context Compression Ratio is >80% AND Logic Parity >= 100%. If Parity fails, recommend rollback.

### Phase 5: COMMIT & REGISTRY
- Commit the changes to Git.
- Log the metrics: "Original Size -> New Size (Compression Ratio)".
