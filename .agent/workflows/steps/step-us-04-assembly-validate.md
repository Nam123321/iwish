# Step US-04: Assembly & Final Validation (Checkpoint)

**Goal:** Assemble the final UI Spec, integrate AI/Design consultations, and pass the Triple Validator Gate before finishing.

## 1. Context Loading
- **Draft UI Spec:** Load the outputs from Phase 1, 2, and 3.
- **Design Consultation:** Load `/.agent/skills/design-consultation/SKILL.md` (Design Army Pattern).
- **User Simulation (Conditional):** If applicable, load `/.agent/skills/user-simulation-guardian/SKILL.md`.

## 2. Output Generation: Final Assembly
Generate the final sections for the `ui-spec.md` file:
- **Design Consultation Report:** Embed the 5 specialist lenses (Typography, Color, Layout, Interaction, IA).
- **Platform AI Consultation & Debate Report:** Prepare the Socratic Debate section for when the Native AI (Stitch/Figma) returns recommendations, checking against `ux-agent` and `dev-agent` views.
- **User Simulation Results:** (If applicable) Personas tested, scenarios applied, non-linear paths.
- **5 Visual Options Framework (MANDATORY):** You must prepare the 5-Option visual framework. At this stage (Phase 4 of UI Spec), you MUST explicitly generate **Option 4 (HTML Prototype)** to visualize the Layout, UX Pattern, and User Flow. This HTML must comply with `DESIGN.md`.
  - **Option 1:** Stitch MCP - Dark variant (Generated in Step 3).
  - **Option 2:** Stitch MCP - Light variant (Generated in Step 3).
  - **Option 3:** Stitch MCP - Hybrid/Creative variant (Generated in Step 3).
  - **Option 4:** HTML Prototype - Visualizes Layout, UX Pattern, and User Flow. (MUST be generated NOW to replace the static `.md` spec visualization).
  - **Option 5:** HTML/CSS Interactive prototype.

  ```markdown
  ## 5 Visual Options Framework

  | Criteria | Opt 1 (Stitch Dark) | Opt 2 (Stitch Light) | Opt 3 (Stitch Hybrid) | Opt 4 (HTML Layout) | Opt 5 (HTML/CSS) |
  |----------|---------------------|----------------------|-----------------------|---------------------|------------------|
  | PRD Alignment | ? | ? | ? | ? | ? |
  | Persona Fit | ? | ? | ? | ? | ? |
  | Accessibility | ? | ? | ? | ? | ? |
  | Implementability | ? | ? | ? | ? | ? |
  | Design Sys Compliance | ? | ? | ? | ? | ? |
  ```
  **MANDATORY ACTION:** The agent MUST generate the Option 4 HTML layout file and present it to the user for Layout/UX approval. Do NOT invoke Stitch MCP for Options 1-3 yet; Options 1-3 will be generated in Step 3 of the `/flow` pipeline using this approved Option 4 layout as the foundation.
- Ensure the `ui-spec.md` is saved with the correct OKF YAML frontmatter (`type: I-Wish UI Spec`, etc.).

## 3. Final Gate: Triple Validator (MANDATORY)
Before finishing the workflow, you MUST run all three Tier 1 validation scripts to ensure nothing was lost during assembly.

```bash
# Gate 1: Design Token Compliance
node .agent/scripts/design-compliance-scanner.js --spec <path-to-ui-spec.md> --design <path-to-design.md>

# Gate 2: CTS/ZASF Compliance
python3 .agent/scripts/zasf_compliance_scanner.py --file <path-to-ui-spec.md>

# Gate 3: Formatting Guardian Compliance
node .agent/scripts/formatting-guardian-scanner.js --file <path-to-ui-spec.md>
```

- **ALL 3 MUST PASS (Exit Code 0).** If any fail, you MUST fix the `ui-spec.md` file and re-run the failed scanner until it passes.
- Once all pass, the UI Spec generation is complete. Proceed to design tool mockups or handoff.
