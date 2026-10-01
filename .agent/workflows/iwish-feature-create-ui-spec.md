---
legacy_name: create-ui-spec
description: Generate per-story UI spec with component hierarchy, responsive
  layout, and design tokens. UX Designer agent review gate before development.
disable-model-invocation: true
---

# 🎨 `/make-ui-spec` (Create UI Spec Workflow)

> [!IMPORTANT]
> **DESIGN CONSULTATION GATE (MANDATORY):**
> Before finalizing ANY UI spec, you MUST use `view_file` to load `/.agent/skills/design-consultation/SKILL.md` and execute the Design Army Pattern (5 specialist lenses: Typography, Color, Layout, Interaction, IA). Embed the Design Consultation Report in the final spec output.
**[CRITICAL COMPLIANCE REQUIREMENT]**
To generate the UI Spec systematically, you MUST read and rigidly obey the 5-Option Framework and extraction rules defined in: [UI Spec Protocol](references/create-ui-spec-protocol.md).
Do NOT attempt to run this workflow without reading the protocol!


> [!IMPORTANT]
> **DESIGN COMPLIANCE GATE CHECK (MANDATORY):**
> Right after generating the UI Spec, you MUST run the Design Compliance Scanner:
> `node .agent/scripts/design-compliance-scanner.js --spec <path-to-ui-spec.md> --design <path-to-design.md>`
> Ensure the scan passes with Exit Code 0. If it fails, you must fix all unauthorized design tokens (e.g. replacing default violet colors like `#7C3AED` with allowed tokens from `DESIGN.md` such as `#00DF9A` or `#059669`) and re-run the check. Do NOT proceed to design generation or coding with compliance violations.

<steps CRITICAL="TRUE">
0. **[IMMUTABLE FILE PATTERN - HARD GATE]**: Before performing any generation, you MUST run a shell command to create an empty read-only placeholder for the final spec to prevent accidental direct writes.
   `touch <path-to-ui-spec.md> && chmod 444 <path-to-ui-spec.md>`
   If you try to bypass the script and write directly to `ui-spec.md`, the OS will reject it with `Permission denied`. You MUST use the `ui-spec-draft.md` pattern.

0.5. **[INHERITED BASE MODE DETECTION - CONDITIONAL GATE]**:
   - Check if the target `ui-spec.md` already exists and contains approved content (file size > 500 bytes).
   - Check the story's YAML frontmatter `status` field. If `status` is `refactored` **OR** the `/flow` pipeline set `INHERITED_SPEC_MODE = true`:
     - **ACTIVATE Inherited Base Mode:**
       1. Copy the existing `ui-spec.md` → `ui-spec-base.md` as a backup.
       2. Read the existing `ui-spec.md` content completely using `view_file`. This is your **"Approved Base"**.
       3. Identify **AC Delta**: Compare current story ACs against the spec's coverage. Determine which sections are affected by new/modified/deprecated ACs.
       4. **If NO UI-impacting AC changes detected** (e.g., only backend AC changes): **SKIP** the entire `/make-ui-spec` workflow. Print: `"✅ No UI-impacting AC changes detected. Existing ui-spec.md preserved."` and exit.
       5. **If UI-impacting changes exist**: Continue to Step 1, but with the following constraints:
          - You MUST load the Approved Base into your generation prompt as read-only reference.
          - You MUST generate ONLY a diff/patch for the affected sections, NOT a full spec rewrite.
          - Your `ui-spec-draft.md` output MUST preserve 100% of content from the Approved Base that is NOT affected by the AC delta.
          - **[HUMAN GATE]**: Before finalizing, present a DIFF showing only the changed sections. The user MUST approve the delta changes before proceeding to Step 6.5 (finalize).
   - If `status` is `backlog` or there is no existing `ui-spec.md`: Proceed normally (full generation mode).

   > [!WARNING]
   > **OVERWRITE PROTECTION**: When Inherited Base Mode is active, using `write_to_file` with `Overwrite: true` on `ui-spec.md` or `ui-spec-draft.md` is **STRICTLY FORBIDDEN**. You MUST use `replace_file_content` or `multi_replace_file_content` to apply surgical edits to the Approved Base content. This is a HARD BLOCK — violation will cause loss of previously approved design work.

1. Locate and load the target story file. This could be in `_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md`, `_iwish-output/stories/story-{story_id}.md`, or `.agent/evolution-lab/stories/story-{story_id}.md`.
2. Read Feature Hierarchy `_iwish-output/2. Product Planning/2.5. feature-hierarchy.md`. Halt if missing.
3. Apply rules in UI Spec Protocol: `.agent/workflows/references/create-ui-spec-protocol.md`.
3.1. **[DYNAMIC OVERRIDES GATE]**: You MUST read the `Dynamic Epic Overrides & Special Context Rules` section at the bottom of `_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md`. Any special constraints defined there (such as specific container breakpoints like < 660px for a Main Panel) MUST be explicitly injected into the generated UI Spec.
   - **MANDATORY**: You will be validated by a strict Category A script in Step 6.4. Ensure you copy the exact text (verbatim) from the Epic's override block into your UI Spec to pass the strict string-matching validation.
3.2. **[ZERO-TRUST COMPONENT DISCOVERY GATE]**:
   - **Library Lookup**: You MUST scan Section 5 of `_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md` to check if a required UI component already exists.
   - **Criteria Evaluation**: Compare the UX Pattern, role, and properties (e.g. search bar, multiple choice, floating action) of the needed component against the library. If there's a match, inherit it.
   - **[COMPONENT MUTATION DETECTED] Rule**: If the component exists in `DESIGN.md` but the Story requires new behaviors, states, or props not currently supported by the library component, you MUST flag this immediately by writing `[COMPONENT MUTATION DETECTED]` in the UI Spec draft. This flag will trigger the Impact Analysis & Backward Sync protocol.
   - **Reusability Evaluation**: If a new component is proposed, evaluate its reusability across PRD/Epic/Story. If highly reusable (Tier 1), tag it as `Candidate for Library` in the spec.
3.3. **[INTERACTIVE COMPONENT PROTOTYPING GATE]**:
   - **MANDATORY**: For any newly proposed component tagged as `Candidate for Library`, you MUST generate:
     1. A physical static HTML preview file (e.g. `html-preview-[name].html`)
     2. A UX Pattern Markdown file (e.g. `ux-pattern-[name].md`) describing hover states, interactions, and behavior.
   - **Zero-Trust Hard Gate**: You MUST run the validator script: `node .agent/scripts/validate-library-eligibility.js --component <ComponentName>`. 
   - If the script fails (Exit Code 1), you are FORBIDDEN from using Stitch MCP to generate a mockup and FORBIDDEN from registering the component into `DESIGN.md`. You MUST fix the missing files and re-run.
3.5. **[SEMANTIC AST LAYOUT GENERATION]**: During UI Specification generation, if a Mermaid diagram or layout structure is established in the UI Spec or designs, you MUST parse this visual structure and generate the strict Semantic Layout AST JSON file at `ast-constraint-story-{story_id}.json` immediately, rather than waiting for HTML preview approval. This ensures the AST layout rules are available to guide early implementation and `/spec-compliance` checks.
   - This JSON must map the layout structure into structural zones to serve as an architectural law for the Dev-Agent.
   - **Supported Primitives:** `HStack`, `VStack`, `Flex`, `ZStack` (for explicit overlapping), `GridArea` (for 2D layouts), and `ResponsiveZone` (for breakpoint mutations).
   - **Semantic Tagging:** Each node must explicitly state its semantic intent to avoid semantic downgrade (e.g., `{ type: 'VStack', as: 'section', role: 'region' }`).
   - **Governed Escape Hatches:** If the layout requires complex/irregular CSS that cannot be expressed purely by layout primitives, you may insert a `CustomLayoutNode`. Any `CustomLayoutNode` MUST include an `annotation` field explaining the necessity for manual CSS.
   - Embed a reference to this JSON inside the UI Spec Draft.
3.6. **[MODAL & DRAWER STYLING RULE]**:
   - **MANDATORY**: Any UI Spec containing Modals, Drawers, or Popovers MUST explicitly mandate the use of opaque semantic background variables (e.g., `var(--bg-card)`) rather than transparent ones (e.g., `var(--bg-color)`). Must specify `React.createPortal` or adequate padding to prevent overflow within 3rd sidebars.
   - **FORBIDDEN**: The UI Spec MUST explicitly forbid the use of inline Tailwind utility classes (e.g. `bg-white`, `opacity-50`, `p-4`) for Modal/Drawer components. Ensure the HTML preview relies entirely on semantic CSS classes from `DESIGN.md`.
3.7. **[ZERO-IT & FORMATTING GATE - HARD GATE]**:
   - **MANDATORY**: You MUST load `.agent/skills/ux-guardian/zero-it-assistance-rule.md` and `.agent/skills/formatting-guardian/SKILL.md` using `view_file`.
   - **ZASF Scoring Table**: Every UI spec MUST contain a dedicated section `## Zero-IT Information Assistance (ZASF) Scoring` listing all UI inputs/metrics with calculated CTS scores ($CTS = T + I + C$).
   - For any component with $CTS \ge 7$, you MUST explicitly mandate `<AIAssistanceTrigger>` or equivalent AI Staff pill in the component hierarchy and HTML preview.
   - For components with $CTS = 5$ or $6$, you MUST mandate `Popover` tooltip info.
   - **Formatting & i18n Mandate**: The UI Spec MUST explicitly mandate that all static text strings be wrapped in `t()` localization keys and all numeric/currency/date values utilize `useFormatter()`.
4. Call Design Consultation skill from `.agent/skills/design-consultation/SKILL.md` to audit spec.
5. **[PLATFORM AI DEBATE GATE]**: Get input from the Native AI of the design tool (e.g., Stitch AI Native) to evaluate if the design should be improved. Run Socratic Debate on these Platform AI's UX recommendations using `ux-agent` and `dev-agent`, and embed the outcomes into the `Platform AI Consultation & Debate Report` section.
5.5. **[CONTINUOUS UX DISCOVERY GATE (SBUP)]**:
   - During the generation of the UI Spec, if the `ux-guardian` or Design Consultation reveals a novel UI component, layout pattern, or complex interaction behavior (e.g., a new filter builder, multi-step wizard, custom drag-and-drop hierarchy) that is NOT already standardized in the global `DESIGN.md`, you MUST trigger the Structured Behavioral Update Process (SBUP).
   - Log this as a "Candidate UX Pattern" inside the spec and propose updating the global `DESIGN.md` (or `project-context.md`) to standardize it for future reuse.
6. **[MANDATORY HTML PREVIEW GATE]**: Generate a static zero-logic HTML/CSS preview file at `html-preview-story-{story_id}.html` (in the same directory where the UI spec will go) and prompt the user to open it in their browser for visual review. Do NOT proceed to the next step until the user approves this preview layout.
   - **⚠️ ZERO-TRUST MANDATE**: The UI Spec MUST NOT contain any manual Mockup IDs or Stitch IDs inside the Markdown text. The Agent is FORBIDDEN from manually writing Mockup IDs into the file.
   - **[EC-P6-001 Mitigation]**: The agent MUST instruct the human user to run `python3 .agent/scripts/approve-design.py --story_dir <path> --stitch_id "<id_if_any>"` manually in a separate terminal. This will generate a cryptographic `design-approval.json.sig` containing the approved Mockup ID and Git Hash. Hard Gates will ONLY read the Mockup ID from this signed JSON, never from the Markdown. **EXCEPTION (Auto-Approve Mode):** If `--auto-approve` is active AND the story has NO structural UI changes (e.g. backend-only or unchanged UI in a `refactored` story), you MUST skip this wait and proceed immediately.

6.4. **[DYNAMIC OVERRIDES VALIDATION - HARD GATE]**: Before finalizing, you MUST run:
   `node .agent/scripts/validate-design-overrides.js --spec <path-to-draft> --design "_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md" --epic {epic_id}`
   This script parses Section 17 of `DESIGN.md` and enforces that any rules belonging to your Epic are present in your UI Spec Draft. If the script exits with an error (Exit Code 1), you MUST fix the draft and re-run the validation until it passes. Do NOT proceed to finalize if this fails.

6.5. **[STRICT GATE GUARDIAN]** Save the UI Spec Draft:
   - **DO NOT save directly as `ui-spec.md`**. You MUST save the file as a draft: `ui-spec-draft.md` (or `ui-spec-draft-story-{story_id}.md` for flat layouts).
   - **CRITICAL - OKF FRONTMATTER**: You MUST start the generated file with this exact YAML frontmatter structure to ensure Graph connectivity:
     ```yaml
     ---
     type: I-Wish UI Spec
     title: "UI Specification: Story {story_id} — {story_title}"
     description: "UI specification for Story {story_id}"
     resource: "file://{absolute_path_to_this_file}"
     tags: ["ui-spec", "design"]
     timestamp: "{current_date}"
     links_to: ["<path_to_parent_story_file>"] # Adjust to actual path of the parent story
     dependencies: [] # Add any dependent story IDs if applicable
     storyId: '{story_id}'
     status: 'complete'
     ---
     ```
   - After saving the draft, you MUST execute the finalizer script to promote it:
     `node .agent/scripts/finalize-ui-spec.js --story={story_id} --draft=<path-to-draft> --out=<path-to-final-ui-spec>`
   - The script will physically verify that the HTML file exists. If it does not, the script will DELETE your draft and abort.

6.6. **[MANDATORY MOCK DATA GENERATION GATE]**:
   - You MUST run the mock data generator to extract API contracts from `data-spec.md` into physical JSON mock files for UI development.
   - To prevent crashing the main Orchestrator due to Prisma AST depth or timeouts, you MUST run this as an Ephemeral Sub-task using a background command (e.g. `timeout 60s ...`) or a 60s watchdog. Do not run it inline without timeout!
   - Example Command:
     ```bash
     TASK_ID=$(uuidgen | cut -d'-' -f1)
     DB_CONTAINER=$(docker run -d -e POSTGRES_PASSWORD=postgres postgres:16-alpine)
     sleep 5
     DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $DB_CONTAINER)
     DATABASE_URL="postgresql://postgres:postgres@$DB_IP:5432/postgres"
     
     docker run --rm -v "$(pwd):/workspace" -w /workspace -e DATABASE_URL="$DATABASE_URL" python:3.10-slim bash -c "pip install psycopg2-binary && timeout 60s python3 .agent/scripts/generate-contract-mocks.py --story-path <path-to-parent_story_file>" > "mock_output_${TASK_ID}.log" 2> "mock_failed_${TASK_ID}.err"
     
     docker rm -f $DB_CONTAINER
     ```
   - If the task exceeds 60 seconds (exit code 124) or fails with Exit Code 1 (Hard Halt), it means it detected an unauthorized attempt to mock Auth/Tenant data (EC-P6-002, EC-P8-001) or a recursion attack. You MUST transition state to `FAILED_VALIDATION` and HALT immediately. Do not attempt an emergency override.
   - After generation, you MUST run: `python3 .agent/scripts/validate-mock-schema.py --story-path <path-to-parent_story_file>` to prove deterministic schema parsing (EC-P11-001). If it fails, HALT immediately.
   - You MUST then generate a Verification Manifest and call `watchmen-mcp:sign_pipeline_gate` to cryptographically sign it. If Watchmen MCP fails or does not respond, the pipeline will Strict Halt (Exit 1) — emergency overrides are strictly forbidden (Mitigates P5, P12).
   - If mock files are generated, the script will automatically append the `[MOCK_APPROVED]` status to `ui-spec.md`. DO NOT change the main story status to `completed-with-mock`. The Pre-flight Gate will now verify the Verification Manifest signature instead of relying on the story status.

7. Run scanner on the generated UI Spec file:

   `node .agent/scripts/design-compliance-scanner.js --spec <path-to-generated-ui-spec.md> --design DESIGN.md`
8. Ensure scanner passes (Exit Code 0).
</steps>


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered after UX design specification.

### PUSH + FOUNDATION: Create PC-3 (Core-UX-Design)

1. Load `notebook-lifecycle-manager` → Create `{Project}/Core-UX-Design` (PC-3)
2. Push ux-design.md + design system files as sources
3. Load `notebook-cross-query-engine` → Cross-query PC-3 ↔ PC-2 (UX feasible with tech stack?)
4. Update `foundation-checklist.yaml`: set `PC-3.status = created`
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase discovery`. If it fails, HALT immediately and do not proceed.
