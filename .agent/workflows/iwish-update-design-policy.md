---
legacy_name: 'update-design-policy'
description: 'Safely add new forbidden tokens or mandatory component logic to a Design System policy JSON block.'
disable-model-invocation: true
---

# Workflow: Update UI Compliance Policy (Edge-Case Fixer)

## Objective
The UI Compliance Policy controls how `dev-agent` renders UI components by banning anti-patterns (forbidden tokens) or enforcing structural logic (mandatory codes). This workflow automates updating the JSON policy without risking manual typos.

## Execution Steps

### 1. Identify Target Portal
Ask the user: "Which portal's design system do you want to update?" (e.g., `admin`, `webstore`, `sales`).
Determine the path to the portal's `DESIGN.md`: 
- Because I-Wish supports multiple Layout Modes (Flat, Hierarchical, Evolution Lab), you MUST NOT assume a hardcoded path.
- Use `find . -name "DESIGN.md" | grep "<portal-slug>"` to dynamically locate the exact path to the target DESIGN.md before proceeding.

### 2. Identify Update Type
Ask the user what kind of rule they want to add:
- **[1] Forbidden Token:** Ban a specific CSS class or string (e.g., `-mt-` or `dark:`).
- **[2] Mandatory Logic:** Require specific logic inside specific files (e.g., require `useMemo` in `Chart`).

### 3. Extract & Display Current Policy
Before making changes, explain the action that will be performed.

### 4. Execute Update Script
Run the helper Python script to safely modify the JSON block using the **dynamically resolved path** from Step 1.

**For Forbidden Tokens:**
```bash
python3 .agent/scripts/update-ui-tokens.py \
  --design "<RESOLVED_PATH_TO_DESIGN.MD>" \
  --action add-forbidden \
  --pattern="<regex_pattern>" \
  --message="<custom_error_message>"
```

**For Mandatory Logic:**
```bash
python3 .agent/scripts/update-ui-tokens.py \
  --design "<RESOLVED_PATH_TO_DESIGN.MD>" \
  --action add-mandatory \
  --match-filenames="<Comma,Separated,Component,Names>" \
  --requires-codes="<Comma,Separated,Hooks,Or,Codes>" \
  --message="<custom_error_message>"
```

### 5. Validate & Complete
1. Use `cat` or `view_file` on `<RESOLVED_PATH_TO_DESIGN.MD>` to confirm the JSON block was successfully updated.
2. Inform the user:
   > "✅ The policy has been updated. The `dev-agent` will instantly enforce this rule on all future component implementations through the Spec Compliance Checkpoint without requiring a system restart."

## Exit Criteria
- The python script executed successfully (Exit Code 0).
- The user has been informed of the immediate runtime enforcement.
