# Step US-03: Access Control & Formatting (Deterministic Gate)

**Goal:** Enforce Role-Based Access Control (PBAC/RBAC) and Formatting Guardian rules across the UI Spec.

## 1. Context Loading
- **Phase 2 Output:** Read the draft UI Spec containing Structure and Behavior.
- **Formatting Guardian:** Load `/.agent/skills/formatting-guardian/SKILL.md`.
- **PBAC Audit (Conditional):** Check the story file. If `Access_Control_Required: true`, load `/.agent/skills/pbac-intake-audit/SKILL.md`.

## 2. Output Generation: Security & Formatting
Update the draft UI Spec with the following:
- **🔒 Access Control (PBAC):** 
  - If required, create a detailed Access Control Matrix mapping roles to resources and actions.
  - Specify visual indicators for unauthorized states (disabled buttons, custom tooltips, hidden tabs).
  - *If not required, you may explicitly state: "Access Control: N/A for this story."*
- **Formatting Compliance:**
  - Audit the UI Spec text. Replace any hardcoded formats (like `.toLocaleString()`, `$`, or raw text inside JSX components).
  - Explicitly mandate the use of dynamic formatting hooks (e.g. `useFormatter`) and i18n translations (e.g. `t()`).
  - Add a short Formatting Guardian compliance statement confirming adherence.

## 3. Inline Gate: Formatting Guardian Scan
Before proceeding, you MUST run the Tier 1 deterministic validator on the draft UI Spec.

```bash
# Run the scanner
node .agent/scripts/formatting-guardian-scanner.js --file <path-to-draft-ui-spec.md>
```
- **IF EXIT CODE 0:** ✅ Proceed to Step US-04.
- **IF EXIT CODE 1:** ❌ The script found banned patterns (e.g., `$`, `toFixed`, static formats). You MUST fix the UI Spec and re-run the scanner until it passes. Do NOT proceed to the next step.
