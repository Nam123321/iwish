# Step US-02: Behavior, Data Binding & CTS (Critical Gate)

**Goal:** Map user interactions, state transitions, and enforce Zero-IT assistance scoring (CTS) for all UI fields.

## 1. Context Loading
- **Phase 1 Output:** Read the generated Structure & Layout from Step US-01.
- **Story ACs:** Ensure full list of Acceptance Criteria (AC) is loaded for verb validation.
- **Zero-IT Assistance Rule:** Load `/.agent/skills/ux-guardian/zero-it-assistance-rule.md` to understand the CTS scoring framework.

## 2. Output Generation: Behavior & CTS
Generate the following sections for the UI Spec:
- **Screen Transitions & Interactive States:**
  - Create a Mermaid State Diagram (`stateDiagram-v2`).
  - Create a State Transition Matrix mapping triggers to target states and React routing/hooks.
- **Interaction Flow & AC Verbs Validation:**
  - Create a table mapping each functional AC verb to its corresponding UI component and visual state/feedback.
  - Define any Visual Fidelity Gates (e.g. actions needing manual QA like drag-and-drop).
- **Zero-IT Assistance (CTS Scoring Table):**
  - **MANDATORY:** Evaluate EVERY form field, complex metric, or interactive element in the story against the ZASF scoring framework.
  - Create a table with: Field/Element, Complexity Score ($CTS = T + I + C$), Required Assistance (None / Tooltip / Ask AI).
  - Explicitly define the i18n/tooltip text or AI routing for high-scoring items.

## 3. Inline Gate: ZASF Compliance Scan
Before proceeding, you MUST run the Tier 1 deterministic validator on the draft UI Spec.

```bash
# Run the scanner
python3 .agent/scripts/zasf_compliance_scanner.py --file <path-to-draft-ui-spec.md>
```
- **IF EXIT CODE 0:** ✅ Proceed to Step US-03.
- **IF EXIT CODE 1:** ❌ The script found a compliance failure (e.g. missing "Zero-IT" section or CTS table). You MUST fix the UI Spec and re-run the scanner until it passes. Do NOT proceed to the next step.
